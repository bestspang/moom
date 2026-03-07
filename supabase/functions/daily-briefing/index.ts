import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://admin.moom.fit",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // --- AUTH CHECK ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { stats, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      const summary = generateTemplateSummary(stats, language);
      return new Response(JSON.stringify({ summary, source: "template" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lang = language === "th" ? "Thai" : "English";
    const systemPrompt = `You are a gym operations assistant. Generate a concise 2-3 sentence daily briefing for a gym owner/manager. Be friendly, actionable, and highlight anything that needs attention. Respond in ${lang}.`;

    const userPrompt = `Today's gym stats:
- Check-ins today: ${stats.checkinsToday ?? 0}
- Classes scheduled today: ${stats.classesToday ?? 0}
- Currently in class: ${stats.currentlyInClass ?? 0}
- Expiring packages (next 7 days): ${stats.expiringPackages7d ?? 0}
- Expiring packages (next 30 days): ${stats.expiringPackages30d ?? 0}
- High-risk members: ${stats.highRiskCount ?? 0}
- Active members total: ${stats.activeMembers ?? 0}

Generate a brief, natural daily briefing summary.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      const summary = generateTemplateSummary(stats, language);
      return new Response(JSON.stringify({ summary, source: "template" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || generateTemplateSummary(stats, language);

    return new Response(JSON.stringify({ summary, source: "ai" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("daily-briefing error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateTemplateSummary(stats: any, language: string): string {
  if (language === "th") {
    const parts = [`วันนี้มี ${stats.classesToday ?? 0} คลาส และเช็คอินแล้ว ${stats.checkinsToday ?? 0} คน`];
    if ((stats.expiringPackages7d ?? 0) > 0) {
      parts.push(`มีแพ็กเกจ ${stats.expiringPackages7d} รายการจะหมดอายุภายใน 7 วัน`);
    }
    if ((stats.highRiskCount ?? 0) > 0) {
      parts.push(`สมาชิกเสี่ยงหาย ${stats.highRiskCount} คน ควรติดตาม`);
    }
    return parts.join(" ");
  }
  const parts = [`Today has ${stats.classesToday ?? 0} classes scheduled with ${stats.checkinsToday ?? 0} check-ins so far.`];
  if ((stats.expiringPackages7d ?? 0) > 0) {
    parts.push(`${stats.expiringPackages7d} packages expiring within 7 days — consider reaching out.`);
  }
  if ((stats.highRiskCount ?? 0) > 0) {
    parts.push(`${stats.highRiskCount} members flagged as high-risk.`);
  }
  return parts.join(" ");
}
