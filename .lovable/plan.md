

# Phase 2: Clean Legacy Challenge References + Check-In Flow Polish

## Remaining Technical Debt

Two files still reference the **legacy `challenge_progress` system** that was removed from MemberMomentumPage:

### 1. `MemberCheckInPage.tsx`
- Line 9: imports `fetchMyChallengeProgress` (legacy)
- Lines 35-39: fetches `challenges` query using legacy function
- Line 66: invalidates `my-challenges` query key
- Passes `challenges` to `CheckInCelebration`

### 2. `CheckInCelebration.tsx`
- Line 8: imports `ChallengeProgressEntry` type
- Line 18: accepts `challenges: ChallengeProgressEntry[]` prop
- Lines 146-168: renders "Challenge Progress" section using legacy data

Both should switch to **quest instances** (the v1 system) or remove the challenge section entirely.

## Plan — 2 files

### `src/apps/member/pages/MemberCheckInPage.tsx`
- Remove `fetchMyChallengeProgress` import
- Remove the legacy `challenges` query
- Remove `my-challenges` invalidation (replace with `my-quests` invalidation)
- Pass quest data or remove `challenges` prop from `CheckInCelebration`

### `src/apps/member/features/momentum/CheckInCelebration.tsx`
- Remove `ChallengeProgressEntry` import and prop
- Replace "Challenge Progress" section with **Quest Progress** showing active daily quests from `quest_instances` (fetch inline or accept as prop)
- Keep all existing celebration UI (confetti, XP count-up, streak, tier badge, social proof)

## What stays the same
- Check-in flow (QR scan, attendance insert, gamification event fire) — unchanged
- Confetti animation, XP/Coin display, auto-dismiss — unchanged
- Social proof section — unchanged

