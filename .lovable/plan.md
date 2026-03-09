

# Remaining Gamification Wiring

## Status Check
Most items in this request are **already implemented** in previous messages. Here's what remains:

### 1. Wire `class_booked` gamification event (small fix)
**File:** `src/hooks/useClassBookings.ts` — `useCreateBooking.onSuccess`
- Add `fireGamificationEvent({ event_type: 'class_booked', member_id, idempotency_key: 'class_booked:{bookingId}', metadata: { schedule_id } })` after the existing activity log call
- Fire-and-forget, non-blocking, same pattern as `class_attended`

### 2. Create Member Leaderboard Page (new feature)
**New file:** `src/apps/member/pages/MemberLeaderboardPage.tsx`

Three sections:
- **Top XP Earners** — query `member_gamification_profiles` ordered by `total_xp` DESC, limit 20, join `members(first_name, last_name, avatar_url)`. Highlight current user's rank.
- **Squad Rankings** — query `squads` ordered by `total_xp` DESC, limit 10, with member count from `squad_memberships(count)`. Highlight user's squad.
- **Challenge Completion** — query `challenge_progress` where `status = 'completed'`, grouped by `challenge_id`, with challenge name from `gamification_challenges`. Show completion count per challenge + whether current user completed it.

**New API functions** in `src/apps/member/features/momentum/api.ts`:
- `fetchXpLeaderboard()` — top 20 profiles with member names
- `fetchSquadRankings()` — top 10 squads by XP
- `fetchChallengeCompletionStats()` — challenge completion counts

**Route:** Add `<Route path="leaderboard" element={<MemberLeaderboardPage />} />` under `/member` in `App.tsx`

**UI Design:**
- Mobile-first card layout using existing `Section`, `MobilePageHeader` components
- Tab switcher (XP / Squads / Challenges) using Radix Tabs
- Numbered list with avatar, name, XP/score, tier badge
- Current user highlighted with primary border
- Trophy icon for top 3

### Files to modify
1. `src/hooks/useClassBookings.ts` — add `class_booked` event in `useCreateBooking.onSuccess` (~5 lines)
2. `src/apps/member/features/momentum/api.ts` — add 3 leaderboard fetch functions
3. `src/App.tsx` — add leaderboard route
4. **New:** `src/apps/member/pages/MemberLeaderboardPage.tsx`

### RLS Note
`member_gamification_profiles` has `level_1_minimum` read access for staff — but members need read access too. The table currently lacks a member-facing SELECT policy. Will need to check and potentially add one via migration.

