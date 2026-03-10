

# Phase 5C: QuestHub + MomentumCard i18n

## What Exists

The `member.*` i18n namespace already has momentum keys (`member.momentum`, `member.badges`, `member.viewAll`, etc.) but **QuestHub.tsx** and **MomentumCard.tsx** do not use `useTranslation()` — all their UI strings are hardcoded English.

## Changes

### 1. Add ~20 new i18n keys to `en.ts` and `th.ts`

Under the `member` namespace, add quest and momentum-card keys:

- `questClaimed`, `questClaim`, `questExpired`, `questInProgress`
- `noQuestsYet`, `questsCheckBackSoon`
- `dailyQuests`, `resetsDaily`, `weeklyQuests`, `resetsMon`, `monthlySeasonal`
- `questClaimSuccess` (with `{{xp}}` and `{{coin}}` interpolation)
- `questClaimFailed`
- `startEarningXp` (for "Check in to start earning XP!")
- `todaysQuests`, `weeklyLabel`
- `earnFirstBadge`
- `leaderboard`, `mySquad`

### 2. Update QuestHub.tsx

- Import `useTranslation` and add `const { t } = useTranslation()` to both `QuestHub` and pass `t` to `QuestInstanceCard`
- Replace 13 hardcoded strings with `t('member.*')` calls
- Fix toast to use: `t('member.questClaimSuccess', { xp: data.xp_granted, coin: data.coin_granted })`

### 3. Update MomentumCard.tsx

- Import `useTranslation` and add `const { t } = useTranslation()`
- Replace 8 hardcoded strings: "View all", "Check in to start earning XP!", "Today's Quests", "weekly", "Badges", "Earn your first badge!", "Leaderboard", "My Squad"

### Files Modified

| File | Changes |
|------|---------|
| `src/i18n/locales/en.ts` | ~18 new keys under `member.*` |
| `src/i18n/locales/th.ts` | ~18 new keys under `member.*` |
| `src/apps/member/features/momentum/QuestHub.tsx` | Add `useTranslation`, replace 13 strings |
| `src/apps/member/features/momentum/MomentumCard.tsx` | Add `useTranslation`, replace 8 strings |

No database changes. No new files. Frontend-only.

