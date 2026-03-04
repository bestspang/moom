

# Schedule Module Data Completion Plan

## Current State Analysis

The Schedule module already has solid infrastructure:
- **Schedule CRUD** with server-side validation RPC (`create_schedule_with_validation`)
- **BookingManagementDialog** with add member, cancel booking, mark attendance, waitlist management
- **useClassBookings** with full booking/waitlist hooks + activity logging
- **Realtime sync** covers `schedule`, `class_bookings`, `class_waitlist`, `member_attendance`

## Key Gaps (verified from code)

### Gap 1: Mark Attended doesn't create cross-module records
`useMarkAttendance` (line 202-244 in useClassBookings.ts) only updates `class_bookings.status`. It does NOT:
- Create a `member_attendance` row (so Dashboard/Lobby/MemberDetails don't see it)
- Create a `package_usage_ledger` entry (so session balance isn't deducted)

### Gap 2: Schedule list shows stale `checked_in` field
`Schedule.tsx` availability column shows `schedule.checked_in` (a static integer) rather than actual booking counts. This value is never updated by booking mutations.

### Gap 3: No search on schedule list
No way to filter by class name, trainer name, or room name.

### Gap 4: No schedule-level cancellation
No UI/logic to cancel an entire schedule (mark status='cancelled' and cancel all bookings).

### Gap 5: No data contract doc

## Implementation Plan

### 1. No DB migration needed
All required tables/columns already exist: `schedule`, `class_bookings`, `class_waitlist`, `member_attendance` (with `checkin_method`, `created_by`, `schedule_id`), `package_usage_ledger`.

### 2. Update `useMarkAttendance` to create attendance + ledger
When marking a booking as `attended`:
- Insert `member_attendance` row with `usage_type='class'`, `checkin_method='manual'`, `schedule_id`, `member_package_id` from the booking
- If `member_package_id` exists and package has sessions, insert `package_usage_ledger` entry with `delta_sessions=-1`, `usage_type='booking'`, `reference_type='schedule'`
- Invalidate additional query keys: `member-attendance`, `package-usage`, `dashboard-stats`, `check-ins`

### 3. Compute availability from bookings instead of `checked_in`
Update `useScheduleByDate` to also fetch booking counts per schedule. Two approaches:
- **Chosen**: Add a lightweight parallel query that fetches `class_bookings` counts grouped by `schedule_id` for the date's schedules, then merge into the schedule data
- This avoids N+1 and doesn't require a new RPC

Update `ScheduleWithRelations` type to include `booked_count` and `attended_count`.

### 4. Add search to Schedule page
Add a `SearchBar` component to the Schedule page that filters `filteredSchedule` client-side by class name, trainer name, or room name (data is already loaded).

### 5. Add schedule cancellation
Add a "Cancel Class" button in `BookingManagementDialog` that:
- Updates `schedule.status = 'cancelled'`
- Batch-cancels all `booked` bookings for that schedule
- Logs `schedule_cancelled` activity
- Closes dialog

### 6. Create data contract doc

### 7. Add i18n keys for new UI elements

## Files to modify

| File | Change |
|------|--------|
| `src/hooks/useClassBookings.ts` | Expand `useMarkAttendance` to create `member_attendance` + `package_usage_ledger` |
| `src/hooks/useSchedule.ts` | Add booking count aggregation to `useScheduleByDate`; add `useCancelSchedule` mutation |
| `src/pages/Schedule.tsx` | Add search bar; update availability column to use booking counts |
| `src/components/schedule/BookingManagementDialog.tsx` | Add cancel schedule button |
| `src/i18n/locales/en.ts` | Add keys: `schedule.cancelClass`, `schedule.cancelClassConfirm`, `schedule.search` |
| `src/i18n/locales/th.ts` | Same Thai keys |
| `docs/data-contract-schedule.md` | Create data contract |

No database migration. No new dependencies. No breaking changes to existing flows.

