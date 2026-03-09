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
 * Assigns daily/weekly quests to a member.
 * Called on member login or via cron.
 *
 * Body: { member_id: string, period?: "daily" | "weekly" }
 * Or no body = assign for ALL active members (cron mode).
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
    const body = await req.json().catch(() => ({}));
    const period = body.period || "daily";
    const memberId = body.member_id;

    if (!memberId) {
      return new Response(JSON.stringify({ error: "member_id required" }), { status: 400, headers: cors });
    }

    const now = new Date();
    const questCount = period === "daily" ? 3 : 4;

    // Calculate period boundaries
    let startAt: Date, endAt: Date;
    if (period === "daily") {
      startAt = new Date(now);
      startAt.setUTCHours(0, 0, 0, 0);
      endAt = new Date(startAt);
      endAt.setUTCDate(endAt.getUTCDate() + 1);
    } else {
      // Weekly: Monday to Sunday
      startAt = new Date(now);
      const dayOfWeek = startAt.getUTCDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startAt.setUTCDate(startAt.getUTCDate() - diff);
      startAt.setUTCHours(0, 0, 0, 0);
      endAt = new Date(startAt);
      endAt.setUTCDate(endAt.getUTCDate() + 7);
    }

    // Check if quests already assigned for this period
    const { data: existing } = await db
      .from("quest_instances")
      .select("id")
      .eq("member_id", memberId)
      .gte("start_at", startAt.toISOString())
      .lt("end_at", endAt.toISOString())
      .limit(1);

    if (existing && existing.length > 0) {
      // Already assigned — return existing
      const { data: quests } = await db
        .from("quest_instances")
        .select("*, quest_templates(*)")
        .eq("member_id", memberId)
        .gte("start_at", startAt.toISOString())
        .lt("end_at", endAt.toISOString())
        .order("created_at", { ascending: true });

      return new Response(JSON.stringify({ status: "already_assigned", quests: quests || [] }), {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Get active quest templates for this period
    const { data: templates } = await db
      .from("quest_templates")
      .select("*")
      .eq("quest_period", period)
      .eq("audience_type", "member")
      .eq("is_active", true);

    if (!templates || templates.length === 0) {
      return new Response(JSON.stringify({ status: "no_templates", period }), {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Shuffle and pick N
    const shuffled = templates.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(questCount, shuffled.length));

    // Create quest instances
    const instances = selected.map((t) => ({
      member_id: memberId,
      quest_template_id: t.id,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      progress_value: 0,
      status: "active",
    }));

    const { data: created, error: insertErr } = await db
      .from("quest_instances")
      .insert(instances)
      .select("*, quest_templates(*)");

    if (insertErr) throw insertErr;

    return new Response(JSON.stringify({ status: "assigned", quests: created || [] }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("gamification-assign-quests error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: cors });
  }
});
