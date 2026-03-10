

# Phase 6: Trainer Impact Detail Page

## What Exists

The trainer surface has 5 pages (home, schedule, roster, workouts, profile). The home page shows a `CoachImpactCard` or `PartnerReputationCard` depending on trainer type, but there is **no dedicated gamification/impact page** where trainers can see their full score breakdown, quest list, tier progress, and score history. The member surface has `MemberMomentumPage` as a rich equivalent — trainers need the same depth.

The backend already supports this: `trainer_gamification_scores` stores score/breakdown/coin_balance, `quest_templates` has `audience_type: trainer_inhouse | trainer_freelance`, and the API layer (`fetchCoachImpactProfile`, `fetchPartnerReputationProfile`, `fetchTrainerQuests`) already exists.

## Plan

### 1. Create `TrainerImpactPage.tsx`

New file: `src/apps/trainer/pages/TrainerImpactPage.tsx`

A single page that adapts based on trainer type (in_house vs freelance):

- **Hero section**: Score circle (reuse from impact cards), tier badge, coin balance
- **Metrics grid**: 4 key metrics from the breakdown (attendance rate, return rate, etc.)
- **Quests section**: Active trainer quests from `fetchTrainerQuests()`, showing goal/reward
- **Tier progress**: Current tier, next tier threshold, progress bar
- **Score history placeholder**: "Coming soon" section for future weekly score charts

All strings use `useTranslation()` with new `trainer.*` i18n keys.

### 2. Add route + navigation

- Add `/trainer/impact` route in `App.tsx` under the trainer layout
- Make the impact card on `TrainerHomePage` tappable — navigating to `/trainer/impact`
- Optionally add an "Impact" tab to the bottom nav (replacing or alongside an existing tab)

### 3. Add ~15 i18n keys

Under `trainer.*` in both `en.ts` and `th.ts`:
- `impactScore`, `reputationScore`, `tierProgress`, `nextTier`, `currentTier`
- `trainerQuests`, `noQuestsAvailable`, `scoreBreakdown`
- `coachImpactTitle`, `partnerReputationTitle`
- `viewImpactDetail`, `scoreHistoryComingSoon`

### Files

| File | Action |
|------|--------|
| `src/apps/trainer/pages/TrainerImpactPage.tsx` | **Create** — full impact detail page |
| `src/App.tsx` | Add route `/trainer/impact` |
| `src/apps/trainer/pages/TrainerHomePage.tsx` | Make impact card tappable (wrap with onClick → navigate) |
| `src/i18n/locales/en.ts` | ~15 new trainer keys |
| `src/i18n/locales/th.ts` | ~15 new trainer keys |

No database changes. No new API functions needed (reuses existing `fetchCoachImpactProfile`, `fetchPartnerReputationProfile`, `fetchTrainerQuests`, `fetchTrainerType`).

