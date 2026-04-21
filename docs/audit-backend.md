# ATLAS Backend Audit — MOOM Gym Management App
**Audit Date:** 2026-04-21  
**Auditor:** ATLAS Backend Audit Agent  
**Project:** `qedxqilmnkbjncpnopty` (Supabase)  
**Stack:** React 18 + TypeScript + Vite + Supabase (Postgres + Auth + Realtime + 17 Edge Functions Deno) + Stripe + LINE LIFF  

---

## Executive Summary

| Severity | Count | Description |
|----------|-------|-------------|
| **P0 Critical** | 4 | Auth bypass, missing RBAC enforcement, TOCTOU race conditions |
| **P1 High** | 5 | Missing ownership checks, non-existent table reference, broken auth logic |
| **P2 Medium** | 7 | Missing indexes, weak error propagation, uncapped member query, hardened CORS |
| **P3 Low** | 5 | Code quality, dead code, minor inconsistencies |

**Total issues: 21**

17 edge functions audited. No hardcoded secrets found in source. RLS is enabled on all tables. No `DISABLE ROW LEVEL SECURITY` found in any migration. Stripe webhook signature validation is implemented correctly.

---

## P0 Critical

### P0-1 — Auth Bypass: `auto-notifications` and `evaluate-tiers-daily` when `CRON_SECRET` env var is not set

**Files:**  
- `supabase/functions/auto-notifications/index.ts:22–32`  
- `supabase/functions/evaluate-tiers-daily/index.ts:31–41`

**Problem:**  
Both functions use the same auth guard pattern. When `CRON_SECRET` is not configured in Supabase Edge Function secrets the logic silently allows **any unauthenticated HTTP request** through:

```typescript
// Lines 22-32 (auto-notifications)
if (!authHeader?.startsWith('Bearer ') && req.headers.get('x-cron-secret') !== cronSecret) {
  const token = authHeader?.replace('Bearer ', '')
  if (token !== serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), ...)
  }
} else if (authHeader?.startsWith('Bearer ')) {
  // ...
}
```

**Trace when `CRON_SECRET=null` (unset) and no auth header:**  
1. `!authHeader?.startsWith('Bearer ')` → `true`  
2. `req.headers.get('x-cron-secret') !== cronSecret` → `null !== null` → **`false`**  
3. `true && false` → `false` → **outer `if` block never entered**  
4. `else if (authHeader?.startsWith('Bearer '))` → `null?.startsWith()` → **`false`** → block skipped  
5. Falls through to the `try` block — **no auth applied!**

`auto-notifications` runs heavy DB scans (all active members, all packages) and inserts into `event_outbox`. `evaluate-tiers-daily` calls `evaluate_member_tier` RPC for every active member. Both are triggered by a simple unauthenticated POST.

**Remediation:**  
Replace with a single authoritative guard:
```typescript
const isServiceRole = authHeader?.replace('Bearer ', '') === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const isCron = req.headers.get('x-cron-secret') === Deno.env.get('CRON_SECRET') 
               && Deno.env.get('CRON_SECRET'); // guard against null==null
if (!isServiceRole && !isCron) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
}
```

---

### P0-2 — Missing RBAC: `sync-gamification-config` comment says "manager level required" but never enforces it

**File:** `supabase/functions/sync-gamification-config/index.ts:48–60`

**Problem:**  
The comment on line 48 explicitly states "Auth check — manager level required," but the code only verifies that a valid JWT exists (`auth.getUser()`). It **never calls `has_min_access_level`**. Any authenticated user — including a LINE-auth'd member — can invoke this function and push gamification config (badges, challenges, rewards, levels) to the Experience DB.

```typescript
// Auth check — manager level required         ← comment lies
const { data: { user }, error: authError } = await userClient.auth.getUser();
if (authError || !user) return ...401...
// ← NO RBAC CHECK HERE — falls through to sync logic
const experienceUrl = Deno.env.get("EXPERIENCE_SUPABASE_URL");
```

**Impact:** Any logged-in member can trigger a full config sync to the Experience database, potentially overwriting live gamification configuration with stale data (or causing partial sync failures that corrupt reward/level data).

**Remediation:** Add access level check after user resolution:
```typescript
const db = createClient(supabaseUrl, serviceKey);
const { data: hasAccess } = await db.rpc("has_min_access_level", {
  _user_id: user.id,
  _min_level: "level_3_manager",
});
if (!hasAccess) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
```

