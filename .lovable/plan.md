

# Cross-System Consistency Audit — Findings & Fix Plan

## Audit Summary

After reading every gamification edge function, hook, page, i18n file, and CORS configuration, here are the **real issues** that exist today. Each is verified against actual code — no false positives.

---

## CONFIRMED BUGS (Ranked by Impact)

### Bug 1 — CRITICAL: 4 Edge Functions missing CORS headers → preflight failures

These functions are called from the browser via `supabase.functions.invoke()` but only allow `authorization, x-client-info, apikey, content-type` — missing the `x-supabase-client-*` headers that the SDK sends:

| Function | Has full headers? | Has `isAllowedOrigin` wildcard? |
|---|---|---|
| `gamification-process-event` | Yes | Yes |
| `gamification-admin-ops` | Yes | Yes |
| `streak-freeze` | Yes | No (exact match only) |
| `gamification-redeem-reward` | **No** | **No** |
| `gamification-claim-quest` | **No** | **No** |
| `gamification-issue-coupon` | **No** | **No** |
| `gamification-assign-quests` | **No** | **No** |
| `sync-gamification-config` | **No** | **No** |

**5 functions** will fail CORS preflight from any browser. The member app calls `gamification-redeem-reward`, `gamification-claim-quest`, `gamification-assign-quests`, and `streak-freeze` directly — these are broken in Lovable preview environments.

**Fix:** Add the full `x-supabase-client-*` headers and `isAllowedOrigin()` wildcard to all 6 remaining functions.

### Bug 2 — MEDIUM: `streak-freeze` missing `isAllowedOrigin` wildcard

Has full headers but uses exact-match origin checking. Will block Lovable preview URLs.

**Fix:** Add `isAllowedOrigin()` function (same pattern as `gamification-process-event`).

### Bug 3 — LOW: i18n keys missing for 3 new Studio tabs

`GamificationStudio.tsx` uses hardcoded English strings for Guardrails, Operations, and Prestige tabs (lines 35-37) instead of `t()` calls. The Thai locale has no gamification tabs section at all.

These tabs work fine in English but won't localize for Thai users.

**Fix:** Add i18n keys for `guardrails`, `operations`, `prestige` tabs in both `en.ts` and `th.ts`. Update `GamificationStudio.tsx` to use `t()`.

---

## VERIFIED WORKING (No Changes Needed)

| Area | Status | Evidence |
|---|---|---|
| `g()` function zero-value handling | Correct | Falls back on `NaN` only, not `0` (line 128) |
| `GUARDRAIL_DEFAULTS` keys match DB | Correct | All 17 keys match `rule_code` values |
| `getGuardrails()` DB read | Correct | Reads active rows, merges with defaults |
| Divide-by-zero guards | Correct | `Math.max(divisor, 1)` on all 4 division sites |
| Guardrail validation in hook | Correct | Checks `rule_code` with regex, not `rule_value` |
| Audit logging for guardrail/prestige edits | Correct | Both fire-and-forget inserts present |
| Admin-ops edge function | Correct | All 5 actions work, proper auth + audit |
| Routes in App.tsx | Correct | All 3 new pages registered |
| GamificationStudio tabs | Correct | All 14 tabs present and routed |
| Prestige criteria admin page | Correct | CRUD with audit trail |
| Level-up prestige gating | Correct | `checkLevelUp()` calls `check_prestige_eligibility` RPC |
| Challenge progress tracking | Correct | Both challenges and quests tracked |
| Referral reward flow | Correct | Reads from guardrails table |
| Badge auto-unlock | Correct | Condition-based checking works |

---

## Implementation Plan

### Fix 1 — Standardize CORS across all 6 gamification edge functions

For each of these files, apply the same proven pattern from `gamification-process-event`:

1. Add `isAllowedOrigin()` with `*.lovable.app` regex
2. Replace `ALLOWED_ORIGINS.includes(origin)` with `isAllowedOrigin(origin)`
3. Expand `Access-Control-Allow-Headers` to include all `x-supabase-client-*` headers

Files:
- `supabase/functions/gamification-redeem-reward/index.ts`
- `supabase/functions/gamification-claim-quest/index.ts`
- `supabase/functions/gamification-issue-coupon/index.ts`
- `supabase/functions/gamification-assign-quests/index.ts`
- `supabase/functions/sync-gamification-config/index.ts`
- `supabase/functions/streak-freeze/index.ts`

**Safety:** Pure additive change — only adds allowed headers and origins. No logic changes.

### Fix 2 — Add i18n keys for new gamification tabs

Files:
- `src/i18n/locales/en.ts` — add `guardrails`, `operations`, `prestige` keys under `gamification.tabs`
- `src/i18n/locales/th.ts` — add Thai gamification section with all tab translations
- `src/pages/gamification/GamificationStudio.tsx` — replace hardcoded strings with `t()` calls

**Safety:** Only adds new keys and replaces 3 string literals. No existing translations affected.

---

## What Still Needs Manual Testing After Fix

1. Call reward redemption from member app in preview → verify no CORS error
2. Claim a quest from member app → verify no CORS error
3. Use streak freeze from member app → verify no CORS error
4. Switch app language to Thai → verify new tab names appear correctly

