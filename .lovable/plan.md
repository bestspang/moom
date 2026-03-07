

# Security Audit Report — MOOM CLUB (admin.moom.fit)

## Severity Ratings: CRITICAL / HIGH / MEDIUM / LOW / INFO

---

## FINDING 1 — CRITICAL: `invite-staff` Edge Function Has No Authentication

**File:** `supabase/functions/invite-staff/index.ts`

The function uses `SUPABASE_SERVICE_ROLE_KEY` (god-mode) but performs **zero authentication**. Any unauthenticated attacker can call it with an arbitrary `staff_id` and change any staff member's status to `pending`, or inject fake activity log entries.

**Attack:** `curl -X POST .../functions/v1/invite-staff -d '{"staff_id":"<any-uuid>"}'`

**Solution:** Add JWT verification using `getClaims()` and enforce `has_min_access_level` (level_3_manager). Reject requests without valid auth.

---

## FINDING 2 — CRITICAL: `daily-briefing` Edge Function — No Auth Check Visible

**File:** `supabase/functions/daily-briefing/index.ts`, `config.toml` has `verify_jwt = false`

If this function reads sensitive business data (member counts, revenue, schedules) without validating caller identity, any anonymous user can extract operational intelligence.

**Solution:** Add JWT claims validation. Only allow authenticated staff with appropriate access level.

---

## FINDING 3 — HIGH: Open Signup Allows Privilege Escalation Path

**Files:** `src/pages/Auth/Signup.tsx`, `handle_new_user()` trigger

Anyone on the internet can sign up at `/signup`. The `handle_new_user` trigger automatically creates a `staff` record and assigns `front_desk` role. This means:
- Any stranger gets a staff account with `level_1_minimum` access
- They can immediately read: members (names, phones, addresses), member_packages, attendance, rooms, schedules, classes, roles, settings, packages, promotions, and more via RLS policies that grant SELECT to `level_1_minimum`

**Attack:** Sign up → log in → query `members` table → exfiltrate all member PII (phone numbers, addresses, medical data).

**Solution:**
1. **Disable public signup** or gate it behind an invitation flow (e.g., admin must create the account)
2. Alternatively, set new signups to an `inactive` status that requires manager approval before granting any data access
3. Consider removing the `/signup` route entirely for the admin panel — staff should be invited, not self-registering

---

## FINDING 4 — HIGH: CheckinRedeem Page — PostgREST Filter Injection

**File:** `src/pages/CheckinRedeem.tsx`, line 66

```typescript
.or(`phone.eq.${trimmed},member_id.eq.${trimmed}`)
```

User input (`trimmed`) is interpolated directly into a PostgREST filter string without sanitization. An attacker could craft input containing PostgREST operators (e.g., `,email.neq.`) to manipulate the query logic and enumerate member data.

**Solution:** Use parameterized filter syntax:
```typescript
.or(`phone.eq."${trimmed}",member_id.eq."${trimmed}"`)
```
Or better, use separate `.eq()` calls combined with logic, or validate the input against a strict pattern (digits only for phone, `M-` prefix for member_id).

---

## FINDING 5 — HIGH: All Edge Functions Use `Access-Control-Allow-Origin: *`

**Files:** All 6 edge functions

Wildcard CORS allows any website to make authenticated requests to your edge functions (using credentials the browser already has). Once you go live on `admin.moom.fit`, this should be locked down.

**Solution:** Replace `'*'` with your actual domains:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://admin.moom.fit',
  // ...
}
```
For the Stripe webhook (which receives calls from Stripe servers, not browsers), CORS is irrelevant but harmless.

---

## FINDING 6 — HIGH: Stripe Checkout Origin Fallback is Exploitable

**File:** `supabase/functions/stripe-create-checkout/index.ts`, line 120

```typescript
const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/$/, '') || 'https://moom.lovable.app'
```

An attacker can set the `Origin` header to their own domain, causing Stripe to redirect the user to `https://evil.com/finance?payment=success` after payment. This is an **open redirect via Stripe**.

**Solution:** Whitelist allowed origins:
```typescript
const ALLOWED_ORIGINS = ['https://admin.moom.fit', 'https://moom.lovable.app'];
const rawOrigin = req.headers.get('origin') || '';
const origin = ALLOWED_ORIGINS.includes(rawOrigin) ? rawOrigin : 'https://admin.moom.fit';
```

---

## FINDING 7 — MEDIUM: Transaction Number Race Condition

**File:** `supabase/functions/stripe-create-checkout/index.ts`, lines 75-76

```typescript
const { count } = await supabase.from('transactions').select('*', { count: 'exact', head: true })
const txNo = `T-${String((count || 0) + 1).padStart(7, '0')}`
```

Two concurrent requests can get the same count and generate duplicate transaction numbers. This is a TOCTOU (time-of-check-time-of-use) race.

