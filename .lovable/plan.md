

# Phase 12: Trainer Roster Page

## Status
- Phase 8: Squad Activity Feed ✅
- Phase 9: Squad Reactions ✅
- Phase 10: Trainer Badges Page ✅
- Phase 11: Leaderboard Time Windows ✅

## Problem

The Trainer Roster page (`/trainer/roster`) is currently a "Coming Soon" placeholder. Trainers need to see their assigned members — who they train, when they last attended, and basic contact info. This is a core trainer workflow feature.

## Data Source

The `schedule` table links trainers to classes, and `class_bookings` links members to scheduled classes. By joining these, we can derive which members a trainer regularly sees. Additionally, `member_attendance` provides last-attended dates.

We can build this without a dedicated "assigned members" table by querying members who have booked classes taught by this trainer (within a recent window, e.g. last 90 days).

## Plan

### 1. Database: Create `get_trainer_roster` RPC

```text
get_trainer_roster(p_staff_id uuid, p_days int DEFAULT 90)
→ Returns: member_id, first_name, last_name, avatar_url, 
           total_sessions, last_attended, phone, email
```

Logic:
- Finds all `schedule` entries where `trainer_id = p_staff_id` within the last `p_days` days
- Joins `class_bookings` to find members who booked those classes
- Aggregates: total sessions count, most recent check-in date
- Joins `members` for name/avatar/contact info
- `SECURITY DEFINER` so trainers can access member contact details they wouldn't normally see
- Validates the caller is the trainer (via `identity_map`)

### 2. Frontend: Update `TrainerRosterPage.tsx`

Replace the "Coming Soon" placeholder with:
- Summary stat: total unique members trained
- Searchable member list with:
  - Avatar/initials + name
  - Total sessions together
  - Last attended date
  - Phone (tap to call)
- Sort by: most recent, most sessions, alphabetical
- Empty state when no data

### 3. i18n

~8 keys: `trainer.rosterSubtitle`, `trainer.totalMembers`, `trainer.sessionsCount`, `trainer.lastSeen`, `trainer.noRosterData`, `trainer.rosterDesc`, `trainer.sortRecent`, `trainer.sortSessions`

### Files

| File | Action |
|------|--------|
| Migration SQL | Create `get_trainer_roster` RPC |
| `src/apps/trainer/pages/TrainerRosterPage.tsx` | Replace placeholder with roster UI |
| `src/apps/trainer/features/impact/api.ts` | Add `fetchTrainerRoster` |
| `src/i18n/locales/en.ts` | ~8 new keys |
| `src/i18n/locales/th.ts` | ~8 new keys |

No new tables. Uses existing schedule + booking + member data.

