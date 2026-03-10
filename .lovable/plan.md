

# Phase 7: Leaderboard Time Windows (Weekly / Monthly / All-Time)

## Current State
The XP leaderboard tab only shows all-time rankings from `member_gamification_profiles.total_xp`. There's no way to see who earned the most XP this week or this month. The expansion plan calls for time-windowed leaderboards as a core motivational feature — it lets consistent recent performers shine, not just long-time members.

## What We Build

Add a **time-window selector** (All-Time / This Month / This Week) to the XP leaderboard tab. Weekly and monthly rankings are computed by summing `xp_ledger.delta` within the time window, aggregated by `member_id`.

### Backend: Database View (migration)

Create a reusable DB function `get_xp_leaderboard(p_since timestamptz, p_limit int)` that:
- Sums `xp_ledger.delta` grouped by `member_id` where `created_at >= p_since`
- Joins `members` for name/avatar
- Joins `member_gamification_profiles` for level
- Returns rows ordered by `sum_xp DESC`, limited to `p_limit`
- Uses `SECURITY DEFINER` so members can call it (xp_ledger has staff-only RLS)

### Frontend Changes

**`api.ts`** — Add `fetchXpLeaderboardByWindow(window: 'all' | 'month' | 'week')`:
- `'all'` → existing `fetchXpLeaderboard()` logic (from profiles table)
- `'month'` / `'week'` → calls the new RPC function with appropriate `p_since`

**`MemberLeaderboardPage.tsx`** — Inside `XpLeaderboardTab`:
- Add a `FilterChips` row with 3 chips: All-Time, This Month, This Week
- State: `timeWindow` defaults to `'all'`
- Query key includes `timeWindow`; queryFn dispatches to the right fetcher
- "Around You" section also adapts to the selected window

**i18n** — Add 3 keys: `member.allTime`, `member.thisMonth`, `member.thisWeek`

### Files

| File | Action |
|------|--------|
| Migration SQL | Create `get_xp_leaderboard` RPC function |
| `src/apps/member/features/momentum/api.ts` | Add `fetchXpLeaderboardByWindow` + `fetchAroundMeByWindow` |
| `src/apps/member/pages/MemberLeaderboardPage.tsx` | Add time-window chips to XP tab |
| `src/i18n/locales/en.ts` | 3 new keys |
| `src/i18n/locales/th.ts` | 3 new keys |

