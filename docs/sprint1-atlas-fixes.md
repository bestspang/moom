# Sprint 1 Atlas — P0 Security & Backend Fixes

Date: 2026-04-21  
Author: Hermes Agent (subagent)  
Scope: All 6 P0 critical security and backend bugs

---

## FIX 1: Auth bypass in CRON_SECRET guard

**Status: ✅ FIXED**

### Files Changed
- `supabase/functions/auto-notifications/index.ts` (lines 18–32)
- `supabase/functions/evaluate-tiers-daily/index.ts` (lines 27–41)

### Problem
Original guard logic had logical flaws that allowed unauthenticated requests through:
- `if (!authHeader?.startsWith('Bearer ') && req.headers.get('x-cron-secret') !== cronSecret)` — if `CRON_SECRET` is not set, `cronSecret` is `undefined` and `x-cron-secret` header would also be `undefined`/`null`, making `null !== null` → `false`, meaning the outer `if` block was skipped entirely, so any bearer token (including a made-up one) would pass the `else if` branch.

### Fix Applied (both files)
Replaced with explicit, fail-secure logic:

**Before:**
```typescript
const authHeader = req.headers.get('Authorization')
const cronSecret = Deno.env.get('CRON_SECRET')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
if (!authHeader?.startsWith('Bearer ') && req.headers.get('x-cron-secret') !== cronSecret) {
  const token = authHeader?.replace('Bearer ', '')
  if (token !== serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, ... })
  }
} else if (authHeader?.startsWith('Bearer ')) {
  const token = authHeader.replace('Bearer ', '')
  if (token !== serviceRoleKey && req.headers.get('x-cron-secret') !== cronSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, ... })
  }
}
```

**After:**
```typescript
const cronSecret = Deno.env.get('CRON_SECRET')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const authHeader = req.headers.get('Authorization')
const token = authHeader?.replace('Bearer ', '')
const xCronSecret = req.headers.get('x-cron-secret')

const isValidCron = cronSecret && (
  authHeader === `Bearer ${cronSecret}` ||
  xCronSecret === cronSecret
)
const isServiceRole = serviceRoleKey && token === serviceRoleKey

if (!isValidCron && !isServiceRole) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, ... })
}
```

Key fix: `isValidCron` requires `cronSecret` to be truthy (env var set), so if `CRON_SECRET` is missing the cron path is always blocked. Fail-secure.

---

## FIX 2: Missing RBAC in sync-gamification-config

**Status: ✅ FIXED**

### File Changed
- `supabase/functions/sync-gamification-config/index.ts` (after line 60, new block inserted; old duplicate `adminDb` init removed at ~line 84)

### Problem
Comment on line 48 said `// Auth check — manager level required` but code only checked JWT validity — no role enforcement. Any authenticated user (including members) could sync gamification config.

### Fix Applied

**Before:**
```typescript
const { data: { user }, error: authError } = await userClient.auth.getUser();
if (authError || !user) return new Response(..., { status: 401 });

// Experience DB credentials
const experienceUrl = ...
```

**After:**
```typescript
const { data: { user }, error: authError } = await userClient.auth.getUser();
if (authError || !user) return new Response(..., { status: 401 });

// RBAC: require manager (level_3_manager) or above
const adminDb = createClient(supabaseUrl, serviceKey);
const { data: hasAccess } = await adminDb.rpc("has_min_access_level", {
  _user_id: user.id,
  _min_level: "level_3_manager",
});
if (!hasAccess) {
  return new Response(JSON.stringify({ error: "Forbidden: manager or admin role required" }), { status: 403, ... });
}

// Experience DB credentials
```

Also removed the duplicate `const adminDb = createClient(supabaseUrl, serviceKey)` that appeared lower in the function (now initialized once above for RBAC, reused for sync queries).

---

## FIX 3: Race condition in gamification-redeem-reward

**Status: ✅ FIXED**

### File Changed
- `supabase/functions/gamification-redeem-reward/index.ts` (steps 7–10 area, ~lines 200–310)

### Problem
Points balance and stock were checked with a read, then written separately. Between check and write, another concurrent request could pass the check with the same balance, causing double-spending of points and overselling of limited rewards.

