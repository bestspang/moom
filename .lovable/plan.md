

# Phase 5A: Enhanced Leaderboard + Trainer Surface i18n

## Current State

The project has a working but minimal post-launch gamification system:
- **Leaderboard**: Single page with 3 tabs (XP, Squads, Challenges) — flat top-20 list, no time windows, no "around you", no category boards
- **Squads**: Basic join/leave with XP total — no roles beyond leader/member, no activity feed, no squad challenges
- **Trainer UI**: CoachImpactCard and PartnerReputationCard exist on trainer home, but the entire trainer surface has hardcoded English (not localized), and there are only 5 routes (home, schedule, roster, workouts, profile) — no dedicated gamification pages
- **Realtime**: Already enabled for gamification tables (profiles, badges, quest_instances, reward_redemptions) but not for squads
- **Seasonal**: No campaign hub or seasonal UI exists yet

## What to Build First (Incremental Phase 5A)

Given the project's incremental strategy, this phase focuses on the **highest-impact, lowest-risk** improvements:

1. **Enhanced Leaderboard** — add time-window tabs (All-time / This Week / This Month), "Around You" positioning, and streak/attendance category boards
2. **Trainer Surface i18n** — the trainer surface has ~30 hardcoded English strings across layout, home, and impact cards
3. **Realtime for squads** — enable realtime on `squads` and `squad_memberships` tables, add to sync layer

---

### Step 1: Database — Enable realtime for squad tables

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.squads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.squad_memberships;
```

No schema changes needed — existing tables support all planned features.

### Step 2: Enhanced Leaderboard API

Update `src/apps/member/features/momentum/api.ts`:
- Add `fetchXpLeaderboardByPeriod(period: 'all' | 'weekly' | 'monthly')` — filters by `created_at` range on `xp_ledger` aggregation or uses `member_gamification_profiles.total_xp` for all-time
- Add `fetchAroundMeLeaderboard(memberId)` — fetches 5 above + 5 below current user's rank
- Add `fetchStreakLeaderboard()` — ranked by `current_streak` from `member_gamification_profiles`
- Add `fetchAttendanceLeaderboard()` — ranked by check-in count from `member_attendance` in current month

### Step 3: Enhanced Leaderboard UI

Update `src/apps/member/pages/MemberLeaderboardPage.tsx`:
- Add period selector (All-time / This Week / This Month) as sub-tabs or chips within the XP tab
- Add "Around You" section below top-20 showing user's position with nearby members
- Add 2 new tabs: Streaks and Attendance
- Add i18n keys for new UI elements

### Step 4: Realtime Sync Layer Update

Update `src/hooks/useRealtimeSync.ts`:
- Add `squads` and `squad_memberships` to `TABLE_INVALIDATION_MAP`
- Map to query keys: `['my-squad', 'available-squads', 'squad-rankings']`

### Step 5: Trainer Surface i18n

Add ~30 trainer keys to `en.ts` and `th.ts` under a `trainer` namespace:
- `TrainerLayout.tsx`: Nav labels (Home, Schedule, Roster, Workouts, Profile)
- `TrainerHomePage.tsx`: "Today's overview", "Today's Classes", "Total Bookings", "across today", "Today's Schedule", "No classes today", "Announcements", "checked in"
- `CoachImpactCard.tsx`: Level labels, metric labels
- `PartnerReputationCard.tsx`: Tier labels, metric labels
- `TrainerHeader.tsx`: Any header text

Update all 5 trainer files to use `useTranslation()` + `t()` calls.

---

### Files Modified

| File | Changes |
|------|---------|
| `src/apps/member/features/momentum/api.ts` | Add 4 new leaderboard fetch functions |
| `src/apps/member/pages/MemberLeaderboardPage.tsx` | Period selector, Around You, Streak/Attendance tabs |
| `src/hooks/useRealtimeSync.ts` | Add squads + squad_memberships |
| `src/i18n/locales/en.ts` | ~40 new keys (leaderboard + trainer) |
| `src/i18n/locales/th.ts` | ~40 new keys (leaderboard + trainer) |
| `src/apps/trainer/layouts/TrainerLayout.tsx` | i18n nav labels |
| `src/apps/trainer/pages/TrainerHomePage.tsx` | i18n all strings |
| `src/apps/trainer/features/impact/CoachImpactCard.tsx` | i18n labels |
| `src/apps/trainer/features/impact/PartnerReputationCard.tsx` | i18n labels |
| `src/apps/trainer/components/TrainerHeader.tsx` | i18n if needed |

### Database Migration

1 migration: enable realtime for `squads` and `squad_memberships`.

### What This Does NOT Include (Future Phases)

- Squad social features (activity feed, reactions) — Phase 5B
- Seasonal campaign hub — Phase 5C
- Heavy animations — Phase 5C
- Dedicated trainer gamification pages (badges, rewards) — Phase 5B
- Friend/follow leaderboard — Phase 5D