---

### P0-3 — TOCTOU Race Condition: `gamification-redeem-reward` — points balance and stock check are not atomic

**File:** `supabase/functions/gamification-redeem-reward/index.ts:186–265`

**Problem:**  
The redemption flow: (1) reads `available_points` from profile, (2) checks balance sufficiency, (3) reads `redeemed_count` from reward, (4) checks stock, (5) inserts redemption, (6) debits points via `UPDATE`. These are **six separate DB operations with no transaction**. Under concurrent requests:

- Two simultaneous redemption calls for the same member can both pass the balance check, both create a redemption, and double-debit points driving the balance negative.
- Two simultaneous calls when `available = 1` can both read 1, both create redemptions, and oversell the last unit.

```typescript
// Lines 200-265: read → check → write pattern (NOT atomic)
const { data: profile } = await db.from("member_gamification_profiles").select("*")...
if (profile.available_points < reward.points_cost) { ... }  // check
// ...
const newAvailable = profile.available_points - reward.points_cost;  // calc from stale read
await db.from("member_gamification_profiles").update({ available_points: newAvailable })  // write
```

**Remediation:** Wrap the check-and-debit in a Postgres function (RPC) using `SELECT ... FOR UPDATE` or use atomic `UPDATE ... WHERE available_points >= cost RETURNING *` and treat zero-rows as insufficient balance.

---

### P0-4 — Missing Ownership Check: `gamification-assign-quests` — any authenticated user can assign quests to any member

**File:** `supabase/functions/gamification-assign-quests/index.ts:36–149`

**Problem:**  
The function authenticates the caller (verifies a valid JWT) but **never checks that the authenticated user owns the `member_id` in the request body**, nor verifies they are staff. Unlike `gamification-process-event` and `gamification-redeem-reward` which implement an explicit `isOwnMember || isStaff` guard (lines 437–441 and 146–152 respectively), this function has no such check:

```typescript
// Line 48-57: auth check only verifies JWT is valid, not ownership
const { data: { user }, error: authError } = await userClient.auth.getUser();
if (authError || !user) return ...401...
// ← NO isOwnMember / isStaff check
const memberId = body.member_id;
// Proceeds to assign quests to arbitrary memberId
```

**Impact:** Any authenticated LINE member can call this endpoint with another member's ID to spam quest assignments or exhaust quest slots for other members.

**Remediation:** Add the same ownership guard used in `gamification-process-event`:
```typescript
const { data: memberRow } = await db.from('members').select('user_id').eq('id', memberId).single();
const { data: callerProfile } = await db.from('staff').select('id').eq('user_id', user.id).maybeSingle();
const isOwnMember = memberRow?.user_id === user.id;
const isStaff = !!callerProfile;
if (!isOwnMember && !isStaff) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
```

---

## P1 High

### P1-1 — Missing Ownership Check: `gamification-issue-coupon` — any authenticated user can issue coupons to any member

**File:** `supabase/functions/gamification-issue-coupon/index.ts:36–117`

**Problem:**  
Same pattern as P0-4. The function verifies the caller has a valid JWT but never verifies they own `member_id` or are staff. Any authenticated member can issue coupons with arbitrary `source_type` to any other member's wallet.

```typescript
// Line 47: auth verified but no ownership/RBAC check follows
if (authError || !user) return ...401...
// Proceeds to insert coupon for any member_id in request body
```

**Impact:** Any authenticated member can manufacture free coupons for themselves (self-issue) or for any other member by passing their `member_id`. Combined with the audit log, the `source_type` field is fully caller-controlled (no allowlist validation), so `source_type: "admin_manual"` can be submitted by a member.

**Remediation:** Require `level_3_manager` access (since this is a privileged operation) or add the same `isOwnMember || isStaff` guard with validation that members cannot self-issue coupons.

---

### P1-2 — Broken Access Pattern: `gamification-process-event` and `gamification-redeem-reward` query non-existent `profiles` table

**Files:**  
- `supabase/functions/gamification-process-event/index.ts:436`  
- `supabase/functions/gamification-redeem-reward/index.ts:147`

**Problem:**  
Both functions determine if the caller is staff via:
```typescript
const { data: callerProfile } = await db.from('profiles').select('access_level').eq('user_id', user.id).single()
const isStaff = callerProfile && ['level_1_minimum',...].includes(callerProfile.access_level)
```

