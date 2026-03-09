import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const ALLOWED_ORIGINS = [
  "https://admin.moom.fit",
  "https://member.moom.fit",
  "https://moom.lovable.app",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

/**
 * Claim a completed quest instance.
 * Awards XP, Coin, badge, coupon as defined in the quest template.
 *
 * Body: { quest_instance_id: string, member_id: string }
 */
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
    const body = await req.json();
    const { quest_instance_id, member_id } = body;

    if (!quest_instance_id || !member_id) {
      return new Response(JSON.stringify({ error: "Missing quest_instance_id or member_id" }), { status: 400, headers: cors });
    }

    // Get quest instance with template
    const { data: instance } = await db
      .from("quest_instances")
      .select("*, quest_templates(*)")
      .eq("id", quest_instance_id)
      .eq("member_id", member_id)
      .single();

    if (!instance) {
      return new Response(JSON.stringify({ error: "Quest instance not found" }), { status: 404, headers: cors });
    }

    if (instance.status === "claimed") {
      return new Response(JSON.stringify({ status: "already_claimed" }), { status: 200, headers: cors });
    }

    if (instance.status !== "completed") {
      return new Response(JSON.stringify({ error: "Quest not completed yet", current_status: instance.status }), { status: 400, headers: cors });
    }

    const template = instance.quest_templates;
    if (!template) {
      return new Response(JSON.stringify({ error: "Quest template not found" }), { status: 500, headers: cors });
    }

    const xpReward = template.xp_reward || 0;
    const coinReward = template.coin_reward || 0;
    const idemKey = `quest_claim:${quest_instance_id}`;

    // Get profile
    const { data: profile } = await db
      .from("member_gamification_profiles")
      .select("*")
      .eq("member_id", member_id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "No gamification profile" }), { status: 400, headers: cors });
    }

    const newTotalXp = (profile.total_xp || 0) + xpReward;
    const newTotalPoints = (profile.total_points || 0) + coinReward;
    const newAvailablePoints = (profile.available_points || 0) + coinReward;

    // Award XP
    if (xpReward > 0) {
      await db.from("xp_ledger").insert({
        member_id,
        event_type: "quest_claimed",
        delta: xpReward,
        balance_after: newTotalXp,
        idempotency_key: `xp:${idemKey}`,
        metadata: { quest_instance_id, quest_template_id: template.id, quest_period: template.quest_period },
      });
    }

    // Award Coin
    if (coinReward > 0) {
      await db.from("points_ledger").insert({
        member_id,
        event_type: "quest_claimed",
        delta: coinReward,
        balance_after: newAvailablePoints,
        idempotency_key: `pts:${idemKey}`,
        metadata: { quest_instance_id, quest_template_id: template.id },
      });
    }

    // Check level up
    const { data: levels } = await db
      .from("gamification_levels")
      .select("*")
      .eq("is_active", true)
      .order("level_number", { ascending: true });

    let newLevel = profile.current_level || 1;
    if (levels) {
      for (const lvl of levels) {
        if (newTotalXp >= lvl.xp_required && lvl.level_number > newLevel) {
          newLevel = lvl.level_number;
        }
      }
    }

    // Update profile
    await db.from("member_gamification_profiles").update({
      total_xp: newTotalXp,
      total_points: newTotalPoints,
      available_points: newAvailablePoints,
      current_level: newLevel,
    }).eq("member_id", member_id);

    // Award badge if specified
    if (template.badge_reward_id) {
      await db.from("badge_earnings").insert({
        member_id,
        badge_id: template.badge_reward_id,
        event_ref: idemKey,
      });
    }

    // Issue coupon if specified
    if (template.coupon_reward_template_id) {
      const { data: couponTemplate } = await db
        .from("coupon_templates")
        .select("*")
        .eq("id", template.coupon_reward_template_id)
        .single();

      if (couponTemplate) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (couponTemplate.valid_days || 14));
        await db.from("coupon_wallet").insert({
          member_id,
          coupon_template_id: couponTemplate.id,
          expires_at: expiresAt.toISOString(),
          source_type: "quest_reward",
          source_id: quest_instance_id,
        });
      }
    }

    // Mark as claimed
    await db.from("quest_instances").update({
      status: "claimed",
      claimed_at: new Date().toISOString(),
    }).eq("id", quest_instance_id);

    // Audit
    await db.from("gamification_audit_log").insert({
      member_id,
      event_type: "quest_claimed",
      action_key: `quest_${template.quest_period}`,
      xp_delta: xpReward,
      points_delta: coinReward,
      metadata: { quest_instance_id, quest_template_id: template.id, quest_name: template.name_en },
      flagged: false,
    });

    return new Response(JSON.stringify({
      status: "claimed",
      xp_granted: xpReward,
      coin_granted: coinReward,
      new_total_xp: newTotalXp,
      new_available_points: newAvailablePoints,
      new_level: newLevel,
    }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("gamification-claim-quest error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: cors });
  }
});