### Fix Applied

Replaced the sequential read-check-then-write pattern with **atomic UPDATE WHERE** clauses:

**Before:**
```typescript
// Step 7: pre-flight read
if (profile.available_points < reward.points_cost) { return 400 }
// Step 8: pre-flight stock check
if (available <= 0) { return 400 }
// Step 10: debit (separate write — race window exists here)
const newAvailable = profile.available_points - reward.points_cost;
// ... then later:
await db.from("member_gamification_profiles").update({ available_points: newAvailable }).eq("member_id", member_id);
await db.from("gamification_rewards").update({ redeemed_count: ... }).eq("id", reward_id);
```

**After:**
```typescript
// Pre-flight checks still run for early 400 response (UX)
// Step 10: ATOMIC debit — only succeeds if balance still >= cost
const { count: debitCount } = await db
  .from("member_gamification_profiles")
  .update({ available_points: profile.available_points - reward.points_cost })
  .eq("member_id", member_id)
  .gte("available_points", reward.points_cost)  // ← WHERE clause prevents double-spend
  .select("member_id", { count: "exact", head: true });

if (debitCount === 0) { return 400 "Insufficient points (concurrent request)" }

// ATOMIC stock decrement — only if stock > redeemed_count
const { count: stockCount } = await db
  .from("gamification_rewards")
  .update({ redeemed_count: ... + 1 })
  .eq("id", reward_id)
  .lt("redeemed_count", reward.stock)  // ← WHERE clause prevents oversell
  .select("id", { count: "exact", head: true });

if (stockCount === 0) {
  // Roll back point debit, return 400
}
```

Also removed the stale `profiles` table query in the ownership check (see FIX 5).

---

## FIX 4: Missing ownership checks in assign-quests + issue-coupon

**Status: ✅ FIXED**

### Files Changed
- `supabase/functions/gamification-assign-quests/index.ts` (~line 55, after `member_id` validation)
- `supabase/functions/gamification-issue-coupon/index.ts` (~line 53, after required field validation)

### Problem
Both functions only verified JWT was valid, but did not check whether the caller had permission to operate on behalf of the given `member_id` or issue coupons to any member.

### Fix Applied — assign-quests

**Before:**
```typescript
if (!memberId) { return 400 }
// Immediately proceeds to assign quests
```

**After:**
```typescript
if (!memberId) { return 400 }

// Ownership check: caller must be admin/manager or the member themselves
const { data: memberRow } = await db.from('members').select('user_id').eq('id', memberId).single();
const isOwnMember = memberRow?.user_id === user.id;
const { data: hasManagerAccess } = await db.rpc('has_min_access_level', {
  _user_id: user.id,
  _min_level: 'level_3_manager',
});
if (!isOwnMember && !hasManagerAccess) {
  return new Response(..., { status: 403 });
}
```

### Fix Applied — issue-coupon

**Before:**
```typescript
if (!member_id || !coupon_template_id) { return 400 }
// Immediately proceeds to issue coupon
```

**After:**
```typescript
if (!member_id || !coupon_template_id) { return 400 }

// Ownership check: only managers/admins may issue coupons
const { data: hasManagerAccess } = await db.rpc('has_min_access_level', {
  _user_id: user.id,
  _min_level: 'level_3_manager',
});
if (!hasManagerAccess) {
  return new Response(..., { status: 403 });
}
```

---

## FIX 5: `profiles` table does not exist

**Status: ✅ FIXED**

### Files Changed
- `supabase/functions/gamification-process-event/index.ts` (~line 436)
- `supabase/functions/gamification-redeem-reward/index.ts` (~line 147) — fixed as part of FIX 3

### Problem
Both files queried `FROM profiles WHERE user_id = ?` to check `access_level`. The `profiles` table does not exist in any migration. Staff access levels live in `user_roles` + `roles` tables, and the `has_min_access_level(user_id, min_level)` RPC already encapsulates this lookup.

### Root Cause
The last migration (`20260421143257_fix_member_gamification_profiles_rls.sql`) also referenced `profiles` in a policy — that's a separate issue tracked separately.

### Fix Applied (both files)

