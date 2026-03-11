import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const ALLOWED_ORIGINS = [
  "https://admin.moom.fit",
  "https://member.moom.fit",
  "https://moom.lovable.app",
];

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  return /^https:\/\/[a-z0-9-]+\.lovable\.app$/.test(origin);
}

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const allowedOrigin = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });

    const db = createClient(supabaseUrl, serviceKey);
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

    // 1) Idempotency check
    const { data: existingRedemption } = await db
      .from("reward_redemptions")
      .select("id, status")
      .eq("idempotency_key", idempotency_key)
      .maybeSingle();

    if (existingRedemption) {
      return new Response(JSON.stringify({ status: "already_processed", redemption_id: existingRedemption.id }), { status: 200, headers: cors });
    }

    // 2) Get reward
    const { data: reward } = await db
      .from("gamification_rewards")
      .select("*")
      .eq("id", reward_id)
      .single();

    if (!reward) return new Response(JSON.stringify({ error: "Reward not found" }), { status: 404, headers: cors });

    // 3) Check active
    if (!reward.is_active) return new Response(JSON.stringify({ error: "Reward is not active" }), { status: 400, headers: cors });

    // 4) Check date window
    const now = new Date();
    if (reward.available_from && new Date(reward.available_from) > now) {
      return new Response(JSON.stringify({ error: "Reward not yet available" }), { status: 400, headers: cors });
    }
    if (reward.available_until && new Date(reward.available_until) < now) {
      return new Response(JSON.stringify({ error: "Reward has expired" }), { status: 400, headers: cors });
    }

    // 5) Get member profile
    const { data: profile } = await db
      .from("member_gamification_profiles")
      .select("*")
      .eq("member_id", member_id)
      .single();

    if (!profile) return new Response(JSON.stringify({ error: "Member has no gamification profile" }), { status: 400, headers: cors });

    // 6) Check level requirement
    if (reward.level_required && profile.current_level < reward.level_required) {
      return new Response(JSON.stringify({ error: "Level requirement not met", required: reward.level_required, current: profile.current_level }), { status: 400, headers: cors });
    }

    // 7) Check points balance
    if (profile.available_points < reward.points_cost) {
      return new Response(JSON.stringify({ error: "Insufficient points", required: reward.points_cost, available: profile.available_points }), { status: 400, headers: cors });
    }

    // 8) Check stock
    if (!reward.is_unlimited) {
      const available = (reward.stock || 0) - (reward.redeemed_count || 0);
      if (available <= 0) {
        return new Response(JSON.stringify({ error: "Reward out of stock" }), { status: 400, headers: cors });
      }
    }

    // 9) Anti-abuse: per-member limit (max 3 of same reward per day)
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const { count: todayCount } = await db
      .from("reward_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("member_id", member_id)
      .eq("reward_id", reward_id)
      .gte("created_at", dayStart.toISOString())
      .neq("status", "rolled_back")
      .neq("status", "cancelled");

    if ((todayCount ?? 0) >= 3) {
      return new Response(JSON.stringify({ error: "Daily redemption limit reached for this reward" }), { status: 400, headers: cors });
    }

    // 10) Debit points
    const newAvailable = profile.available_points - reward.points_cost;

    // Create redemption
    const { data: redemption, error: redemptionErr } = await db
      .from("reward_redemptions")
      .insert({
        reward_id,
        member_id,
        points_spent: reward.points_cost,
        status: "pending",
        idempotency_key,
      })
      .select()
      .single();

    if (redemptionErr) throw redemptionErr;

    // Points ledger debit
    await db.from("points_ledger").insert({
      member_id,
      event_type: "reward_redeemed",
      delta: -reward.points_cost,
      balance_after: newAvailable,
      redemption_id: redemption.id,
      idempotency_key: `pts:redeem:${idempotency_key}`,
      metadata: { reward_id, reward_name: reward.name_en },
    });

    // Update profile
    await db.from("member_gamification_profiles").update({
      available_points: newAvailable,
    }).eq("member_id", member_id);

    // Increment redeemed_count
    await db.from("gamification_rewards").update({
      redeemed_count: (reward.redeemed_count || 0) + 1,
    }).eq("id", reward_id);

    // Audit
    await db.from("gamification_audit_log").insert({
      member_id,
      event_type: "reward_redeemed",
      action_key: "redeem_reward",
      xp_delta: 0,
      points_delta: -reward.points_cost,
      metadata: { reward_id, redemption_id: redemption.id, reward_name: reward.name_en },
      flagged: false,
    });

    // Notification
    await db.from("event_outbox").insert({
      event_type: "gamification.reward_redeemed",
      payload: { member_id, reward_id, redemption_id: redemption.id, reward_name: reward.name_en, points_spent: reward.points_cost },
    });

    return new Response(JSON.stringify({
      status: "redeemed",
      redemption_id: redemption.id,
      points_spent: reward.points_cost,
      available_points: newAvailable,
    }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("gamification-redeem-reward error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: cors });
  }
});
