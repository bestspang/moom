

# Phase 5B: Squad Social Enhancements + Trainer Pages i18n

## Current State

Phase 5A delivered enhanced leaderboards (Streaks, Attendance, Around You), squad realtime sync, and trainer impact card i18n. The next logical step:

1. **Remaining trainer pages have hardcoded English**: `TrainerSchedulePage`, `TrainerRosterPage`, `TrainerWorkoutsPage`, `TrainerProfilePage` — all have ~15 hardcoded strings each
2. **SquadCard has hardcoded English**: "Join a Squad", "Team up with friends", "total XP"
3. **Squad page lacks member count on available squads**: `fetchAvailableSquads` returns `members: []` but uses a count query — not surfaced in UI
4. **Squad contribution visibility**: No way to see which members contribute most XP to the squad

## Plan

### Step 1: Trainer Pages i18n (4 files)

Add ~25 trainer i18n keys to `en.ts` and `th.ts`:
- Schedule: "Schedule", "All upcoming classes", "All", "No classes found", "Check back later", "with", "spots"
- Roster: "Roster", "Your assigned members", "Coming soon", "Member roster management..."
- Workouts: "Workouts", "Training templates", "No workouts yet", "Workouts will appear here..."
- Profile: "Profile", "Settings", "Notifications", "Preferences", "Help & Support", "Switch App", "Admin Portal", "Member App", "Sign Out", "Trainer"

Update all 4 files to use `useTranslation()` + `t()`.

### Step 2: SquadCard i18n

Replace 3 hardcoded strings in `SquadCard.tsx` with existing/new `member.*` keys:
- "Join a Squad" → `t('member.joinSquadTitle')`
- "Team up with friends to train together" → `t('member.joinSquadHint')`  (already exists)
- "total XP" → `t('member.totalXp')` (already exists)

### Step 3: Squad Available Count

Update `fetchAvailableSquads` to surface `memberCount` from the count query. Update `MemberSquadPage` available list to show member count.

### Step 4: Squad Contribution Ranking

Add a simple contribution display in the squad detail view — show each member's XP contribution from `member_gamification_profiles.total_xp`, sorted descending. No new DB tables needed.

---

### Files Modified

| File | Changes |
|------|---------|
| `src/i18n/locales/en.ts` | ~25 new trainer keys + 1 squad key |
| `src/i18n/locales/th.ts` | ~25 new trainer keys + 1 squad key |
| `src/apps/trainer/pages/TrainerSchedulePage.tsx` | i18n all strings |
| `src/apps/trainer/pages/TrainerRosterPage.tsx` | i18n all strings |
| `src/apps/trainer/pages/TrainerWorkoutsPage.tsx` | i18n all strings |
| `src/apps/trainer/pages/TrainerProfilePage.tsx` | i18n all strings |
| `src/apps/member/features/momentum/SquadCard.tsx` | i18n 3 strings |
| `src/apps/member/features/momentum/api.ts` | Surface memberCount in fetchAvailableSquads, add fetchSquadContributions |
| `src/apps/member/pages/MemberSquadPage.tsx` | Show member count on available squads, show XP contribution per member |

No database changes. No new Edge Functions. All frontend-only.

