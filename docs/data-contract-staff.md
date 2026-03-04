# Data Contract: Staff

## Table: `staff`

| UI Field | DB Column | Type | Required | Notes |
|----------|-----------|------|----------|-------|
| First name | `first_name` | text | ✅ | |
| Last name | `last_name` | text | ✅ | |
| Nickname | `nickname` | text | | |
| Gender | `gender` | text | | |
| Date of birth | `date_of_birth` | date | | |
| Phone | `phone` | text | | |
| Email | `email` | text | | |
| Address line 1 | `address_1` | text | | |
| Address line 2 | `address_2` | text | | |
| Subdistrict | `subdistrict` | text | | |
| District | `district` | text | | |
| Province | `province` | text | | |
| Postal code | `postal_code` | text | | |
| Emergency first name | `emergency_first_name` | text | | |
| Emergency last name | `emergency_last_name` | text | | |
| Emergency phone | `emergency_phone` | text | | |
| Emergency relationship | `emergency_relationship` | text | | |
| Status | `status` | enum | ✅ | pending / active / terminated |
| Avatar | `avatar_url` | text | | |
| Auth user | `user_id` | uuid | | FK to auth.users |
| Legacy role | `role_id` | uuid | | FK to roles (backward compat) |
| Staff code | `staff_code` | text | | Unique, e.g. A-010 |

## Table: `staff_positions`

| UI Field | DB Column | Type | Required | Notes |
|----------|-----------|------|----------|-------|
| Staff | `staff_id` | uuid | ✅ | FK staff, cascade delete |
| Role | `role_id` | uuid | ✅ | FK roles |
| All locations | `scope_all_locations` | boolean | | default true |
| Specific locations | `location_ids` | uuid[] | | empty if scope_all |

## Activity Log Events

| Event | Trigger |
|-------|---------|
| `staff_created` | New staff record created |
| `staff_updated` | Staff profile field edited |
| `staff_deleted` | Staff record deleted |
| `staff_position_added` | Position added to staff |
| `staff_position_removed` | Position removed from staff |

## Query Keys

| Key | Usage |
|-----|-------|
| `['staff', status, search]` | Staff list |
| `['staff', id]` | Staff detail |
| `['staff-stats']` | Tab counts (head-only) |
| `['staff-positions', staffId]` | Positions for a staff member |

## Realtime Invalidation

Tables in `TABLE_INVALIDATION_MAP`: `staff`, `staff_positions`

## RLS

| Table | SELECT | INSERT/UPDATE/DELETE |
|-------|--------|---------------------|
| staff | level_1_minimum | level_3_manager |
| staff_positions | level_1_minimum | level_3_manager |