The `profiles` table **does not exist in any migration**. Supabase `has_min_access_level()` uses `user_roles JOIN roles` internally (as confirmed in migration `20260203084737`). The `profiles` query silently returns `null`, setting `isStaff = false` for all callers including legitimate staff.

**Impact:**  
- Staff accounts cannot use `gamification-process-event` to trigger events on members' behalf — the call will return `403 Forbidden` unless the staff user happens to also own that member row.
- Staff cannot use `gamification-redeem-reward` void/admin actions if their member_id link doesn't match.

**Remediation:** Replace both `profiles` queries with the canonical RPC:
```typescript
const { data: isStaffCheck } = await db.rpc('has_min_access_level', {
  _user_id: user.id,
  _min_level: 'level_1_minimum',
});
const isStaff = !!isStaffCheck;
```

---

### P1-3 — Uncapped Member Query: `auto-notifications` fetches ALL active members without pagination

**File:** `supabase/functions/auto-notifications/index.ts:92–120`

**Problem:**  
```typescript
// Line 92-95: NO LIMIT
const { data: activeMembers } = await supabase
  .from('members')
  .select('id, first_name, last_name')
  .eq('status', 'active');
```

Then slices to 500 for the attendance sub-query but keeps all members for the inactive check. With thousands of active members, this loads the entire `members` table into edge function memory, risks timeout (Deno edge functions have a 150-second wall clock limit), and generates O(n) `inactive_member` notifications per run, flooding `event_outbox`.

**Remediation:** Paginate in batches of 200–500 or delegate the inactive-member detection to a Postgres function/view.

---

### P1-4 — No Transaction Isolation: `sell-package` multi-step write can leave partial state on mid-flow errors

**File:** `supabase/functions/sell-package/index.ts:248–370`

**Problem:**  
The function executes 6+ sequential inserts/updates (transaction, member_packages, member_billing, promotion_redemption, promotion usage_count bump, coupon mark-used) with individual error throws but **no database transaction**. If any step after step 1 fails (e.g., step 3 `member_billing` insert fails), the `transactions` row remains in `status: 'paid'` with no corresponding billing record, causing accounting drift.

```typescript
// Step 1
const { data: tx, error: txErr } = await supabase.from('transactions').insert({status: 'paid', ...})
if (txErr) throw txErr
// Step 2
const { error: mpErr } = await supabase.from('member_packages').insert({...})
if (mpErr) throw mpErr  // transaction already written — no rollback possible
// Step 3
const { error: mbErr } = await supabase.from('member_billing').insert({...})
if (mbErr) throw mbErr  // member_packages already written — no rollback possible
```

**Remediation:** Wrap all writes in a Postgres transaction via an RPC function (`BEGIN ... COMMIT / ROLLBACK`), or reorder to write the auditable record last.

---

### P1-5 — `approve-slip` and `stripe-webhook` have the same non-atomic multi-step write problem

**Files:**  
- `supabase/functions/approve-slip/index.ts:133–232`  
- `supabase/functions/stripe-webhook/index.ts:82–138`

**Problem:** Same pattern as P1-4. Both functions write to multiple tables (transactions → member_billing → member_packages → slip/tx status update) without a transaction. A mid-flow database error leaves the data in an inconsistent state. The `approve-slip` idempotency key is checked *before* any write, so a retry after partial failure would return the original partial transaction rather than completing it.

**Remediation:** Encapsulate the critical write sequence (or at minimum the `member_billing` + `member_packages` inserts) in a Postgres RPC.

---

## P2 Medium

### P2-1 — Missing Index: `transactions(member_id)` — high-cardinality FK with no index

**Impact:** Every member profile page, statement view, and billing history query does a sequential scan on `transactions` filtering by `member_id`. With high transaction volume this degrades to O(n).

**Migration fix:**
```sql
CREATE INDEX IF NOT EXISTS idx_transactions_member_id ON public.transactions(member_id);
```

---

### P2-2 — Missing Index: `member_packages(member_id)` — frequently queried FK with no index

**Impact:** Member entitlement lookups, expiry checks, and the `auto-notifications` expiring-packages query all filter `member_packages` by `member_id`. No covering index exists. The `idx_member_attendance_idempotent` index only covers `(member_id, schedule_id)` for dedup, not for general member lookups.

**Migration fix:**
```sql
CREATE INDEX IF NOT EXISTS idx_member_packages_member_id ON public.member_packages(member_id);
CREATE INDEX IF NOT EXISTS idx_member_packages_status_expiry ON public.member_packages(status, expiry_date);
```

