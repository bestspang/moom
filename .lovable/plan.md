

# Phase 1 Polish: Clean Up Legacy Code + Bottom Nav Update

## Status Check

All Phase 1 deliverables are functionally complete:
- Economy spec locked (docs/ECONOMY_V1.md)
- Event map locked (docs/gamification-event-map.md)
- Frontend tiers/levels aligned to DB
- Member: MomentumCard, QuestHub, Rewards, Badge Gallery — all working
- Admin: GamificationOverview with economy stats — working
- Trainer: CoachImpactCard + PartnerReputationCard — already existed

## What Needs Cleanup

### 1. MemberMomentumPage — Legacy `challenge_progress` code

The Momentum page still fetches and renders legacy `gamification_challenges` + `challenge_progress` alongside the new `quest_instances` system. This creates duplicate UI (QuestHub shows real quests, but below that there are "Community Challenges" and "Active Challenges" using the old system).

**Fix:** Remove the legacy challenge sections from the Quests tab. Keep only `QuestHub` (which already handles daily/weekly/monthly quests correctly). Remove unused imports (`fetchActiveChallenges`, `fetchMyChallengeProgress`, `joinChallenge` mutation, `QuestCard`, `ChallengeProgressEntry`).

### 2. Bottom Nav — Replace "Coupons" with "Rewards"

Current nav: `Home | Schedule | Check In | Coupons | Profile`

The "Coupons" tab is less discoverable than the Rewards/Momentum system which is now the core engagement loop. Replace with "Rewards" pointing to `/member/rewards`.

Updated nav: `Home | Schedule | Check In | Rewards | Profile`

### 3. DailyBonusCard — Show actual XP from spec

Currently shows generic "+XP". Should show the actual value from the economy spec: "+8 XP, +1 Coin" (matching the `check_in` rule).

## Files to change

| File | Change |
|------|--------|
| `src/apps/member/pages/MemberMomentumPage.tsx` | Remove legacy challenge code from Quests tab; keep only QuestHub |
| `src/apps/member/components/MemberBottomNav.tsx` | Change "Coupons" → "Rewards" with Gift icon, path `/member/rewards` |
| `src/apps/member/features/momentum/DailyBonusCard.tsx` | Show "+8 XP · +1 Coin" instead of "+XP" |

No database changes. No new files.

