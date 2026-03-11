

# Cross-System Consistency Audit — Critical Event Pipeline Bug

## CRITICAL BUG: Package Purchase Event Pipeline is Broken

### Root Cause Analysis

Three producers fire the event `package_purchased`:
- `supabase/functions/approve-slip/index.ts` (line 237)
- `supabase/functions/stripe-webhook/index.ts` (line 146)
- `src/hooks/useMemberDetails.ts` (line 656)

But `gamification-process-event/index.ts` line 497 checks:
```typescript
if (event_type === "package_purchase" && metadata) {
```

**`package_purchased` !== `package_purchase`** — the dynamic XP/Coin formula (guardrail-based calculation with term bonuses) **never executes**. Instead, the event falls through to the static `rule.xp_value` from the `gamification_rules` table, which may be `0` or a flat value — completely ignoring `net_paid`, term bonuses, and coin caps.

### Secondary Bug: Metadata Keys Missing

Even if the event name matched, all 3 producers send `amount` but the formula reads `metadata.net_paid`. None send `term_months`. The formula would compute `floor(0 / 300) = 0` XP.

| Producer | Sends | Formula Expects |
|---|---|---|
| `approve-slip` | `{ amount, package_id, package_name }` | `{ net_paid, term_months }` |
| `stripe-webhook` | `{ amount, package_id, package_name, source }` | `{ net_paid, term_months }` |
| `useMemberDetails` | `{ package_id, package_name }` | `{ net_paid, term_months }` |

### Same Pattern Check: `shop_purchase`

The edge function also checks `event_type === "shop_purchase"` (line 508). No producer currently fires this event, so no mismatch exists yet — but when shop purchases are added, the doc says `shop_purchase` which matches.

### Same Pattern Check: `class_attended` vs `class_attend`

Event map doc says `class_attend`, but hooks fire `class_attended`. The edge function does NOT have special handling for class events — it just uses the static rule. So this works as long as `gamification_rules.action_key` matches `class_attended`. The doc is slightly wrong but no functional impact.

---

## CONFIRMED BUGS (Ranked)

### Bug 1 — CRITICAL: Event name mismatch breaks package XP/Coin formula

**Impact:** Every package purchase since launch gets wrong XP/Coin (static rule value instead of formula-based).

**Fix:** Change `gamification-process-event` line 497 from `"package_purchase"` to `"package_purchased"` to match all 3 producers.

**Why fix here and not the producers:** 3 producers already use `package_purchased`. The `gamification_rules` table also likely has `package_purchased` as `action_key`. Changing 1 line in the consumer is safer than changing 3 producers + DB rows + docs.

### Bug 2 — CRITICAL: Missing `net_paid` and `term_months` in metadata

**Impact:** Even after fixing Bug 1, the formula reads `Number(metadata.net_paid) || 0` which returns `0` because producers send `amount` not `net_paid`.

**Fix:** Update all 3 producers to include `net_paid` (mapped from their `amount` field) and `term_months` (resolved from the package's `term_days`).

### Bug 3 — MEDIUM: Non-gamification edge functions missing wildcard CORS

`approve-slip`, `daily-briefing`, `invite-staff` use exact-match origin checking without `*.lovable.app` wildcard. These work in production but fail in Lovable preview.

**Fix:** Add `isAllowedOrigin()` wildcard function to these 3 functions. Same proven pattern.

### Bug 4 — LOW: Event map doc out of sync

Doc says `package_purchased` which is correct for producers, but the event map table says `action_key: package_purchase` (line 24). Should be `package_purchase` in the event map since that's the `gamification_rules.action_key`.

**Fix:** Update doc to clarify: producers fire `package_purchased`, rules table uses `package_purchased`.

---

## Implementation Plan

### Fix 1 — Event name alignment in `gamification-process-event`

**File:** `supabase/functions/gamification-process-event/index.ts`

Line 497: Change `"package_purchase"` → `"package_purchased"`

**Safety:** Only changes the string comparison. No logic changes.

### Fix 2 — Add `net_paid` and `term_months` to all 3 producers

**File:** `supabase/functions/approve-slip/index.ts` (lines 236-247)
- Add `net_paid: amountGross` and `term_months: Math.ceil((pkg?.term_days || 30) / 30)` to metadata

**File:** `supabase/functions/stripe-webhook/index.ts` (lines 145-156)
- Add `net_paid: tx.amount` and resolve `term_months` from `tx.package_id` → packages table

**File:** `src/hooks/useMemberDetails.ts` (lines 655-660)
- Add `net_paid: variables.pkg.price` and `term_months: Math.ceil((variables.pkg.term_days || 30) / 30)` to metadata

**Safety:** Additive — only adds new metadata keys. Existing keys preserved.

### Fix 3 — Wildcard CORS for non-gamification edge functions

**Files:** `approve-slip`, `daily-briefing`, `invite-staff`
- Add `isAllowedOrigin()` with `*.lovable.app` regex
- Replace `ALLOWED_ORIGINS.includes(origin)` with `isAllowedOrigin(origin)`

**Safety:** Pure additive — only adds allowed origins.

### Fix 4 — Update event map doc

**File:** `docs/gamification-event-map.md`
- Fix `action_key` column for package purchase to `package_purchased`
- Add note about `net_paid` and `term_months` metadata requirements

---

## Files to Edit

| File | Change |
|---|---|
| `supabase/functions/gamification-process-event/index.ts` | Fix event name `package_purchase` → `package_purchased` |
| `supabase/functions/approve-slip/index.ts` | Add `net_paid`, `term_months` to metadata + wildcard CORS |
| `supabase/functions/stripe-webhook/index.ts` | Add `net_paid`, `term_months` to metadata |
| `src/hooks/useMemberDetails.ts` | Add `net_paid`, `term_months` to metadata |
| `supabase/functions/daily-briefing/index.ts` | Add wildcard CORS |
| `supabase/functions/invite-staff/index.ts` | Add wildcard CORS |
| `docs/gamification-event-map.md` | Fix action_key + add metadata docs |

## Order

1. Fix event name in `gamification-process-event` (critical — unblocks formula)
2. Fix metadata in all 3 producers (critical — makes formula produce correct values)
3. Fix wildcard CORS on non-gamification functions (medium)
4. Update docs (low)

## Manual Testing After Fix

1. Approve a transfer slip for a 3-month package → verify XP includes term bonus (should be `floor(price/300) + 18`)
2. Purchase a package via admin → verify Coin includes term bonus and respects cap 100
3. Call `daily-briefing` from Lovable preview → verify no CORS error

