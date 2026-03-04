# Data Contract — Classes Module

## Table: `classes`

| UI Field | DB Column | Type | Required | Notes |
|----------|-----------|------|----------|-------|
| Class name (EN) | `name` | text | Yes | Primary display name |
| Class name (TH) | `name_th` | text | No | Thai name |
| Description (EN) | `description` | text | No | Description text |
| Description (TH) | `description_th` | text | No | Thai description |
| Type | `type` | enum (`class`, `pt`) | Yes | Default: `class` |
| Category | `category_id` | uuid FK → `class_categories.id` | For class type | Nullable for PT |
| Level | `level` | enum (`all_levels`, `beginner`, `intermediate`, `advanced`) | For class type | Nullable for PT |
| Duration (mins) | `duration` | integer | Yes | Default: 60 |
| Status | `status` | text (`active`, `drafts`, `archive`) | Yes | Default: `active` |
| Created | `created_at` | timestamptz | Auto | |
| Modified | `updated_at` | timestamptz | Auto | |

### Status Mapping
- `active` = Published (visible, schedulable)
- `drafts` = Draft (not visible to members)
- `archive` = Archived (hidden)

## Table: `class_categories`

| UI Field | DB Column | Type | Required |
|----------|-----------|------|----------|
| Name | `name` | text | Yes |
| Description | `description` | text | No |
| Class count | `class_count` | integer | No |

## Performance Metrics (Computed)

| Metric | Source | Computation |
|--------|--------|-------------|
| Scheduled this week | `schedule` | COUNT where `class_id` = X and `scheduled_date` in current week |
| Bookings this week | `class_bookings` → `schedule` | COUNT bookings for this week's schedules |
| Average capacity | `schedule` + `class_bookings` | AVG(bookings / capacity) across all schedules |
| Total bookings | `class_bookings` → `schedule` | COUNT all non-cancelled bookings |

## Activity Log Events

| Event Type | Trigger |
|------------|---------|
| `class_created` | New class created (draft or published) |
| `class_updated` | Any field edited (old_value + new_value logged) |
| `class_deleted` | Class deleted |

## Query Keys

| Key | Pattern |
|-----|---------|
| List | `['classes', status, search, typeFilter, categoryFilter, levelFilter]` |
| Detail | `['classes', 'detail', id]` |
| Stats | `['class-stats']` |
| Performance | `['class-performance', id]` |