**Solution:** Use a database sequence or a `UNIQUE` constraint on `transaction_id` with retry logic, or generate the number inside a database function with row-level locking.

---

## FINDING 8 — MEDIUM: Idempotency Key Contains `Date.now()` — Not Truly Idempotent

**File:** `supabase/functions/stripe-create-checkout/index.ts`, line 72

```typescript
const idempotencyKey = `stripe:${member_id}:${package_id}:${Date.now()}`
```

Using `Date.now()` means every request generates a unique key, defeating the purpose of idempotency. A user double-clicking "Pay" creates two pending transactions.

**Solution:** Remove the timestamp. Use `stripe:${member_id}:${package_id}` or include a client-generated nonce passed from the frontend.

---

## FINDING 9 — MEDIUM: RLS Policies Use `{public}` Role Instead of `{authenticated}`

Multiple tables have SELECT/INSERT policies that apply to `{public}` (meaning even anonymous/unauthenticated requests). Examples:
- `members` SELECT → `{public}` with `level_1_minimum` check
- `staff` SELECT → `{public}` with `level_1_minimum` check
- `member_attendance` SELECT/INSERT → `{public}`
- `checkin_qr_tokens` ALL → `{public}`

While `has_min_access_level(auth.uid(), ...)` returns `false` for anonymous users (since `auth.uid()` is null), this relies on the function implementation. Best practice is to scope policies to `{authenticated}` role as an additional defense layer.

**Solution:** Change these policies from `TO public` to `TO authenticated`.

---

## FINDING 10 — MEDIUM: `handle_updated_at()` Function Missing `search_path`

**Flagged by security scan.** The `handle_updated_at()` trigger function doesn't set `search_path`, making it vulnerable to search-path injection if an attacker can create objects in other schemas.

**Solution:**
```sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
```

---

## FINDING 11 — MEDIUM: No Route-Level Permission Guards on Most Pages

**File:** `src/App.tsx`

Only `DiagnosticsDataAudit` has `minAccessLevel="level_4_master"`. All other protected routes (Finance, Roles, Staff, Settings, etc.) are accessible to any authenticated user (including the auto-created `front_desk` accounts from Finding 3). Permission checks happen only at UI element level via `usePermissions()`, which can be bypassed by directly querying the API.

**Solution:** While RLS enforces data access, add `minAccessLevel` guards to sensitive routes like:
- `/finance` → `level_3_manager`
- `/roles`, `/roles/create`, `/roles/:id` → `level_4_master`
- `/setting` → `level_3_manager`
- `/admin` (staff management) → `level_3_manager`

---

## FINDING 12 — LOW: Webhook URL Exposed in Client-Side Settings Page

**File:** `src/pages/settings/SettingsIntegrations.tsx`, line 12

The webhook URL is visible to all authenticated users. While not a secret per se, it gives attackers the exact endpoint to target with forged webhook payloads (mitigated by signature verification, but still unnecessary exposure).

**Solution:** Only show this on settings pages gated to `level_4_master` access.

---

## FINDING 13 — LOW: No Rate Limiting on Auth Endpoints

The login and signup forms have no client-side rate limiting or CAPTCHA. While backend rate limiting may exist, brute-force attacks against the login form are possible.

**Solution:** Add rate limiting, account lockout after N failed attempts, or CAPTCHA (e.g., Cloudflare Turnstile) on the login page.

---

## FINDING 14 — INFO: `line-auth` Edge Function — `verify_jwt = false`

This is expected for LINE OAuth callback handling, but verify that the function validates the LINE ID token properly and doesn't trust client-supplied data without verification.

---

## Summary Priority Matrix

| # | Severity | Finding | Effort |
|---|----------|---------|--------|
| 1 | CRITICAL | `invite-staff` no auth | Small |
| 2 | CRITICAL | `daily-briefing` no auth | Small |
| 3 | HIGH | Open signup → instant staff access | Medium |
| 4 | HIGH | PostgREST filter injection in CheckinRedeem | Small |
| 5 | HIGH | Wildcard CORS on all edge functions | Small |
| 6 | HIGH | Open redirect via Stripe origin header | Small |
| 7 | MEDIUM | Transaction number race condition | Medium |
| 8 | MEDIUM | Fake idempotency key | Small |
| 9 | MEDIUM | RLS policies on `public` instead of `authenticated` | Medium |
| 10 | MEDIUM | `handle_updated_at` missing search_path | Small |
| 11 | MEDIUM | No route-level access guards | Medium |
| 12 | LOW | Webhook URL exposed to all staff | Small |
| 13 | LOW | No rate limiting on auth | Medium |

**Recommended fix order:** 1 → 2 → 3 → 6 → 5 → 4 → 8 → 7 → 9 → 10 → 11 → 12 → 13

Would you like me to implement fixes for these findings? I recommend starting with the CRITICAL items (Findings 1-2) and the HIGH open-signup issue (Finding 3).

