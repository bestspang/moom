

# Phase 10: Trainer Badges & Achievement Page

## Status Check
- Phase 7: Leaderboard Time Windows ✅
- Phase 8: Squad Activity Feed ✅
- Phase 9: Squad Reactions & Encouragement ✅

## What's Next

The trainer surface has Home, Impact, Schedule, Roster, Workouts, and Profile — but no **badges or achievement history**. The expansion plan explicitly calls for "coach badges," "partner badge shelf," and "achievement history" as core trainer gamification surfaces.

Currently, `badge_earnings` is member-only (FK to `members.id`). Trainers have no equivalent. We need a lightweight `trainer_badge_earnings` table and a new page.

## Plan

### 1. Database Migration

**New table: `trainer_badge_earnings`**
- `id uuid PK`
- `staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE`
- `badge_id uuid NOT NULL REFERENCES gamification_badges(id) ON DELETE CASCADE`
- `earned_at timestamptz DEFAULT now()`
- `metadata jsonb DEFAULT '{}'`
- `UNIQUE(staff_id, badge_id)`

RLS:
- Trainers can read their own: `staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid())`
- Staff can read all: `has_min_access_level(auth.uid(), 'level_1_minimum')`
- Managers can manage: `has_min_access_level(auth.uid(), 'level_3_manager')`

### 2. API: `src/apps/trainer/features/impact/api.ts`

Add `fetchTrainerBadges(staffId)` — queries `trainer_badge_earnings` joined with `gamification_badges`, and `fetchAllTrainerBadges()` for full gallery (earned vs locked).

### 3. New Page: `src/apps/trainer/pages/TrainerBadgesPage.tsx`

A badge gallery similar to `MemberBadgeGalleryPage.tsx` but adapted for trainers:
- Shows earned badges prominently with earned date
- Shows locked badges greyed out
- Groups by tier (bronze/silver/gold/platinum)
- Uses trainer-appropriate language ("Coach Achievement" vs "Partner Recognition")

### 4. Routing & Navigation

- Add route: `<Route path="badges" element={<TrainerBadgesPage />} />` under `/trainer`
- The Impact page already links to this conceptually — add a "View All Badges" link from the Impact page
- No bottom nav change (keep 5 tabs clean; badges accessible from Impact page)

### 5. i18n

~8 keys: `trainer.badges`, `trainer.badgesSubtitle`, `trainer.earned`, `trainer.locked`, `trainer.noBadgesYet`, `trainer.viewAllBadges`, `trainer.earnedOn`, `trainer.badgeGallery`

### Files

| File | Action |
|------|--------|
| Migration SQL | Create `trainer_badge_earnings` table + RLS |
| `src/apps/trainer/features/impact/api.ts` | Add `fetchTrainerBadges` |
| `src/apps/trainer/pages/TrainerBadgesPage.tsx` | **Create** — badge gallery page |
| `src/apps/trainer/pages/TrainerImpactPage.tsx` | Add "View All Badges" link |
| `src/App.tsx` | Add `/trainer/badges` route |
| `src/i18n/locales/en.ts` | ~8 new keys |
| `src/i18n/locales/th.ts` | ~8 new keys |

