# Audit — Brand consumers (backend / edge functions)

Status as of 2026-05-19.

This document tracks every server-side surface that COULD embed the gym's
brand name (emails, receipts, PDFs, push notifications, LINE messages) and
ensures none of them hardcode "MOOM" / "MOOM CLUB" — so when a tenant renames
their gym via Settings → Branding, those outputs stay in sync.

## Current state

| Edge function | Sends email? | Sends PDF/receipt? | Brand string risk | Status |
|---|---|---|---|---|
| `invite-staff` | not yet (TODO line 103) | no | high once email is added | ✅ no brand strings today |
| `approve-slip` | no | no (writes DB rows only) | low | ✅ |
| `sell-package` | no | no | low | ✅ |
| `stripe-create-checkout` | no | Stripe handles receipt copy | medium (Stripe metadata) | ✅ |
| `stripe-webhook` | no | no | low | ✅ |
| `auto-notifications` | no (in-app only) | no | medium (notification body) | ✅ |
| `daily-briefing` | no | no | low | ✅ |
| `line-auth` | no | no | low | ✅ |
| `gamification-*` | no | no | low | ✅ |
| `evaluate-tiers-daily` | no | no | low | ✅ |
| `streak-freeze` | no | no | low | ✅ |
| `_shared/db.ts` | n/a | n/a | CORS allowlist only (infra) | ✅ exempt |

Every `https://admin.moom.fit` / `https://member.moom.fit` literal in edge
functions is **CORS configuration**, not brand display. The scanner
intentionally ignores those.

## Contract for new email / receipt code

When adding any code that emits HTML, PDF, push, LINE, or email content from
an edge function, the brand name / logo / address **MUST** come from the
`settings.branding.brand_kit` row, fetched via the service-role client:

```ts
// Inside an edge function with service-role access
const { data } = await supabase
  .from('settings')
  .select('value')
  .eq('section', 'branding')
  .eq('key', 'brand_kit')
  .maybeSingle();

const brand = data?.value ?? DEFAULT_BRAND; // mirror src/components/branding/brandDefaults.ts
const subject = `${brand.name} — your receipt`;
```

Never inline `'MOOM CLUB'` or `'hello@moomclub.co'` in subject lines, headers,
HTML bodies, or PDF templates.

## Enforcement

- `scripts/check-brand-consumers.mjs` runs in CI (Quality Gate workflow).
- Frontend mode scans the 7 layout / auth files (existing).
- Backend mode scans `supabase/functions/**/*.ts`. A literal `MOOM`,
  `MOOM CLUB`, `Moom Club`, or `@moomclub.co` only fails when the file has a
  keyword indicating user-facing content (`mail`, `email`, `invoice`,
  `receipt`, `invite`, `sendgrid`, `resend`, `html`, `subject`, `body`).
- CORS allowlist (`https://admin.moom.fit` etc.) is allow-listed.

If a violation is intentional (e.g. a domain literal in CORS config), keep it
on a line that doesn't contain those keywords, or move it to `_shared/db.ts`.
