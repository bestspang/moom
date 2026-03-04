import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { staff_id, email } = await req.json();

    if (!staff_id) {
      return new Response(
        JSON.stringify({ error: "staff_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    // TODO: Future integration point for email/LINE invitation
    // When ready, send invitation email or LINE message here

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("invite-staff error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
