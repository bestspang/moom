

# Phase 11: Streak & Attendance Leaderboard Time Windows

## Status
- Phase 8: Squad Activity Feed ✅
- Phase 9: Squad Reactions ✅
- Phase 10: Trainer Badges Page ✅

## Problem
The XP leaderboard tab already has time window filtering (All Time / Monthly / Weekly). The Streak and Attendance tabs do not — they show a single static view. This inconsistency is noticeable and limits the usefulness of those boards.

## Plan

### 1. Attendance Leaderboard Time Windows

Add `fetchAttendanceLeaderboardByWindow(window: LeaderboardTimeWindow)` in `api.ts`. Compute the `since` date the same way as XP (all time = epoch, month = 1st of month, week = start of week). Query `member_attendance` with `check_in_time >= since`.

Update `AttendanceTab` in `MemberLeaderboardPage.tsx` to add `FilterChips` and use the new function.

### 2. Streak Leaderboard — Time Window Consideration

Streaks are point-in-time values (`current_streak` on `member_gamification_profiles`), not time-windowed aggregates. A "weekly" streak board doesn't make conceptual sense — you either have a streak or you don't.

Instead of time windows, add an **"Around You" section** to the Streak tab (similar to XP), so users who aren't in the top 20 can see their nearby position. This requires a small RPC or client-side lookup.

For the around-me streak position, we can create a `get_streak_around_me(p_member_id uuid)` RPC that returns the caller's rank and neighbors.

### 3. Database

**New RPC: `get_streak_around_me(p_member_id uuid, p_range int DEFAULT 2)`**
- Ranks all members by `current_streak DESC` using a CTE with `ROW_NUMBER()`
- Finds the caller's rank
- Returns rows within ±`p_range` of that rank
- `SECURITY DEFINER` to access `member_gamification_profiles`

No new tables needed.

### 4. Files

| File | Action |
|------|--------|
| Migration SQL | Create `get_streak_around_me` RPC |
| `src/apps/member/features/momentum/api.ts` | Add `fetchAttendanceLeaderboardByWindow`, `fetchStreakAroundMe` |
| `src/apps/member/pages/MemberLeaderboardPage.tsx` | Add FilterChips to Attendance tab, add Around You to Streak tab |

No i18n changes needed — existing keys (`periodAllTime`, `periodMonthly`, `periodWeekly`, `aroundYou`) already cover this.

