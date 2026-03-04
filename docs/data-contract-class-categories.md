# Data Contract: Class Categories

## Table: `class_categories`

| Column       | Type      | Nullable | Default           | Notes                    |
|-------------|-----------|----------|-------------------|--------------------------|
| id          | uuid      | No       | gen_random_uuid() | PK                       |
| name        | text      | No       | —                 | EN name                  |
| name_th     | text      | Yes      | —                 | TH name                  |
| description | text      | Yes      | —                 | Optional description     |
| class_count | integer   | Yes      | 0                 | Legacy static; use computed count |
| created_at  | timestamptz | Yes    | now()             |                          |
| updated_at  | timestamptz | Yes    | now()             |                          |

## Computed Fields (query-time)

- `computed_class_count`: `COUNT(*)` from `classes` where `category_id = class_categories.id`

## Relationships

- `classes.category_id` → `class_categories.id` (FK, nullable)
- Rooms: `rooms.categories text[]` stores category **names** (not IDs) — legacy pattern
- Packages: `packages.categories text[]` stores category **names** (not IDs) — legacy pattern

## RLS

- SELECT: all authenticated users
- ALL: `level_3_manager` and above

## Activity Log Events

| event_type               | Trigger           |
|--------------------------|-------------------|
| class_category_created   | Insert            |
| class_category_updated   | Update            |
| class_category_deleted   | Delete            |

## Realtime Invalidation

Changes to `class_categories` invalidate query keys:
- `class-categories`
- `class-stats`
- `classes`

## UI Pages

- `/class-category` — List with search, computed count, row click → details
- `/class-category/:id` — Details with inline edit (name/name_th), classes table
