

# Recheck: Referral Program + Smart Check-in + Dashboard — Gap Analysis

## What's Already Implemented (Working)

1. **Referral Program UI**: `ReferralCard`, `MemberReferralPage`, referral API, route `/member/referral`, signup `?ref=CODE` detection, `member_referrals` table + RLS
2. **Smart Check-in**: `MemberCheckInPage` with QR scanning, `fireGamificationEvent`, `CheckInCelebration` animation
3. **Personalized Dashboard**: `MemberHomePage` with momentum, challenges, squad, leaderboard, packages with expiry countdown, referral card, AI suggestions

## Critical Gap Found

**The referral_code from signup is NEVER processed server-side.** The `handle_new_user` trigger stores `referral_code` in `raw_user_meta_data` but nothing reads it to:
- Link the new member as `referred_member_id` in `member_referrals`
- Grant reward points to both referrer and referred on first check-in

This is a **stub** — the UI pretends referral works but the backend loop is incomplete.

## Plan: Complete the Referral Backend Loop

### Step 1: Update `handle_new_user` trigger to process referral codes
Add logic at the end of the member signup branch:
- Read `referral_code` from `raw_user_meta_data`
- If found, look up the referrer in `member_referrals` by code
- Insert a new row with `referred_member_id = v_member_id` (or update existing pending row)

**File**: New migration SQL

```sql
-- In handle_new_user, after creating the member + identity_map:
v_referral_code := NEW.raw_user_meta_data->>'referral_code';
IF v_referral_code IS NOT NULL AND v_referral_code != '' THEN
  UPDATE public.member_referrals
  SET referred_member_id = v_member_id, status = 'signed_up'
  WHERE referral_code = upper(trim(v_referral_code))
    AND referred_member_id IS NULL
    AND status = 'pending';
END IF;
```

### Step 2: Add referral reward granting in gamification-process-event
When `event_type = 'check_in'`, check if this member has a referral row with `status = 'signed_up'` and `reward_granted = false`. If so:
- Grant points to both referrer and referred
- Update status to `completed`, set `reward_granted = true`

**File**: `supabase/functions/gamification-process-event/index.ts` — add post-check-in referral completion logic

### Step 3: Minor UX polish
- The share URL currently uses `/signup?ref=CODE` but the actual route is `/member/signup` — fix to use correct route
- Add referral link to MemberProfilePage menu items

**Files touched**:
- New migration (alter `handle_new_user` trigger)
- `supabase/functions/gamification-process-event/index.ts`
- `src/apps/member/features/referral/ReferralCard.tsx` (fix share URL)
- `src/apps/member/pages/MemberReferralPage.tsx` (fix share URL)

### Risk Assessment
- Modifying `handle_new_user` trigger: medium risk — must preserve existing member/staff creation logic
- Gamification edge function: low risk — additive logic after existing check-in processing
- Share URL fix: zero risk — cosmetic

