# Data Contract: Lobby Module

## UI Fields → DB Mapping

| UI Field | DB Table | DB Column | Notes |
|----------|----------|-----------|-------|
| Time | member_attendance | check_in_time | timestamptz, formatted HH:mm |
| Name | members | first_name, last_name | via member FK |
| Package used | packages | name_en | via member_package → package FK |
| Usage | member_packages | sessions_used, sessions_remaining | calculated `used/total` or 'Unlimited' |
| Location | locations | name | via location FK |
| Check-in method | member_attendance | checkin_method | 'manual' / 'qr' / 'liff' |

## member_attendance Table

| Column | Type | Required | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | yes | gen_random_uuid() | PK |
| member_id | uuid | yes | — | FK members |
| location_id | uuid | no | null | FK locations |
| member_package_id | uuid | no | null | FK member_packages |
| check_in_time | timestamptz | no | null | When checked in |
| check_in_type | text | no | null | Usage type: gym/class/pt |
| checkin_method | text | yes | 'manual' | manual/qr/liff |
| schedule_id | uuid | no | null | FK schedule (class check-ins) |
| created_by | uuid | no | null | FK staff (who performed check-in) |
| created_at | timestamptz | no | now() | |

### Indexes
- `idx_member_attendance_checkin_time_desc` (check_in_time DESC)
- `idx_member_attendance_member_checkin_time` (member_id, check_in_time DESC)

## Validation Rules

- **Location required** for manual check-in
- **Member required** for all check-ins
- **Duplicate check**: warn if same member + location + date (gym type)
- **Package optional**: walk-in allowed (member_package_id = null)

## Activity Log Events

| Event Type | Entity Type | Trigger |
|-----------|-------------|---------|
| member_check_in | member_attendance | Manual check-in created |
| member_check_in_qr | member_attendance | QR code redeemed |

## Search Fields
Member search covers: first_name, last_name, nickname, member_id, phone, email

## Realtime
- Table: `member_attendance` (already in supabase_realtime publication)
- Query keys invalidated: `check-ins`, `dashboard-stats`, `member-attendance`, `member-summary-stats`, `gym-checkins`

## QR Token System

Table: `checkin_qr_tokens`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| token | text | unique, secure random |
| location_id | uuid | FK locations, required |
| member_id | uuid | FK members, nullable (location-only QR) |
| token_type | text | default 'checkin' |
| expires_at | timestamptz | default now()+2min |
| used_at | timestamptz | null until redeemed |
| used_by_staff_id | uuid | FK staff, nullable |
| created_at | timestamptz | |

Token lifetime: 2 minutes (auto-refresh on frontend)
