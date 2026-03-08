import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = ['https://admin.moom.fit', 'https://member.moom.fit', 'https://moom.lovable.app'];

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://admin.moom.fit",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BriefingAction {
  text: string;
  route: string;
  priority: "high" | "medium" | "low";
}

interface BriefingResponse {
  summary: string;
  actions: BriefingAction[];
  source: string;
}

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
    const userId = claimsData.claims.sub as string;

    // --- ACCESS LEVEL CHECK: require level_2_operator ---
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: accessCheck } = await supabaseAdmin.rpc("has_min_access_level", {
      _user_id: userId,
      _min_level: "level_2_operator",
    });
    if (!accessCheck) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { stats, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      const result = generateTemplateResponse(stats, language);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lang = language === "th" ? "Thai" : "English";
    const systemPrompt = `You are a gym operations assistant. Generate a daily briefing for a gym owner/manager.
Respond in ${lang} with VALID JSON only (no markdown). Format:
{
  "summary": "2-3 sentence overview",
  "actions": [
    { "text": "actionable suggestion", "route": "/relevant-page", "priority": "high|medium|low" }
  ]
}
Use these routes: /members for members, /leads for leads, /calendar for schedule, /lobby for check-ins, /packages for packages, /finance for finance, /report/member/members-at-risk for at-risk.
Max 4 actions. Be friendly and actionable.`;

    const userPrompt = `Today's gym stats:
- Check-ins today: ${stats.checkinsToday ?? 0}
- Classes scheduled today: ${stats.classesToday ?? 0}
- Currently in class: ${stats.currentlyInClass ?? 0}
- Expiring packages (next 7 days): ${stats.expiringPackages7d ?? 0}
- Expiring packages (next 30 days): ${stats.expiringPackages30d ?? 0}
- High-risk members: ${stats.highRiskCount ?? 0}
- Active members total: ${stats.activeMembers ?? 0}

Generate a structured daily briefing.`;

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
      const result = generateTemplateResponse(stats, language);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";

    // Try to parse JSON from AI response
    try {
      // Strip markdown code fences if present
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return new Response(JSON.stringify({
        summary: parsed.summary || raw,
        actions: Array.isArray(parsed.actions) ? parsed.actions.slice(0, 4) : [],
        source: "ai",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      // Fallback: use raw text as summary
      return new Response(JSON.stringify({
        summary: raw,
        actions: [],
        source: "ai",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("daily-briefing error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateTemplateResponse(stats: any, language: string): BriefingResponse {
  const actions: BriefingAction[] = [];

  if ((stats.expiringPackages7d ?? 0) > 0) {
    actions.push({
      text: language === "th"
        ? `แพ็กเกจ ${stats.expiringPackages7d} รายการจะหมดอายุภายใน 7 วัน`
        : `${stats.expiringPackages7d} packages expiring within 7 days`,
      route: "/report/member/members-at-risk",
      priority: "high",
    });
  }

  if ((stats.highRiskCount ?? 0) > 0) {
    actions.push({
      text: language === "th"
        ? `สมาชิกเสี่ยงหาย ${stats.highRiskCount} คน ควรติดตาม`
        : `${stats.highRiskCount} members flagged as high-risk`,
      route: "/members?risk=high",
      priority: "high",
    });
  }

  if ((stats.classesToday ?? 0) > 0) {
    actions.push({
      text: language === "th"
        ? `มี ${stats.classesToday} คลาสวันนี้`
        : `${stats.classesToday} classes scheduled today`,
      route: "/calendar",
      priority: "low",
    });
  }

  const summary = language === "th"
    ? `วันนี้มี ${stats.classesToday ?? 0} คลาส และเช็คอินแล้ว ${stats.checkinsToday ?? 0} คน`
    : `Today has ${stats.classesToday ?? 0} classes scheduled with ${stats.checkinsToday ?? 0} check-ins so far.`;

  return { summary, actions, source: "template" };
}
