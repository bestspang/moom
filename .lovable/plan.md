

# Phase 4: RLS Fix for Member Self-Access + Remaining Polish

## Critical Issue Found

**All gamification RLS policies use `line_users` join to resolve member ownership**, but self-signup members are linked via `identity_map`, NOT `line_users`. This means:

- Self-signup members **cannot read** their own: gamification profiles, XP ledger, points ledger, streaks, badge earnings, challenge progress, reward redemptions, squad memberships
- Only LINE-linked members (legacy LIFF flow) can access their own gamification data

This is a **blocking bug** for the member app. Every "Members can read own ..." RLS policy needs to also check `identity_map`.

## Affected RLS Policies (all use `line_users` join only)

1. `member_gamification_profiles` — "Members can read own gamification profile"
2. `xp_ledger` — "Members can read own xp ledger"
3. `points_ledger` — "Members can read own points ledger"
4. `streak_snapshots` — "Members can read own streaks"
5. `badge_earnings` — "Members can read own badge earnings"
6. `challenge_progress` — "Members can read own challenge progress"
7. `reward_redemptions` — "Members can read own redemptions"
8. `squad_memberships` — "Members can join/leave/read squads"

## Fix Approach

Create a **security definer helper function** `get_my_member_id(uuid)` that resolves member ID from BOTH `identity_map` AND `line_users`:

```sql
CREATE OR REPLACE FUNCTION public.get_my_member_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT admin_entity_id FROM identity_map 
     WHERE experience_user_id = _user_id AND entity_type = 'member' AND is_verified = true
     LIMIT 1),
    (SELECT member_id FROM line_users 
     WHERE user_id = _user_id
     LIMIT 1)
  )
$$;
```

Then update all affected RLS policies to use:
```sql
USING (member_id = public.get_my_member_id(auth.uid()) 
       OR has_min_access_level(auth.uid(), 'level_1_minimum'::access_level))
```

This is simpler, faster (no subquery join), and works for both identity_map and line_users linked members.

## Other Remaining Items (already done, verified)

| Section | Status |
|---------|--------|
| 1 — Domain-aware auth | **Done** |
| 2 — Role-aware access | **Done** |
| 3 — Login/signup UX | **Done** |
| 4 — Legacy account claim | **Done** (trigger auto-links by email) |
| 5 — Identity/verification | **Partial** (linking UI deferred, verification naturally satisfied) |
| 6 — Supabase auth impl | **Done** |
| 7 — UX/UI deliverables | **Done** (admin switch, signup guard, diagnostics) |

## Additional Fix: `/signup` and `/diagnostics/auth` route affinity

`SHARED_PREFIXES` in `hostname.ts` includes `/diagnostics/surface` but not `/diagnostics/auth` or `/signup`. Add them so SurfaceGuard handles them correctly on production domains.

## Implementation Plan

### Task 1: DB Migration — Create `get_my_member_id` helper function

Single security-definer function that resolves member_id from either `identity_map` or `line_users`.

### Task 2: DB Migration — Update all member-self-access RLS policies

Drop and recreate the 8+ policies to use `get_my_member_id(auth.uid())` instead of the `line_users` subquery join.

### Task 3: Update `SHARED_PREFIXES` in `hostname.ts`

Add `/signup` and `/diagnostics/auth` to the shared prefixes list.

## Files to Change

| File | Change |
|------|--------|
| DB migration (SQL) | Create `get_my_member_id` function + update ~10 RLS policies |
| `src/apps/shared/hostname.ts` | Add `/signup`, `/diagnostics/auth` to `SHARED_PREFIXES` |

## Zero Changes To
- AuthContext, Login pages, MemberLogin, AdminLogin, MemberSignup, ProtectedRoute, SurfaceGuard logic, member app pages, admin pages, shared components, triggers

## Risks
- Low: RLS policy replacement is atomic within a migration
- The `get_my_member_id` function uses SECURITY DEFINER to bypass RLS on the lookup tables (same pattern as `has_role`)
- Existing LINE-linked members continue to work (function checks both sources)

## Deferred (Phase 5+)
- Identity linking UI (add Google/password to existing account)
- Phone OTP (requires Twilio)
- Onboarding wizard for new members

