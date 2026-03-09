

# Root Cause: Missing Member Record — Trigger Timing Issue

## Diagnosis (Verified with Real Data)

Your auth user (`41ff3f12-55c8-4061-bd58-57ffebbd683a`, bestspang@gmail.com) was created **before** the `handle_new_user` trigger was updated to auto-provision member records (migration `20260309131928`). As a result:

- `identity_map` query returns `[]` — no link exists
- `line_users` query returns `[]` — no link exists  
- `members` table has no row for `bestspang@gmail.com`
- `useMemberSession()` returns `memberId: null`

In `MemberHomePage.tsx` line 143: `{memberId && (<MomentumCard .../>)}` — this guard prevents ALL gamification UI from rendering when `memberId` is null. Same for ReferralCard (line 199) and SuggestedClassCard (line 206).

## Fix Plan (2 Parts)

### Part 1: Backfill Missing Member Record (DB Migration)
Create the missing `members` row + `identity_map` entry for your existing auth user. This is the proper fix — the trigger should have done this at signup.

```sql
-- Backfill member record for pre-trigger auth users
DO $$
DECLARE
  v_member_id uuid;
  v_member_code text;
BEGIN
  v_member_code := 'M-' || lpad(floor(random() * 100000000)::text, 8, '0');
  
  INSERT INTO public.members (first_name, last_name, member_id, email, status, source)
  VALUES ('Kongphop', 'Suriyawanakul', v_member_code, 'bestspang@gmail.com', 'active', 'self_signup')
  RETURNING id INTO v_member_id;

  INSERT INTO public.identity_map (admin_entity_id, experience_user_id, entity_type, shared_identifier, shared_identifier_type, is_verified)
  VALUES (v_member_id, '41ff3f12-55c8-4061-bd58-57ffebbd683a', 'member', 'bestspang@gmail.com', 'email', true);
END $$;
```

### Part 2: Make UI Resilient (Prevent Future Issues)
Even after backfill, other users might have the same problem. Make the home page show gamification in "starter mode" when `memberId` is null instead of hiding it completely.

**File**: `src/apps/member/pages/MemberHomePage.tsx`
- Remove the `{memberId && ...}` guard around MomentumCard
- Pass `memberId` or fallback `user?.id` to MomentumCard
- MomentumCard already handles null profile → shows starter defaults

**File**: `src/apps/member/features/momentum/MomentumCard.tsx`
- Make `memberId` prop accept `string | null`
- When null: show starter card with CTA to complete profile/check-in
- All DB queries already return empty → DEFAULT_PROFILE kicks in

### Files to Modify
- DB migration (backfill member record)
- `src/apps/member/pages/MemberHomePage.tsx` (remove memberId guards)
- `src/apps/member/features/momentum/MomentumCard.tsx` (handle null memberId gracefully)

### Risk: Near-zero
- DB migration is additive (INSERT only)
- UI changes are display-only — no business logic affected
- MomentumCard fallback already exists, just needs to be reachable

