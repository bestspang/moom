import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = ['https://admin.moom.fit', 'https://member.moom.fit', 'https://moom.lovable.app'];

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  return /^https:\/\/[a-z0-9-]+\.lovable\.app$/.test(origin);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://admin.moom.fit",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  const reqOrigin = req.headers.get('origin') || '';
  const responseOrigin = isAllowedOrigin(reqOrigin) ? reqOrigin : ALLOWED_ORIGINS[0];
  const dynamicCors = { ...corsHeaders, 'Access-Control-Allow-Origin': responseOrigin };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: dynamicCors });
  }

  try {
    // --- AUTH CHECK ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...dynamicCors, "Content-Type": "application/json" } }
      );
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...dynamicCors, "Content-Type": "application/json" } }
      );
    }
    const userId = claimsData.claims.sub as string;

    // Service role client for writes
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // --- ACCESS LEVEL CHECK: require level_3_manager ---
    const { data: accessCheck } = await supabase.rpc("has_min_access_level", {
      _user_id: userId,
      _min_level: "level_3_manager",
    });

    if (!accessCheck) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Manager access required" }),
        { status: 403, headers: { ...dynamicCors, "Content-Type": "application/json" } }
      );
    }

    const { staff_id, email } = await req.json();

    if (!staff_id) {
      return new Response(
        JSON.stringify({ error: "staff_id is required" }),
        { status: 400, headers: { ...dynamicCors, "Content-Type": "application/json" } }
      );
    }

    // Set staff status to pending
    const { error: updateError } = await supabase
      .from("staff")
      .update({ status: "pending" })
      .eq("id", staff_id);

    if (updateError) throw updateError;

    // Log activity
    const { error: logError } = await supabase.from("activity_log").insert({
      event_type: "staff_invited",
      activity: `Staff invitation sent${email ? ` to ${email}` : ""}`,
      entity_type: "staff",
      entity_id: staff_id,
    });

    if (logError) {
      console.error("Failed to log activity:", logError);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        delivery: "pending_manual",
        message: "Staff status was set to pending. Email or LINE delivery is not configured yet.",
      }),
      { status: 200, headers: { ...dynamicCors, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("invite-staff error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...dynamicCors, "Content-Type": "application/json" } }
    );
  }
});
