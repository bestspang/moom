# Data Contract: Your Gym Section

> Source of truth for tables, required fields, and storage mapping.

---

## A) Staff

### Table: `staff`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | No | gen_random_uuid() | PK |
| user_id | uuid | Yes | | FK to auth.users (set on invite accept) |
| role_id | uuid | Yes | | Legacy; use staff_positions instead |
| first_name | text | No | | |
| last_name | text | No | | |
| nickname | text | Yes | | |
| date_of_birth | date | Yes | | |
| gender | text | Yes | | male/female/other |
| phone | text | Yes | | |
| email | text | Yes | | |
| status | staff_status | Yes | 'pending' | pending/active/terminated |
| address | text | Yes | | Legacy single-line; kept for compat |
| address_1 | text | Yes | | Structured address line 1 |
| address_2 | text | Yes | | Structured address line 2 |
| subdistrict | text | Yes | | |
| district | text | Yes | | |
| province | text | Yes | | |
| postal_code | text | Yes | | |
| avatar_url | text | Yes | | |
| location_id | uuid | Yes | | Legacy; use staff_positions instead |
| created_at | timestamptz | Yes | now() | |
| updated_at | timestamptz | Yes | now() | |

LINE identity is stored in the **`line_users`** table (normalized), linked via `line_users.staff_id`.

### Table: `staff_positions`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | No | gen_random_uuid() |
| staff_id | uuid | No | FK staff.id |
| role_id | uuid | No | FK roles.id |
| scope_all_locations | bool | Yes | true |
| location_ids | uuid[] | Yes | '{}' |
| created_at | timestamptz | Yes | now() |

---

## B) Locations

### Table: `locations`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | No | gen_random_uuid() |
| location_id | text | No | | Human ID e.g. BR-0001 |
| name | text | No | |
| contact_number | text | Yes | |
| status | location_status | Yes | 'open' | open/closed |
| categories | text[] | Yes | '{}' |
| opening_hours | jsonb | Yes | '{}' |
| created_at | timestamptz | Yes | now() |
| updated_at | timestamptz | Yes | now() |

---

## C) Roles

### Table: `roles`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | No | gen_random_uuid() |
| name | text | No | |
| access_level | access_level | No | |
| permissions | jsonb | Yes | '[]' |
| description | text | Yes | |
| ai_policy | jsonb | Yes | '{}' |

### Table: `role_permissions`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | No | gen_random_uuid() |
| role_id | uuid | No | FK roles.id |
| resource | text | No | |
| can_read | bool | Yes | false |
| can_write | bool | Yes | false |
| can_delete | bool | Yes | false |

---

## D) Workout System

### Table: `training_templates`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | No | gen_random_uuid() |
| name | text | No | |
| is_active | bool | No | true |
| ai_tags | jsonb | Yes | '[]' |
| created_by | uuid | Yes | |
| created_at | timestamptz | No | now() |
| updated_at | timestamptz | No | now() |

### Table: `workout_items`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | No | gen_random_uuid() |
| training_id | uuid | No | FK training_templates.id |
| name | text | No | |
| track_metric | text | Yes | |
| unit | text | Yes | |
| goal_type | text | Yes | |
| description | text | Yes | |
| sort_order | int | Yes | 0 |
| ai_cues | jsonb | Yes | '{}' |
| created_at | timestamptz | Yes | now() |

---

## E) Activity Log

### Table: `activity_log`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | No | gen_random_uuid() |
| event_type | text | No | |
| activity | text | No | |
| entity_type | text | Yes | |
| entity_id | text | Yes | |
| old_value | jsonb | Yes | |
| new_value | jsonb | Yes | |
| staff_id | uuid | Yes | FK staff.id |
| member_id | uuid | Yes | FK members.id |
| created_at | timestamptz | Yes | now() |

### Required event coverage

Every create/update/delete in Staff, Positions, Locations, Workouts must write an `activity_log` record.

| Mutation | event_type | entity_type |
|----------|-----------|-------------|
| Create staff | staff_created | staff |
| Update staff | staff_updated | staff |
| Delete staff | staff_deleted | staff |
| Create training | training_created | training |
| Update training | training_updated | training |
| Create location | location_created | location |
| Update location | location_updated | location |
| Create/update role | role_updated | role |
