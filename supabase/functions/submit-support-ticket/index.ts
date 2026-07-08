import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const ALLOWED_ORIGINS = [
  "https://admin.moom.fit",
  "https://member.moom.fit",
  "https://moom.lovable.app",
];

function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allow = ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".lovable.app") || origin.startsWith("http://localhost")
    ? origin
    : ALLOWED_ORIGINS[1];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

const CATEGORIES = new Set([
  "complaint", "facility", "trainer", "class",
  "billing", "membership", "cleanliness", "suggestion", "other",
]);

function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D+/g, "");
  return digits.length >= 6 ? digits : null;
}

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json({ data: null, error: { code: "VALIDATION_ERROR", message: "Invalid JSON" } }, 400, cors);
    }

    const {
      is_anonymous, name, phone, email, category, subject, message,
    } = body as Record<string, unknown>;

    if (typeof category !== "string" || !CATEGORIES.has(category)) {
      return json({ data: null, error: { code: "VALIDATION_ERROR", message: "Invalid category" } }, 400, cors);
    }
    if (typeof subject !== "string" || subject.trim().length < 1 || subject.length > 200) {
      return json({ data: null, error: { code: "VALIDATION_ERROR", message: "Invalid subject" } }, 400, cors);
    }
    if (typeof message !== "string" || message.trim().length < 10 || message.length > 2000) {
      return json({ data: null, error: { code: "VALIDATION_ERROR", message: "Invalid message" } }, 400, cors);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    const phoneNorm = normalizePhone(typeof phone === "string" ? phone : null);
    const emailStr = typeof email === "string" && email.trim() ? email.trim().toLowerCase() : null;

    // Match member: try normalized phone (digits) or exact email
    let matchedMemberId: string | null = null;
    if (phoneNorm) {
      const { data } = await db
        .from("members")
        .select("id, phone")
        .not("phone", "is", null)
        .limit(50);
      if (data) {
        const hit = data.find((m: { phone: string | null }) => {
          const mp = (m.phone ?? "").replace(/\D+/g, "");
          return mp && (mp === phoneNorm || mp.endsWith(phoneNorm) || phoneNorm.endsWith(mp));
        });
        if (hit) matchedMemberId = (hit as { id: string }).id;
      }
    }
    if (!matchedMemberId && emailStr) {
      const { data } = await db
        .from("members")
        .select("id")
        .ilike("email", emailStr)
        .maybeSingle();
      if (data) matchedMemberId = (data as { id: string }).id;
    }

    const insertPayload = {
      is_anonymous: Boolean(is_anonymous),
      name: is_anonymous ? null : (typeof name === "string" && name.trim() ? name.trim() : null),
      phone: typeof phone === "string" && phone.trim() ? phone.trim() : null,
      email: emailStr,
      category,
      subject: (subject as string).trim(),
      message: (message as string).trim(),
      member_id: matchedMemberId,
    };

    const { data: ticket, error: insErr } = await db
      .from("support_tickets")
      .insert(insertPayload)
      .select("id, ticket_no")
      .single();

    if (insErr || !ticket) {
      console.error("[submit-support-ticket] insert failed", insErr);
      return json({ data: null, error: { code: "INTERNAL", message: "Failed to create ticket" } }, 500, cors);
    }

    // Fire gamification event only if member matched.
    // Cooldown (2 weeks) is enforced by gamification_rules.cooldown_minutes.
    let pointsAwarded: { xp: number; coin: number } | null = null;
    if (matchedMemberId) {
      try {
        const { data: gData, error: gErr } = await db.functions.invoke("gamification-process-event", {
          body: {
            event_type: "support_ticket_submit",
            member_id: matchedMemberId,
            idempotency_key: `support:${ticket.id}`,
            metadata: { ticket_no: ticket.ticket_no, category },
          },
        });
        // gamification-process-event returns {status: ...} on skip, or writes ledger on success.
        // If status field indicates cooldown/limit/no_rule, we treat as no award.
        if (!gErr && gData && typeof gData === "object" && !("status" in gData)) {
          pointsAwarded = { xp: 10, coin: 5 };
        } else if (!gErr && gData && (gData as { status?: string }).status === undefined) {
          pointsAwarded = { xp: 10, coin: 5 };
        }
      } catch (gEx) {
        console.warn("[submit-support-ticket] gamification event failed (non-blocking)", gEx);
      }
    }

    return json({
      data: {
        ticket_no: ticket.ticket_no,
        member_matched: Boolean(matchedMemberId),
        points_awarded: pointsAwarded,
      },
      error: null,
    }, 200, cors);
  } catch (err) {
    console.error("[submit-support-ticket] unexpected error", err);
    return json({ data: null, error: { code: "INTERNAL", message: "Unexpected error" } }, 500, corsHeadersFor(req));
  }
});

function json(payload: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
