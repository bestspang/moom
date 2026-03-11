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

/**
 * Issue a coupon to a member from a template.
 * Used when: reward redemption issues a coupon, level-up perk, campaign.
 *
 * Body: { member_id, coupon_template_id, source_type, source_id? }
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
    const { member_id, coupon_template_id, source_type, source_id } = body;

    if (!member_id || !coupon_template_id) {
      return new Response(JSON.stringify({ error: "Missing member_id or coupon_template_id" }), { status: 400, headers: cors });
    }

    // Get template
    const { data: template } = await db
      .from("coupon_templates")
      .select("*")
      .eq("id", coupon_template_id)
      .eq("is_active", true)
      .single();

    if (!template) {
      return new Response(JSON.stringify({ error: "Coupon template not found or inactive" }), { status: 404, headers: cors });
    }

    // Calculate expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (template.valid_days || 14));

    // Issue coupon
    const { data: coupon, error: insertErr } = await db
      .from("coupon_wallet")
      .insert({
        member_id,
        coupon_template_id,
        expires_at: expiresAt.toISOString(),
        source_type: source_type || "manual",
        source_id: source_id || null,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Audit
    await db.from("gamification_audit_log").insert({
      member_id,
      event_type: "coupon_issued",
      action_key: "issue_coupon",
      xp_delta: 0,
      points_delta: 0,
      metadata: {
        coupon_id: coupon.id,
        coupon_template_id,
        coupon_name: template.name_en,
        source_type,
        source_id,
      },
      flagged: false,
    });

    return new Response(JSON.stringify({
      status: "issued",
      coupon_id: coupon.id,
      expires_at: expiresAt.toISOString(),
      coupon_name: template.name_en,
    }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("gamification-issue-coupon error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: cors });
  }
});
