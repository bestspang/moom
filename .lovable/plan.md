

# Schedule Module Recheck — Remaining Gaps

## Already Implemented (No Changes Needed)

Most of the requirements are already fulfilled:

- **DB tables**: `schedule`, `class_bookings`, `class_waitlist`, `member_attendance`, `package_usage_ledger` all exist with correct columns
- **Schedule list**: `useScheduleByDate` fetches booking counts via parallel query, merges `booked_count`/`attended_count`
- **Search**: Client-side search by class/trainer/room name in `Schedule.tsx`
- **Schedule create**: `ScheduleClassDialog` calls `create_schedule_with_validation` RPC (overlap prevention, room-location validation)
- **Booking management**: `BookingManagementDialog` supports add member, cancel booking, mark attended/no_show, waitlist promote
- **Cross-module writes**: `useMarkAttendance` creates `member_attendance` + `package_usage_ledger` + updates `sessions_remaining`
- **Schedule cancellation**: `useCancelSchedule` marks schedule cancelled + batch-cancels bookings
- **Activity logging**: All mutations log to `activity_log`
- **Realtime sync**: `useRealtimeSync` covers `schedule`, `class_bookings`, `class_waitlist`, `member_attendance`, `package_usage_ledger`
- **Data contract**: `docs/data-contract-schedule.md` exists

## Real Gaps Found

### Gap 1: `useScheduleStats` avgCapacity uses stale `checked_in` field
Lines 146-161 in `useSchedule.ts` compute `avgCapacity` using `s.checked_in` which is never updated. Should use booking count aggregation like `useScheduleByDate` does.

**Fix**: Fetch booking counts for the date's schedules (same pattern as `useScheduleByDate`) and compute avgCapacity from `attended_count / capacity`.

### Gap 2: `useBatchMarkAttendance` skips cross-module writes
Unlike `useMarkAttendance` (which creates `member_attendance` + ledger), `useBatchMarkAttendance` only updates `class_bookings.status`. If batch-marking multiple members as attended, no attendance records or session deductions are created.

**Fix**: Loop through each booking in the batch and perform the same cross-module writes (member_attendance insert, ledger insert, sessions_remaining update).

### Gap 3: `mapScheduleToItem` availability fallback
Line 38 in `useSchedule.ts`: `availability: \`${s.checked_in || 0}/${s.capacity || 0}\`` — while `Schedule.tsx` already uses `booked_count`, the `mapScheduleToItem` helper still falls back to `checked_in`. Any code using this helper gets stale data.

**Fix**: Update to use `s.booked_count ?? 0`.

## Implementation Plan

### 1. Fix `useScheduleStats` avgCapacity (useSchedule.ts)
- After fetching today's schedules, also fetch booking counts (same pattern as `useScheduleByDate`)
- Compute avgCapacity as: `attended_count / capacity * 100` averaged across scheduled classes
- ~15 lines changed in `useScheduleStats`

### 2. Fix `useBatchMarkAttendance` cross-module writes (useClassBookings.ts)
- After batch-updating booking statuses, for each `attended` booking:
  - Fetch schedule's `location_id`
  - Insert `member_attendance` row
  - If `member_package_id` exists, check package sessions and insert ledger entry + update `sessions_remaining`
- Add missing query invalidations: `member-attendance`, `package-usage`, `member-packages`, `dashboard-stats`

### 3. Fix `mapScheduleToItem` (useSchedule.ts)
- Change line 38 from `s.checked_in || 0` to `s.booked_count ?? 0`

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useSchedule.ts` | Fix `useScheduleStats` to use booking counts; fix `mapScheduleToItem` |
| `src/hooks/useClassBookings.ts` | Add cross-module writes to `useBatchMarkAttendance` |

No DB migration. No new dependencies. No breaking changes.

