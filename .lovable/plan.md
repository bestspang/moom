

# Phase 5D: Complete Momentum Components i18n

## Current State

Phases 5A-5C localized the leaderboard, squad, trainer surface, QuestHub, and MomentumCard. However, **9 momentum components** still have hardcoded English strings totaling ~50 user-facing strings. These components appear on high-traffic member surfaces (home, momentum hub, check-in celebration, rewards store).

## Plan

### Step 1: Add ~50 i18n keys to `en.ts` and `th.ts`

Group under `member.*`:

**BadgeGrid** (3 keys): `completeChallengesForBadges`, `badgeLabel`, rarity labels (`rarityCommon`, `rarityRare`, `rarityEpic`, `rarityLegendary`)

**ChallengeCard** (6 keys): `ending`, `daysLeft`, `progress`, `completed`, `joinChallenge`, `joining`

**RewardDropCard** (9 keys): `rewardClaimed`, `rewardClaimFailed`, `limited`, `soldOut`, `levelRequired`, `itemsLeft`, `coinPlusCash`, `claimed`, `claiming`, `notEnough`, `claim`

**StreakFreezeButton** (4 keys): `freezeStreak`, `freezing`, `streakFrozenUntil`, `freezeFailed`, `needCoinToFreeze`

**TodayCard** (4 keys): `happeningNow`, `startingIn`, `todayAt`, `withTrainer`

**SocialProofCheckins** (3 keys): `squadTrainingToday`, `moreTrainingToday`, `peopleWorkingOut`

**LevelPerksCard** (3 keys): `levelPerks`, `unlocked`, `comingNext`

**LevelRequirementsCard** (5 keys): `levelRequirements`, `totalXpLabel`, `weeklyStreakLabel`, `questsCompletedLabel`, `badgesEarnedLabel`

**UpcomingMilestones** (4 keys): `almostThere`, `moreToUnlock`, `nextMilestones`, `moreToGo`

### Step 2: Update 9 component files

Each file gets `useTranslation()` import and all hardcoded strings replaced with `t()` calls. Dynamic strings use i18next interpolation (e.g., `t('member.levelRequired', { level: reward.levelRequired })`).

### Files Modified

| File | Hardcoded Strings |
|------|------------------|
| `src/i18n/locales/en.ts` | ~50 new keys |
| `src/i18n/locales/th.ts` | ~50 new keys |
| `src/apps/member/features/momentum/BadgeGrid.tsx` | 5 strings |
| `src/apps/member/features/momentum/ChallengeCard.tsx` | 6 strings |
| `src/apps/member/features/momentum/RewardDropCard.tsx` | 9 strings |
| `src/apps/member/features/momentum/StreakFreezeButton.tsx` | 5 strings |
| `src/apps/member/features/momentum/TodayCard.tsx` | 4 strings |
| `src/apps/member/features/momentum/SocialProofCheckins.tsx` | 3 strings |
| `src/apps/member/features/momentum/LevelPerksCard.tsx` | 3 strings |
| `src/apps/member/features/momentum/LevelRequirementsCard.tsx` | 5 strings |
| `src/apps/member/features/momentum/UpcomingMilestones.tsx` | 4 strings |

No database changes. No new files. Frontend-only. This completes member momentum i18n coverage.

