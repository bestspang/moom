

# Dashboard Search — Implementation Plan

## Summary

Add a SearchBar to the Dashboard that filters the Classes tab (client-side) and the Gym check-in tab (DB-backed query replacing the current EmptyState).

## Changes

### 1. New hook: `src/hooks/useDashboardAttendance.ts`

Create `useGymCheckinsByDate(date, search)`:
- Query `member_attendance` joined with `members`, `member_packages.package`, `locations`
- Filter by date range and `schedule_id IS NULL` (gym-only check-ins)
- Client-side filter by member name/phone when search provided (same pattern as `useLobby.ts`)
- Limit 200 rows
- Query key: `['gym-checkins', dateStr, search]`

### 2. Update `src/hooks/useRealtimeSync.ts`

Add `gym-checkins` to the `member_attendance` invalidation list so gym tab updates in realtime.

### 3. Update `src/lib/queryKeys.ts`

Add `gymCheckins: (dateStr: string, search?: string) => ['gym-checkins', dateStr, search] as const`

### 4. Update `src/pages/Dashboard.tsx`

- Add `searchQuery` state + debounce (300ms via `setTimeout`)
- Import `SearchBar` from common components
- Render SearchBar between tabs header and table content, with tab-aware placeholder
- Reset search on tab change
- Classes tab: client-side filter `scheduleData` by className/trainer/location/room matching search
- Gym tab: replace `EmptyState` with `DataTable` using `useGymCheckinsByDate`, add "Go to Lobby" button
- Define gym columns: time, name, package, location, check-in method

### 5. Add i18n keys

- `dashboard.searchClasses`: "Search class, trainer, or room" / Thai equivalent
- `dashboard.searchGym`: "Search name or contact number" / Thai equivalent
- `dashboard.goToLobby`: "Go to Lobby" / Thai equivalent

## Files

| Action | File |
|--------|------|
| Create | `src/hooks/useDashboardAttendance.ts` |
| Modify | `src/pages/Dashboard.tsx` |
| Modify | `src/hooks/useRealtimeSync.ts` |
| Modify | `src/lib/queryKeys.ts` |
| Modify | `src/i18n/locales/en.ts` |
| Modify | `src/i18n/locales/th.ts` |

No DB migrations needed.

