import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

// Drafts a gym announcement (EN + TH) from a short topic seed, via the Lovable AI
// Gateway (Gemini Flash). Mirrors daily-briefing's auth + gateway pattern.

const ALLOWED_ORIGINS = ['https://admin.moom.fit', 'https://member.moom.fit', 'https://moom.lovable.app'];

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  return /^https:\/\/[a-z0-9-]+\.lovable\.app$/.test(origin);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://admin.moom.fit",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  const reqOrigin = req.headers.get('origin') || '';
  const responseOrigin = isAllowedOrigin(reqOrigin) ? reqOrigin : ALLOWED_ORIGINS[0];
  const dynamicCors = { ...corsHeaders, 'Access-Control-Allow-Origin': responseOrigin };

  if (req.method === "OPTIONS") return new Response(null, { headers: dynamicCors });

  try {
    // --- AUTH CHECK ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...dynamicCors, "Content-Type": "application/json" } });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...dynamicCors, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub as string;

    // --- ACCESS LEVEL: announcements are manager-managed (level_3_manager) ---
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: accessCheck } = await supabaseAdmin.rpc("has_min_access_level", {
      _user_id: userId,
      _min_level: "level_3_manager",
    });
    if (!accessCheck) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...dynamicCors, "Content-Type": "application/json" } });
    }

    const { prompt, tone } = await req.json();
    const seed = (typeof prompt === "string" ? prompt : "").trim();
    if (!seed) {
      return new Response(JSON.stringify({ error: "A topic is required" }), { status: 400, headers: { ...dynamicCors, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI is not configured" }), { status: 503, headers: { ...dynamicCors, "Content-Type": "application/json" } });
    }

    const systemPrompt = `You write short announcements for a gym's members. Given a topic, write a clear, friendly announcement in BOTH English and Thai. Keep each version 1-3 sentences, no markdown, no emojis unless natural. ${tone ? `Tone: ${tone}.` : ""}
Respond with VALID JSON only, exactly: {"message_en": "...", "message_th": "..."}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Topic: ${seed}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), { status: 429, headers: { ...dynamicCors, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...dynamicCors, "Content-Type": "application/json" } });
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI request failed" }), { status: 502, headers: { ...dynamicCors, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let message_en = "";
    let message_th = "";
    try {
      const parsed = JSON.parse(cleaned);
      message_en = String(parsed.message_en || "").trim();
      message_th = String(parsed.message_th || "").trim();
    } catch {
      // Model didn't return JSON — fall back to using the raw text as the EN draft.
      message_en = cleaned;
    }

    if (!message_en) {
      return new Response(JSON.stringify({ error: "AI returned an empty draft" }), { status: 502, headers: { ...dynamicCors, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ message_en, message_th }), { headers: { ...dynamicCors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-announcement-draft error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...dynamicCors, "Content-Type": "application/json" } });
  }
});