**Before:**
```typescript
const { data: callerProfile } = await db.from('profiles').select('access_level').eq('user_id', user.id).single()
const isStaff = callerProfile && ['level_1_minimum',...].includes(callerProfile.access_level)
```

**After:**
```typescript
const { data: hasStaffAccess } = await db.rpc('has_min_access_level', {
  _user_id: user.id,
  _min_level: 'level_1_minimum',
})
const isStaff = !!hasStaffAccess
```

Uses the canonical `has_min_access_level` RPC (defined in migrations, queries `user_roles` + `roles` tables correctly).

---

## FIX 6: Non-atomic writes in sell-package, approve-slip, stripe-webhook

**Status: ✅ FIXED**

### Migration Created
- `supabase/migrations/20260421150548_atomic_write_rpcs.sql`

### Edge Functions Changed
- `supabase/functions/sell-package/index.ts` (~lines 241–370)
- `supabase/functions/approve-slip/index.ts` (~lines 129–232)
- `supabase/functions/stripe-webhook/index.ts` (~lines 80–140)

### Problem
All three functions performed multiple sequential INSERT/UPDATE operations across `transactions`, `member_packages`, `member_billing`, `promotion_redemptions`, `coupon_wallet`, `transfer_slips`, and `activity_log`. If any step after step 1 failed, earlier writes were already committed — resulting in partial data (e.g. a `transactions` record without a corresponding `member_packages` entitlement, or a paid coupon without a transaction).

### Fix Applied

Created three Postgres stored procedures in a new migration, each wrapping all writes in a single `LANGUAGE plpgsql` function (Postgres executes each PL/pgSQL function in an implicit transaction):

| RPC | Called by | Writes |
|-----|-----------|--------|
| `process_package_sale(...)` | `sell-package` | transactions + member_packages + member_billing + promotion_redemptions + promotions.usage_count + coupon_wallet + activity_log |
| `process_slip_approval(...)` | `approve-slip` | transactions + member_billing + member_packages + transfer_slips.status + activity_log |
| `process_stripe_payment(...)` | `stripe-webhook` | transactions.status + member_billing + member_packages + activity_log |

Each function uses `SECURITY DEFINER` and `SET search_path = public` for safe execution. If any write fails, Postgres automatically rolls back all writes in the same function call.

Edge functions now call `.rpc('process_*', {...})` instead of individual `.from().insert()` chains.

---

## Summary Table

| Fix | Files | Before | After | Status |
|-----|-------|--------|-------|--------|
| 1: CRON_SECRET bypass | auto-notifications, evaluate-tiers-daily | Flawed null!=null guard | Explicit `isValidCron && isServiceRole` check | ✅ FIXED |
| 2: RBAC sync-gamification-config | sync-gamification-config | Comment only, no enforcement | `has_min_access_level(level_3_manager)` before sync | ✅ FIXED |
| 3: Race condition redeem-reward | gamification-redeem-reward | Check-then-write (non-atomic) | Atomic `UPDATE WHERE gte/lt` with row count verification | ✅ FIXED |
| 4: Missing ownership checks | gamification-assign-quests, gamification-issue-coupon | No ownership check | `has_min_access_level` + own-member check | ✅ FIXED |
| 5: `profiles` table missing | gamification-process-event, gamification-redeem-reward | `FROM profiles` query → runtime error for staff | `rpc('has_min_access_level')` → correct `user_roles` lookup | ✅ FIXED |
| 6: Non-atomic writes | sell-package, approve-slip, stripe-webhook + migration | Sequential inserts (partial write possible) | Single Postgres stored proc per flow (implicit transaction) | ✅ FIXED |

## Notes

- No RLS policies were disabled (rule 1 complied)
- Fixes use only existing RPC infrastructure (`has_min_access_level`)
- New migration `20260421150548_atomic_write_rpcs.sql` adds three stored procedures with `SECURITY DEFINER` and `GRANT EXECUTE TO service_role`
- Fire-and-forget gamification events remain outside the atomic transaction (intentional — they are non-blocking side effects)
- The `profiles` reference in `20260421143257_fix_member_gamification_profiles_rls.sql` is a separate issue in an already-deployed migration and requires a new reverse migration to fix (not within scope of this sprint)
