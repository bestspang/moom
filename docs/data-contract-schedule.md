# Data Contract: Schedule Module

## Tables

### `schedule`
| UI Field | DB Column | Type | Notes |
|----------|-----------|------|-------|
| Date | `scheduled_date` | date | |
| Start time | `start_time` | time | |
| End time | `end_time` | time | |
| Class | `class_id` → `classes.name` | uuid FK | |
| Trainer | `trainer_id` → `staff` | uuid FK nullable | |
| Room | `room_id` → `rooms` | uuid FK nullable | |
| Location | `location_id` → `locations` | uuid FK nullable | |
| Capacity | `capacity` | int | Default from `rooms.max_capacity` |
| Status | `status` | enum: scheduled, cancelled, completed | |
| Availability | Computed: count of `class_bookings` with status in (booked, attended) | | Not stored; aggregated at query time |

### `class_bookings`
| UI Field | DB Column | Type | Notes |
|----------|-----------|------|-------|
| Member | `member_id` → `members` | uuid FK | |
| Package used | `member_package_id` → `member_packages` | uuid FK nullable | |
| Status | `status` | enum: booked, cancelled, attended, no_show | |
| Booked at | `booked_at` | timestamptz | |
| Cancelled at | `cancelled_at` | timestamptz nullable | |
| Attended at | `attended_at` | timestamptz nullable | |
| Cancelled by | `cancelled_by` | uuid nullable | |
| Reason | `cancellation_reason` | text nullable | |

Constraint: `unique(schedule_id, member_id)`

### `class_waitlist`
| UI Field | DB Column | Type | Notes |
|----------|-----------|------|-------|
| Member | `member_id` → `members` | uuid FK | |
| Position | `position` | int | |
| Status | `status` | enum: waiting, promoted, expired, cancelled | |

Constraint: `unique(schedule_id, member_id)`

## Cross-Module Writes

### When booking is marked `attended`:
1. Update `class_bookings.status = 'attended'`, set `attended_at`
2. Insert `member_attendance` row: `member_id`, `schedule_id`, `location_id`, `checkin_method='manual'`, `check_in_type='class'`
3. If `member_package_id` exists and package has session limit: insert `package_usage_ledger` entry with `delta_sessions=-1`, `usage_type='booking'`, `reference_type='schedule'`
4. Update `member_packages.sessions_remaining` and `sessions_used`

### When schedule is cancelled:
1. Update `schedule.status = 'cancelled'`
2. Batch-update all `class_bookings` with `status='booked'` → `status='cancelled'`

## Activity Log Events

| Event Type | Trigger |
|------------|---------|
| `schedule_created` | New schedule row inserted |
| `schedule_updated` | Schedule row updated |
| `schedule_cancelled` | Schedule status → cancelled |
| `schedule_deleted` | Schedule row deleted |
| `booking_created` | New class_bookings row |
| `booking_cancelled` | Booking status → cancelled |
| `attendance_marked` | Booking status → attended or no_show |

## Query Keys (React Query)

| Key Pattern | Invalidated By |
|-------------|----------------|
| `['schedule', dateStr]` | schedule CRUD, attendance marking |
| `['schedule-stats', dateStr]` | schedule CRUD, cancellation |
| `['class-bookings', scheduleId]` | booking CRUD, attendance |
| `['class-waitlist', scheduleId]` | waitlist CRUD, promotion |
| `['member-attendance']` | attendance marking |
| `['member-packages']` | attendance marking (session deduction) |
| `['package-usage']` | attendance marking |
| `['dashboard-stats']` | schedule CRUD, attendance |

## Realtime Tables

`schedule`, `class_bookings`, `class_waitlist`, `member_attendance`, `package_usage_ledger`