---

### P2-3 — Missing Index: `member_attendance(member_id, check_in_time)` — used in auto-notifications inactive-member scan

**Impact:** `auto-notifications` queries `member_attendance` with `.in('member_id', memberIds).gte('check_in_time', fourteenDaysAgo)`. No `(member_id, check_in_time)` index exists. With high attendance data this scan can timeout.

**Migration fix:**
```sql
CREATE INDEX IF NOT EXISTS idx_member_attendance_member_checkin 
  ON public.member_attendance(member_id, check_in_time DESC);
```

---

### P2-4 — Missing Index: `notifications(user_id)` — no FK index on the user lookup column

The `notifications` table has a `user_id UUID REFERENCES auth.users(id)` FK (migration `20260203084737`) but no corresponding index. Member notification polling will do full table scans.

**Migration fix:**
```sql
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, created_at DESC);
```

---

### P2-5 — CORS Inconsistency: `auto-notifications` and `evaluate-tiers-daily` do not include `*.lovable.app` wildcard in origin check

**Files:**  
- `supabase/functions/auto-notifications/index.ts:10–12`  
- `supabase/functions/evaluate-tiers-daily/index.ts:10–18`

Unlike all other functions that use an `isAllowedOrigin()` helper with `*.lovable.app` regex, these two functions only check against the hardcoded `ALLOWED_ORIGINS` array (missing the regex). Preview deployments on `*.lovable.app` can't invoke these functions from the browser.

**Remediation:** Add the `*.lovable.app` regex check (as used in `approve-slip`, `gamification-admin-ops`, etc.).

---

### P2-6 — Unvalidated `source_type` field in `gamification-issue-coupon`

**File:** `supabase/functions/gamification-issue-coupon/index.ts:52,81`

```typescript
const { source_type, source_id } = body;
// ...
source_type: source_type || "manual",  // fully caller-controlled, no allowlist
```

Any caller can inject arbitrary `source_type` strings (e.g., `"admin_manual"`, `"system"`, `"reward_tier"`) into the audit log, making the audit trail unreliable for fraud detection.

**Remediation:** Validate `source_type` against an allowlist:
```typescript
const ALLOWED_SOURCE_TYPES = ["reward_redemption", "level_up", "campaign", "manual"] as const;
if (source_type && !ALLOWED_SOURCE_TYPES.includes(source_type)) {
  return new Response(JSON.stringify({ error: "Invalid source_type" }), { status: 400 });
}
```

---

### P2-7 — `sell-package` error response leaks internal error messages in production

**File:** `supabase/functions/sell-package/index.ts:415–421`

```typescript
} catch (err) {
  const message = err instanceof Error ? err.message : 'Internal server error'
  return new Response(JSON.stringify({ error: message }), { status: 500 })  // leaks DB error details
}
```

Unlike all other edge functions that return the generic `"Internal server error"` string, `sell-package` leaks the actual `Error.message`, which can contain Postgres constraint names, column names, or other schema details.

**Remediation:** Log the error server-side and return the generic message:
```typescript
console.error('sell-package error:', err)
return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
```

---

## P3 Low

### P3-1 — `invite-staff` sends no actual invitation (silent stub)

**File:** `supabase/functions/invite-staff/index.ts:99`

```typescript
// TODO: Future integration point for email/LINE invitation
```

The function marks the staff record as `status: 'pending'` and logs the activity but does **not send any email or LINE message**. Staff invited via this endpoint have no way to know they've been invited. The `email` parameter is accepted but never used. This is a known stub but is caller-visible (returns `{ ok: true }` suggesting success).

---

### P3-2 — `stripe-create-checkout` success/cancel URLs use admin origin for member-initiated flows

**File:** `supabase/functions/stripe-create-checkout/index.ts:176–177`

```typescript
success_url: `${origin}/finance?payment=success`,
cancel_url: `${origin}/finance?payment=cancelled`,
```

`origin` is derived from the caller's `Origin` header, which is the admin app (`admin.moom.fit`). If members ever initiate Stripe checkout directly (not via staff), they'd be redirected to the admin finance page post-payment.

---

### P3-3 — `daily-briefing` line 77 has obfuscated/redacted API key retrieval

**File:** `supabase/functions/daily-briefing/index.ts:77`

```typescript
const LOVABLE_API_KEY=Deno.e...Y");
```

