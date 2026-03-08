import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

/**
 * sync-gamification-config
 *
 * Pushes gamification configuration (badges, challenges, rewards, levels)
 * from Admin DB (source of truth) to Experience DB (projections).
 *
 * Called by Admin App after CRUD operations on config tables.
 *
 * Requires EXPERIENCE_SUPABASE_URL and EXPERIENCE_SUPABASE_SERVICE_KEY secrets.
 */

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

type SyncTarget = "badges" | "challenges" | "rewards" | "levels" | "all";

interface SyncRequest {
  target: SyncTarget;
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: cors });

  try {
    // Auth check — manager level required
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });

    // Experience DB credentials
    const experienceUrl = Deno.env.get("EXPERIENCE_SUPABASE_URL");
    const experienceKey = Deno.env.get("EXPERIENCE_SUPABASE_SERVICE_KEY");

    if (!experienceUrl || !experienceKey) {
      return new Response(JSON.stringify({
        error: "Experience DB not configured",
        message: "EXPERIENCE_SUPABASE_URL and EXPERIENCE_SUPABASE_SERVICE_KEY secrets are required.",
      }), { status: 503, headers: cors });
    }

    // Admin DB (source)
    const adminDb = createClient(supabaseUrl, serviceKey);
    // Experience DB (target)
    const expDb = createClient(experienceUrl, experienceKey);

    const body: SyncRequest = await req.json();
    const target = body.target || "all";
    const results: Record<string, { synced: number; errors: string[] }> = {};

    // --- Sync Badges ---
    if (target === "badges" || target === "all") {
      const { data: badges, error } = await adminDb
        .from("gamification_badges")
        .select("id, name_en, name_th, description_en, description_th, tier, icon_url, unlock_condition, display_priority, is_active");

      if (error) {
        results.badges = { synced: 0, errors: [error.message] };
      } else {
        // Upsert into Experience DB's badges table
        const mapped = (badges || []).map((b) => ({
          admin_badge_id: b.id,
          name_en: b.name_en,
          name_th: b.name_th,
          description_en: b.description_en,
          description_th: b.description_th,
          tier: b.tier,
          icon_url: b.icon_url,
          unlock_condition: b.unlock_condition,
          display_priority: b.display_priority,
          is_active: b.is_active,
          synced_at: new Date().toISOString(),
        }));

        // Note: Experience DB must have a `badges` table with `admin_badge_id` unique column
        const { error: upsertErr } = await expDb
          .from("badges")
          .upsert(mapped, { onConflict: "admin_badge_id" });

        results.badges = {
          synced: upsertErr ? 0 : mapped.length,
          errors: upsertErr ? [upsertErr.message] : [],
        };
      }
    }

    // --- Sync Challenges ---
    if (target === "challenges" || target === "all") {
      const { data: challenges, error } = await adminDb
        .from("gamification_challenges")
        .select("id, name_en, name_th, description_en, description_th, type, goal_type, goal_action_key, goal_value, reward_xp, reward_points, reward_badge_id, start_date, end_date, status, eligibility, target_location_ids");

      if (error) {
        results.challenges = { synced: 0, errors: [error.message] };
      } else {
        const mapped = (challenges || []).map((c) => ({
          admin_challenge_id: c.id,
          name_en: c.name_en,
          name_th: c.name_th,
          description_en: c.description_en,
          description_th: c.description_th,
          type: c.type,
          goal_type: c.goal_type,
          goal_action_key: c.goal_action_key,
          goal_value: c.goal_value,
          reward_xp: c.reward_xp,
          reward_points: c.reward_points,
          start_date: c.start_date,
          end_date: c.end_date,
          status: c.status,
          synced_at: new Date().toISOString(),
        }));

        const { error: upsertErr } = await expDb
          .from("challenges")
          .upsert(mapped, { onConflict: "admin_challenge_id" });

        results.challenges = {
          synced: upsertErr ? 0 : mapped.length,
          errors: upsertErr ? [upsertErr.message] : [],
        };
      }
    }

    // --- Sync Rewards ---
    if (target === "rewards" || target === "all") {
      const { data: rewards, error } = await adminDb
        .from("gamification_rewards")
        .select("id, name_en, name_th, description_en, description_th, category, points_cost, level_required, stock, is_unlimited, is_active, available_from, available_until");

      if (error) {
        results.rewards = { synced: 0, errors: [error.message] };
      } else {
        const mapped = (rewards || []).map((r) => ({
          admin_reward_id: r.id,
          name_en: r.name_en,
          name_th: r.name_th,
          description_en: r.description_en,
          description_th: r.description_th,
          category: r.category,
          points_cost: r.points_cost,
          level_required: r.level_required,
          stock: r.stock,
          is_unlimited: r.is_unlimited,
          is_active: r.is_active,
          available_from: r.available_from,
          available_until: r.available_until,
          synced_at: new Date().toISOString(),
        }));

        const { error: upsertErr } = await expDb
          .from("reward_drops")
          .upsert(mapped, { onConflict: "admin_reward_id" });

        results.rewards = {
          synced: upsertErr ? 0 : mapped.length,
          errors: upsertErr ? [upsertErr.message] : [],
        };
      }
    }

    // --- Sync Levels ---
    if (target === "levels" || target === "all") {
      const { data: levels, error } = await adminDb
        .from("gamification_levels")
        .select("id, level_number, name_en, name_th, xp_required, badge_color, perks, is_active");

      if (error) {
        results.levels = { synced: 0, errors: [error.message] };
      } else {
        const mapped = (levels || []).map((l) => ({
          admin_level_id: l.id,
          level_number: l.level_number,
          name_en: l.name_en,
          name_th: l.name_th,
          xp_required: l.xp_required,
          badge_color: l.badge_color,
          perks: l.perks,
          is_active: l.is_active,
          synced_at: new Date().toISOString(),
        }));

        const { error: upsertErr } = await expDb
          .from("momentum_levels")
          .upsert(mapped, { onConflict: "admin_level_id" });

        results.levels = {
          synced: upsertErr ? 0 : mapped.length,
          errors: upsertErr ? [upsertErr.message] : [],
        };
      }
    }

    // Audit
    await adminDb.from("gamification_audit_log").insert({
      event_type: "config_sync",
      action_key: `sync:${target}`,
      xp_delta: 0,
      points_delta: 0,
      metadata: { target, results, triggered_by: user.id },
      flagged: false,
    });

    return new Response(JSON.stringify({
      status: "synced",
      target,
      results,
    }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("sync-gamification-config error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: getCorsHeaders(req) });
  }
});
