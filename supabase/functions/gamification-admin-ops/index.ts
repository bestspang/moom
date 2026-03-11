import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const ALLOWED_ORIGINS = [
  "https://admin.moom.fit",
  "https://moom.lovable.app",
  "https://member.moom.fit",
];

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Allow *.lovable.app for preview/dev environments
  if (/^https:\/\/[a-z0-9-]+\.lovable\.app$/.test(origin)) return true;
  return false;
}

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const allowedOrigin = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
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

    // Verify caller
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });

    // Check access level (level_3_manager required)
    const db = createClient(supabaseUrl, serviceKey);
    const { data: hasAccess } = await db.rpc("has_min_access_level", {
      _user_id: user.id,
      _min_level: "level_3_manager",
    });
    if (!hasAccess) return new Response(JSON.stringify({ error: "Forbidden: Manager access required" }), { status: 403, headers: cors });

    const body = await req.json();
    const { action, member_id, value, reason, badge_id, coupon_template_id } = body;

    if (!action || !member_id || !reason) {
      return new Response(JSON.stringify({ error: "Missing required fields: action, member_id, reason" }), { status: 400, headers: cors });
    }

    // Verify member exists
    const { data: member } = await db.from("members").select("id").eq("id", member_id).maybeSingle();
    if (!member) return new Response(JSON.stringify({ error: "Member not found" }), { status: 404, headers: cors });

    let result: Record<string, unknown> = {};

    switch (action) {
      case "adjust_xp": {
        const delta = Number(value) || 0;
        if (delta === 0) return new Response(JSON.stringify({ error: "Value must be non-zero" }), { status: 400, headers: cors });

        // Get current profile
        let { data: profile } = await db.from("member_gamification_profiles").select("*").eq("member_id", member_id).maybeSingle();
        if (!profile) {
          const { data: np } = await db.from("member_gamification_profiles")
            .insert({ member_id, total_xp: 0, total_points: 0, available_points: 0, current_level: 1 })
            .select().single();
          profile = np;
        }

        const newXp = Math.max(0, (profile!.total_xp || 0) + delta);
        const idemKey = `admin_adjust_xp:${member_id}:${Date.now()}`;

        await db.from("xp_ledger").insert({
          member_id,
          event_type: "admin_adjustment",
          delta,
          balance_after: newXp,
          idempotency_key: idemKey,
          metadata: { reason, admin_user_id: user.id },
        });

        await db.from("member_gamification_profiles").update({ total_xp: newXp }).eq("member_id", member_id);

        await db.from("gamification_audit_log").insert({
          member_id,
          event_type: "admin_adjust_xp",
          action_key: "admin_adjustment",
          xp_delta: delta,
          points_delta: 0,
          staff_id: user.id,
          metadata: { reason, new_total: newXp },
          flagged: false,
        });

        result = { xp_delta: delta, new_total_xp: newXp };
        break;
      }

      case "adjust_coin": {
        const delta = Number(value) || 0;
        if (delta === 0) return new Response(JSON.stringify({ error: "Value must be non-zero" }), { status: 400, headers: cors });

        let { data: profile } = await db.from("member_gamification_profiles").select("*").eq("member_id", member_id).maybeSingle();
        if (!profile) {
          const { data: np } = await db.from("member_gamification_profiles")
            .insert({ member_id, total_xp: 0, total_points: 0, available_points: 0, current_level: 1 })
            .select().single();
          profile = np;
        }

        const newAvail = Math.max(0, (profile!.available_points || 0) + delta);
        const newTotal = Math.max(0, (profile!.total_points || 0) + (delta > 0 ? delta : 0));
        const idemKey = `admin_adjust_coin:${member_id}:${Date.now()}`;

        await db.from("points_ledger").insert({
          member_id,
          event_type: "admin_adjustment",
          delta,
          balance_after: newAvail,
          idempotency_key: idemKey,
          metadata: { reason, admin_user_id: user.id },
        });

        await db.from("member_gamification_profiles").update({
          available_points: newAvail,
          total_points: newTotal,
        }).eq("member_id", member_id);

        await db.from("gamification_audit_log").insert({
          member_id,
          event_type: "admin_adjust_coin",
          action_key: "admin_adjustment",
          xp_delta: 0,
          points_delta: delta,
          staff_id: user.id,
          metadata: { reason, new_available: newAvail },
          flagged: false,
        });

        result = { coin_delta: delta, new_available: newAvail };
        break;
      }

      case "grant_badge": {
        if (!badge_id) return new Response(JSON.stringify({ error: "badge_id required" }), { status: 400, headers: cors });

        const { data: badge } = await db.from("gamification_badges").select("id, name_en").eq("id", badge_id).maybeSingle();
        if (!badge) return new Response(JSON.stringify({ error: "Badge not found" }), { status: 404, headers: cors });

        const { error: insertErr } = await db.from("badge_earnings").insert({
          member_id,
          badge_id,
          event_ref: `admin_grant:${user.id}:${Date.now()}`,
        });

        if (insertErr) {
          if (insertErr.code === "23505") return new Response(JSON.stringify({ error: "Member already has this badge" }), { status: 409, headers: cors });
          throw insertErr;
        }

        await db.from("gamification_audit_log").insert({
          member_id,
          event_type: "admin_grant_badge",
          action_key: "grant_badge",
          staff_id: user.id,
          metadata: { reason, badge_id, badge_name: badge.name_en },
          flagged: false,
        });

        result = { badge_granted: badge_id };
        break;
      }

      case "revoke_badge": {
        if (!badge_id) return new Response(JSON.stringify({ error: "badge_id required" }), { status: 400, headers: cors });

        const { data: earning } = await db.from("badge_earnings")
          .select("id")
          .eq("member_id", member_id)
          .eq("badge_id", badge_id)
          .maybeSingle();

        if (!earning) return new Response(JSON.stringify({ error: "Member does not have this badge" }), { status: 404, headers: cors });

        await db.from("badge_earnings").delete().eq("id", earning.id);

        await db.from("gamification_audit_log").insert({
          member_id,
          event_type: "admin_revoke_badge",
          action_key: "revoke_badge",
          staff_id: user.id,
          metadata: { reason, badge_id },
          flagged: false,
        });

        result = { badge_revoked: badge_id };
        break;
      }

      case "issue_coupon": {
        if (!coupon_template_id) return new Response(JSON.stringify({ error: "coupon_template_id required" }), { status: 400, headers: cors });

        const { data: template } = await db.from("coupon_templates")
          .select("id, name_en, valid_days")
          .eq("id", coupon_template_id)
          .eq("is_active", true)
          .maybeSingle();

        if (!template) return new Response(JSON.stringify({ error: "Coupon template not found or inactive" }), { status: 404, headers: cors });

        const expiresAt = new Date(Date.now() + (template.valid_days || 30) * 86400000).toISOString();

        const { error: insertErr } = await db.from("coupon_wallet").insert({
          member_id,
          coupon_template_id,
          expires_at: expiresAt,
          status: "active",
          source_type: "admin_manual",
          source_id: user.id,
        });
        if (insertErr) throw insertErr;

        await db.from("gamification_audit_log").insert({
          member_id,
          event_type: "admin_issue_coupon",
          action_key: "issue_coupon",
          staff_id: user.id,
          metadata: { reason, coupon_template_id, template_name: template.name_en, expires_at: expiresAt },
          flagged: false,
        });

        result = { coupon_issued: coupon_template_id, expires_at: expiresAt };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400, headers: cors });
    }

    return new Response(JSON.stringify({ status: "success", action, ...result }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("gamification-admin-ops error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: cors });
  }
});
