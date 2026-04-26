import { canAccessMember } from "../_shared/authz.ts";
import { createDb, createUserDb, getCorsHeaders } from "../_shared/db.ts";

interface RedeemRequest {
  reward_id: string;
  member_id: string;
  idempotency_key: string;
}

interface VoidRequest {
  redemption_id: string;
  reason?: string;
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: cors });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });

    const userClient = createUserDb(authHeader);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });

    const db = createDb();
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "redeem";

    // ==================== VOID / ROLLBACK ====================
    if (action === "void") {
      const body: VoidRequest = await req.json();
      const { redemption_id, reason } = body;

      if (!redemption_id) {
        return new Response(JSON.stringify({ error: "Missing redemption_id" }), { status: 400, headers: cors });
      }

      // Check caller is admin
      const { data: hasAccess } = await db.rpc("has_min_access_level", {
        _user_id: user.id,
        _min_level: "level_3_manager",
      });
      if (!hasAccess) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: cors });

      const { data: redemption } = await db
        .from("reward_redemptions")
        .select("*")
        .eq("id", redemption_id)
        .single();

      if (!redemption) return new Response(JSON.stringify({ error: "Redemption not found" }), { status: 404, headers: cors });
      if (redemption.status !== "pending" && redemption.status !== "fulfilled") {
        return new Response(JSON.stringify({ error: "Cannot void a redemption with status: " + redemption.status }), { status: 400, headers: cors });
      }

      // Restore points
      const { data: profile } = await db
        .from("member_gamification_profiles")
        .select("available_points, total_points")
        .eq("member_id", redemption.member_id)
        .single();

      const restoredPoints = (profile?.available_points || 0) + redemption.points_spent;

      await db.from("points_ledger").insert({
        member_id: redemption.member_id,
        event_type: "rollback",
        delta: redemption.points_spent,
        balance_after: restoredPoints,
        redemption_id: redemption.id,
        idempotency_key: `void:${redemption_id}`,
        metadata: { reason: reason || "admin_void", original_redemption_id: redemption_id },
      });

      await db.from("member_gamification_profiles").update({
        available_points: restoredPoints,
      }).eq("member_id", redemption.member_id);

      // Restore stock
      await db.from("gamification_rewards").update({
        redeemed_count: Math.max(0, ((await db.from("gamification_rewards").select("redeemed_count").eq("id", redemption.reward_id).single()).data?.redeemed_count || 1) - 1),
      }).eq("id", redemption.reward_id);

      // Update redemption status
      await db.from("reward_redemptions").update({
        status: "rolled_back",
        cancelled_at: new Date().toISOString(),
      }).eq("id", redemption_id);

      // Audit
      await db.from("gamification_audit_log").insert({
        member_id: redemption.member_id,
        event_type: "rollback",
        action_key: "reward_voided",
        xp_delta: 0,
        points_delta: redemption.points_spent,
        metadata: { redemption_id, reason, voided_by: user.id },
        flagged: false,
      });

      return new Response(JSON.stringify({ status: "voided", points_restored: redemption.points_spent }), {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ==================== REDEEM ====================
    const body: RedeemRequest = await req.json();
    const { reward_id, member_id, idempotency_key } = body;

    if (!reward_id || !member_id || !idempotency_key) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: cors });
    }

    const canRedeem = await canAccessMember(db, user.id, member_id, "level_1_minimum");
    if (!canRedeem) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: cors })
    }

    // ATOMIC: All checks (idempotency, balance, stock, level, daily limit)
    // and writes (deduct points, decrement stock, insert redemption + ledger + audit)
    // happen inside a single Postgres transaction with row-level locks.
    const { data: rpcResult, error: rpcErr } = await db.rpc("process_redeem_reward", {
      p_member_id: member_id,
      p_reward_id: reward_id,
      p_idempotency_key: idempotency_key,
    });

    if (rpcErr) {
      console.error("process_redeem_reward RPC error:", rpcErr);
      return new Response(JSON.stringify({ error: rpcErr.message || "Internal server error" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const result = rpcResult as {
      success: boolean;
      idempotent?: boolean;
      redemption_id?: string;
      points_spent?: number;
      available_points?: number;
      reward_name?: string;
      error_code?: string;
      required?: number;
      available?: number;
      current?: number;
    } | null;

    if (!result || !result.success) {
      const code = result?.error_code || "UNKNOWN";
      const statusMap: Record<string, number> = {
        REWARD_NOT_FOUND: 404,
        PROFILE_NOT_FOUND: 400,
        REWARD_INACTIVE: 400,
        NOT_YET_AVAILABLE: 400,
        EXPIRED: 400,
        OUT_OF_STOCK: 400,
        DAILY_LIMIT_REACHED: 400,
        LEVEL_TOO_LOW: 400,
        INSUFFICIENT_POINTS: 400,
      };
      return new Response(
        JSON.stringify({ error: code, details: result }),
        { status: statusMap[code] || 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    if (result.idempotent) {
      return new Response(
        JSON.stringify({ status: "already_processed", redemption_id: result.redemption_id }),
        { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Fire-and-forget notification (outside the atomic block)
    try {
      await db.from("event_outbox").insert({
        event_type: "gamification.reward_redeemed",
        payload: {
          member_id,
          reward_id,
          redemption_id: result.redemption_id,
          reward_name: result.reward_name,
          points_spent: result.points_spent,
        },
      });
    } catch (notifErr) {
      console.warn("[gamification-redeem-reward] Notification insert failed (non-blocking):", notifErr);
    }

    return new Response(JSON.stringify({
      status: "redeemed",
      redemption_id: result.redemption_id,
      points_spent: result.points_spent,
      available_points: result.available_points,
    }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("gamification-redeem-reward error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: cors });
  }
});
