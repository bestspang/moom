import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const FREEZE_COST_RP = 50;

const ALLOWED_ORIGINS = [
  "https://admin.moom.fit",
  "https://member.moom.fit",
  "https://moom.lovable.app",
];

const corsHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  const cors = { ...corsHeaders, "Access-Control-Allow-Origin": allowedOrigin };

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

    // Resolve member_id
    const { data: identity } = await db
      .from("identity_map")
      .select("admin_entity_id")
      .eq("experience_user_id", user.id)
      .eq("entity_type", "member")
      .eq("is_verified", true)
      .maybeSingle();

    const memberId = identity?.admin_entity_id;
    if (!memberId) return new Response(JSON.stringify({ error: "Member not found" }), { status: 404, headers: cors });

    // Check if already frozen for today or tomorrow
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const { data: streak } = await db
      .from("streak_snapshots")
      .select("*")
      .eq("member_id", memberId)
      .eq("streak_type", "daily")
      .maybeSingle();

    if (!streak) {
      return new Response(JSON.stringify({ error: "No active streak to freeze" }), { status: 400, headers: cors });
    }

    if (streak.freeze_until && streak.freeze_until >= tomorrow) {
      return new Response(JSON.stringify({ error: "Streak is already frozen", freeze_until: streak.freeze_until }), { status: 400, headers: cors });
    }

    // Check RP balance
    const { data: profile } = await db
      .from("member_gamification_profiles")
      .select("available_points")
      .eq("member_id", memberId)
      .maybeSingle();

    if (!profile || (profile.available_points ?? 0) < FREEZE_COST_RP) {
      return new Response(JSON.stringify({ error: "Not enough RP", required: FREEZE_COST_RP, available: profile?.available_points ?? 0 }), { status: 400, headers: cors });
    }

    // Deduct RP
    const newAvail = (profile.available_points ?? 0) - FREEZE_COST_RP;
    const idemKey = `streak_freeze:${memberId}:${tomorrow}`;

    await db.from("points_ledger").insert({
      member_id: memberId,
      event_type: "streak_freeze",
      delta: -FREEZE_COST_RP,
      balance_after: newAvail,
      idempotency_key: idemKey,
      metadata: { freeze_until: tomorrow },
    }).onConflict("idempotency_key").ignoreDuplicates();

    await db.from("member_gamification_profiles").update({
      available_points: newAvail,
    }).eq("member_id", memberId);

    // Set freeze_until
    await db.from("streak_snapshots").update({
      freeze_until: tomorrow,
    }).eq("id", streak.id);

    // Audit
    await db.from("gamification_audit_log").insert({
      member_id: memberId,
      event_type: "streak_freeze",
      action_key: "streak_freeze",
      xp_delta: 0,
      points_delta: -FREEZE_COST_RP,
      metadata: { freeze_until: tomorrow },
      flagged: false,
    });

    return new Response(JSON.stringify({
      ok: true,
      freeze_until: tomorrow,
      points_spent: FREEZE_COST_RP,
      available_points: newAvail,
    }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("streak-freeze error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: cors });
  }
});