The line appears truncated/obfuscated in the file (reads `Deno.e...Y"`). This is likely a display artifact from the file viewer, but the actual file content should be verified to confirm `Deno.env.get("LOVABLE_API_KEY")` is the full expression and no key is hardcoded.

---

### P3-4 — Inconsistent supabase-js versions across edge functions

Functions import from `@supabase/supabase-js@2` (unpinned), `@2.49.1`, and `@2.93.3`. Unpinned imports (`@2`) resolve to the CDN's latest `@2.x.x`, which can silently change behavior.

**Files:** `approve-slip`, `invite-staff`, `line-auth`, `sell-package`, `stripe-*` use `@2` (unpinned).  
**Remediation:** Pin all to the same version (e.g., `@2.93.3`).

---

### P3-5 — `gamification-redeem-reward` stock decrement via read-modify-write is racy

**File:** `supabase/functions/gamification-redeem-reward/index.ts:264–266` and `110–112`

```typescript
// Non-atomic increment
await db.from("gamification_rewards").update({
  redeemed_count: (reward.redeemed_count || 0) + 1,
}).eq("id", reward_id);
```

The `redeemed_count` is read at line 170 and written at line 265. Under concurrent requests, two calls with the same stale `redeemed_count` will both write the same incremented value, losing one count. Use `update ... set redeemed_count = redeemed_count + 1` atomic SQL instead.

---

## Edge Function Summary Table

| Function | CORS ✓ | Auth ✓ | RBAC ✓ | Input Validation ✓ | Error Handling ✓ | Notes |
|---|---|---|---|---|---|---|
| `approve-slip` | ✅ | ✅ JWT+claims | ✅ level_3_manager | ✅ | ✅ | P1-5: non-atomic writes |
| `auto-notifications` | ⚠️ no wildcard | ⚠️ **P0-1 bypass** | ✅ service-only | ✅ | ✅ | P1-3: uncapped query |
| `daily-briefing` | ✅ | ✅ JWT+claims | ✅ level_2_operator | ✅ | ✅ | P3-3: line 77 obfuscated |
| `evaluate-tiers-daily` | ⚠️ no wildcard | ⚠️ **P0-1 bypass** | ✅ service-only | ✅ | ✅ | — |
| `gamification-admin-ops` | ✅ | ✅ getUser | ✅ level_3_manager | ✅ | ✅ | — |
| `gamification-assign-quests` | ✅ | ✅ getUser | ❌ **P0-4 no owner check** | ⚠️ | ✅ | — |
| `gamification-claim-quest` | ✅ | ✅ getUser | ✅ eq member_id | ✅ | ✅ | — |
| `gamification-issue-coupon` | ✅ | ✅ getUser | ❌ **P1-1 no owner check** | ⚠️ P2-6 | ✅ | — |
| `gamification-process-event` | ✅ | ✅ getUser | ⚠️ **P1-2 broken staff check** | ✅ | ✅ | P0-3 TOCTOU |
| `gamification-redeem-reward` | ✅ | ✅ getUser | ⚠️ **P1-2 broken staff check** | ✅ | ✅ | P0-3 TOCTOU |
| `invite-staff` | ✅ | ✅ JWT+claims | ✅ level_3_manager | ✅ | ✅ | P3-1: stub |
| `line-auth` | ⚠️ no wildcard | ✅ LINE API verify | N/A (public) | ✅ | ✅ | LINE token properly validated |
| `sell-package` | ✅ | ✅ JWT+claims | ✅ level_2_operator | ✅ | ⚠️ P2-7 | P1-4: non-atomic writes |
| `streak-freeze` | ✅ | ✅ getUser | ✅ identity_map lookup | ✅ | ✅ | — |
| `stripe-create-checkout` | ✅ | ✅ JWT+claims | ✅ level_3_manager | ✅ | ✅ | P3-2: redirect URL |
| `stripe-webhook` | ✅ | ✅ Stripe signature | N/A (webhook) | ✅ | ✅ | P1-5: non-atomic writes |
| `sync-gamification-config` | ✅ | ✅ getUser | ❌ **P0-2 RBAC missing** | ✅ | ✅ | Comment says "manager" but never checks |

---

## RLS Policies

