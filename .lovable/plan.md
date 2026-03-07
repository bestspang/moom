

# Security Audit Report — Post-Fix Review (Round 2)

Good news: The previous round of fixes addressed the CRITICAL and most HIGH findings well. Auth checks are now on `invite-staff` and `daily-briefing`, CORS is locked to `admin.moom.fit`, signup is disabled, and the PostgREST injection is sanitized.

Here are the **remaining and newly identified** vulnerabilities:

---

## FINDING A — HIGH: `approve-slip` Missing Access Level Check

**File:** `supabase/functions/approve-slip/index.ts` (lines 15-42)

The function validates the JWT (good), but never checks `has_min_access_level`. Any authenticated user — including a `level_1_minimum` front-desk staff — can approve transfer slips, create transactions, grant member packages, and write activity logs using the service role key.

**Fix:** Add after line 33:
```typescript
const { data: accessCheck } = await supabase.rpc("has_min_access_level", {
  _user_id: userId,
  _min_level: "level_3_manager",
});
if (!accessCheck) {
  return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, ... });
}
```

---

## FINDING B — HIGH: Google OAuth Creates Uncontrolled Staff Accounts

**File:** `src/pages/Auth/Login.tsx` (line 34)

While `/signup` is disabled, Google OAuth sign-in is still enabled. When a new Google user signs in, the `handle_new_user` trigger fires and auto-creates a `staff` record + `front_desk` role — the same privilege escalation path as the old signup. Any person with a Google account can get `level_1_minimum` access and read member PII.

**Fix options:**
1. Remove the Google sign-in button entirely (staff should be invited only), OR
2. Add a domain restriction (only allow `@moom.fit` emails), OR
3. Modify `handle_new_user` to set status=`inactive` for OAuth users and require manager approval before granting data access

---

## FINDING C — MEDIUM: Transaction Number Race Condition (Still Present)

**File:** `supabase/functions/stripe-create-checkout/index.ts` (line 98-99) and `approve-slip/index.ts` (line 99-100)

Both functions still use:
```typescript
const { count } = await supabase.from('transactions').select('*', { count: 'exact', head: true })
const txNo = `T-${String((count || 0) + 1).padStart(7, '0')}`
```

This was flagged in the previous audit but not fixed. Two concurrent requests produce duplicate `txNo`.

**Fix:** Create a database sequence:
```sql
CREATE SEQUENCE IF NOT EXISTS public.transaction_number_seq START 1;
```
Then use an RPC function:
```sql
CREATE FUNCTION public.next_transaction_number()
RETURNS text LANGUAGE sql AS $$
  SELECT 'T-' || lpad(nextval('public.transaction_number_seq')::text, 7, '0');
$$;
```

---

## FINDING D — MEDIUM: `stripe-create-checkout` Missing Access Level Check

**File:** `supabase/functions/stripe-create-checkout/index.ts`

Like `approve-slip`, this function authenticates the JWT but doesn't verify access level. Any `level_1_minimum` user can create Stripe checkout sessions and pending transactions.

**Fix:** Add `has_min_access_level` check for `level_2_operator` or `level_3_manager` after line 41.

---

## FINDING E — MEDIUM: `daily-briefing` Missing Access Level Check

**File:** `supabase/functions/daily-briefing/index.ts`

JWT is now validated (good), but there's no access level check. Any authenticated user can invoke the AI briefing, consuming AI credits and seeing operational stats.

**Fix:** Add `has_min_access_level` check for `level_2_operator` after claims validation.

---

## FINDING F — MEDIUM: Missing `/reset-password` Route

**File:** `src/pages/Auth/ForgotPassword.tsx` (line 39)

The password reset email redirects to `${window.location.origin}/reset-password`, but no `/reset-password` route exists in `App.tsx`. Users clicking the reset link will see a 404.

**Fix:** Create a `ResetPassword` page and add route in `App.tsx`.

---

## FINDING G — LOW: `line-auth` Stores Raw ID Token

**File:** `supabase/functions/line-auth/index.ts` (line 167)

The raw LINE `idToken` is stored in `line_id_token` column. This is a bearer credential that could be replayed within its validity window. It should not be persisted.

**Fix:** Remove `line_id_token: idToken` from the insert, or store only a hash for verification.

---

## FINDING H — LOW: Error Messages Leak Internal Details

**Files:** All edge functions' catch blocks

`error.message` from Supabase/Stripe SDK errors is returned directly to the client, potentially revealing table names, column names, or constraint details.

**Fix:** Return generic error messages to clients. Log detailed errors server-side only:
```typescript
console.error('Error:', err);
return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, ... });
```

---

## Summary

| # | Severity | Finding | Status |
|---|----------|---------|--------|
| A | HIGH | `approve-slip` no access level check | NEW |
| B | HIGH | Google OAuth bypasses signup lock | NEW |
| C | MEDIUM | Transaction number race condition | UNFIXED from Round 1 |
| D | MEDIUM | `stripe-create-checkout` no access level check | NEW |
| E | MEDIUM | `daily-briefing` no access level check | NEW |
| F | MEDIUM | Missing `/reset-password` route | NEW |
| G | LOW | LINE raw ID token stored | NEW |
| H | LOW | Error messages leak internal details | NEW |

**Recommended fix order:** A → B → D → C → E → F → H → G

## Implementation Plan

### Step 1: Add access level checks to edge functions (A, D, E)
- `approve-slip`: Add `has_min_access_level(userId, 'level_3_manager')` after JWT validation
- `stripe-create-checkout`: Add `has_min_access_level(userId, 'level_3_manager')` after JWT validation
- `daily-briefing`: Add `has_min_access_level(userId, 'level_2_operator')` after JWT validation

### Step 2: Close Google OAuth loophole (B)
- Remove Google sign-in button from `Login.tsx` (safest option, consistent with "staff must be invited" policy)

### Step 3: Fix transaction number race condition (C)
- Create DB sequence via migration
- Create `next_transaction_number()` RPC function
- Update both `stripe-create-checkout` and `approve-slip` to use `supabase.rpc('next_transaction_number')`

### Step 4: Harden error responses (H)
- Replace `err.message` with generic messages in all edge function catch blocks

### Step 5: Remove LINE ID token storage (G)
- Remove `line_id_token: idToken` from insert in `line-auth`

### Step 6: Add reset-password route (F)
- Create `ResetPassword.tsx` page with password update form
- Add `/reset-password` public route in `App.tsx`

### Files to modify:
| File | Changes |
|---|---|
| `supabase/functions/approve-slip/index.ts` | Add access level check + generic error |
| `supabase/functions/stripe-create-checkout/index.ts` | Add access level check + use sequence + generic error |
| `supabase/functions/daily-briefing/index.ts` | Add access level check + generic error |
| `supabase/functions/line-auth/index.ts` | Remove ID token storage + generic error |
| `supabase/functions/stripe-webhook/index.ts` | Generic error only |
| `supabase/functions/invite-staff/index.ts` | Generic error only |
| `src/pages/Auth/Login.tsx` | Remove Google OAuth button |
| `src/pages/Auth/ResetPassword.tsx` | New — password reset form |
| `src/App.tsx` | Add `/reset-password` route |
| DB migration | Add `transaction_number_seq` + `next_transaction_number()` |

### Risk
- **Low regression**: Edge function auth tightening is additive (adds checks, no behavior change for authorized users)
- **Google OAuth removal**: Users who previously signed in via Google will still have sessions; they just can't create new accounts this way
- **Transaction sequence**: Existing `transaction_id` values unaffected; sequence starts from current max + 1

