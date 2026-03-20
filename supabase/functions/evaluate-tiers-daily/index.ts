import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getCorsOrigin(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowed =
    /^https:\/\/[a-z0-9-]+\.lovable\.app$/.test(origin) ||
    origin === "https://admin.moom.fit" ||
    origin === "https://member.moom.fit" ||
    origin === "https://moom.lovable.app";
  return {
    ...corsHeaders,
    "Access-Control-Allow-Origin": allowed ? origin : "https://moom.lovable.app",
  };
}

Deno.serve(async (req) => {
  const cors = getCorsOrigin(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch all active member IDs
    const { data: members, error: fetchErr } = await supabase
      .from("members")
      .select("id")
      .eq("status", "active");

    if (fetchErr) throw fetchErr;
    if (!members || members.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, total_members: 0, evaluated: 0, errors: 0 }),
        { headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    let evaluated = 0;
    let errors = 0;
    const BATCH_SIZE = 50;

    for (let i = 0; i < members.length; i += BATCH_SIZE) {
      const batch = members.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((m) =>
          supabase.rpc("evaluate_member_tier", { p_member_id: m.id })
        )
      );
      for (const r of results) {
        if (r.status === "fulfilled" && !r.value.error) {
          evaluated++;
        } else {
          errors++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        total_members: members.length,
        evaluated,
        errors,
      }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: (err as Error).message }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