- **No `DISABLE ROW LEVEL SECURITY`** found in any of the 91 migrations. ✅
- All 85 tables with `ENABLE ROW LEVEL SECURITY` confirmed across migrations.
- `member_gamification_profiles` had an overly-permissive `USING (true)` policy which was correctly patched in migration `20260421143257_fix_member_gamification_profiles_rls.sql`. ✅
- `transfer_slips` policies restrict to `level_3_manager` only — **members cannot submit slips via direct DB calls**, only via the Staff app (which uses manager-level staff). If a member-self-service slip submission flow is planned, a new INSERT policy scoped to `get_my_member_id()` will be needed.
- `gamification_audit_log` has no member-facing read policy — members cannot read their own audit trail. This may be intentional (security-through-opacity) but limits transparency features.

---

## Schema Issues

### Missing FK Indexes (P2-1 through P2-4)

| Table | Column | Index exists? | Impact |
|-------|--------|--------------|--------|
| `transactions` | `member_id` | ❌ | Member billing history scans |
| `transactions` | `staff_id` | ❌ | Staff transaction reports |
| `member_packages` | `member_id` | ❌ | Member entitlement lookups |
| `member_attendance` | `member_id, check_in_time` | ❌ (only idempotency index) | Inactive member detection |
| `notifications` | `user_id` | ❌ | Member notification polling |
| `member_billing` | `member_id` | ❌ | Member billing history |
| `activity_log` | `member_id` | ❌ | Member-specific activity queries |

> **Note:** Indexes *do* exist for: `transactions(idempotency_key)`, `transactions(source_ref)`, `transactions(status)`, `transactions(created_at)`, `member_attendance(member_id, schedule_id)` (idempotency only), `xp_ledger(member_id)`, `points_ledger(member_id)`, `activity_log(created_at)`, `activity_log(event_type)`, `activity_log(staff_id)`.

---

## API Keys / Secrets

- ✅ No hardcoded Stripe keys (`sk_live_*`, `sk_test_*`, `whsec_*`) found in source
- ✅ No hardcoded LINE Channel Secret or Access Token found in source
- ✅ No hardcoded service role keys found in source
- ✅ `.env` only contains public anon key (`VITE_SUPABASE_PUBLISHABLE_KEY`) — safe by design
- ✅ `.env.example` correctly documents secret handling (mentions `SUPABASE_ACCESS_TOKEN` as local-only)
- ⚠️ `supabase/functions/daily-briefing/index.ts:77` has an obfuscated line (`Deno.e...Y"`). Likely a display truncation artifact but should be verified against the deployed version.

---

## Stripe Webhook

- ✅ `stripe-webhook` correctly reads the raw request body **before** parsing
- ✅ `stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)` validates HMAC-SHA256 signature
- ✅ Missing signature header returns `400` immediately
- ✅ Invalid signature is caught by inner try/catch and returns `400 Invalid signature`
- ✅ Handles both `checkout.session.completed` and `charge.refunded` events
- ✅ Idempotency check prevents double-processing on retries
- ⚠️ P1-5: non-atomic write sequence (see above)

---

## LINE Webhook / Auth

- ✅ `line-auth` POSTs `id_token` + `client_id` to `https://api.line.me/oauth2/v2.1/verify`
- ✅ LINE API validates the token audience against the registered `LINE_CHANNEL_ID`
- ✅ Missing `LINE_CHANNEL_ID` secret returns `503 LINE_NOT_CONFIGURED`
- ✅ Invalid token returns `401 Invalid LINE token` (error from LINE API is logged, not forwarded to caller)
- ✅ No LINE channel secret stored in source code

---

## Recommendations Priority Queue

1. **[P0-1]** Fix auth bypass in `auto-notifications` + `evaluate-tiers-daily` — fix the `null !== null` CRON_SECRET check
2. **[P0-2]** Add `has_min_access_level` check in `sync-gamification-config` 
3. **[P0-3]** Make `gamification-redeem-reward` points debit atomic (Postgres function or `UPDATE WHERE`)
4. **[P0-4]** Add ownership/staff check in `gamification-assign-quests`
5. **[P1-1]** Add RBAC to `gamification-issue-coupon`
6. **[P1-2]** Replace `profiles` table query with `has_min_access_level` RPC in `gamification-process-event` + `gamification-redeem-reward`
7. **[P1-4/5]** Wrap `sell-package`, `approve-slip`, `stripe-webhook` multi-step writes in Postgres transactions
8. **[P2-1–4]** Add missing FK indexes via new migration
9. **[P3-4]** Pin all edge functions to `@supabase/supabase-js@2.93.3`
