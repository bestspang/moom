

# Class Categories — Gap Analysis & Implementation Plan

## Current State

### What exists:
- `class_categories` table with columns: `id`, `name`, `class_count` (static int), `description`, `created_at`, `updated_at`
- Basic CRUD hooks in `useClassCategories.ts`
- Simple list page at `/class-category` with search + table
- `classes.category_id` FK to `class_categories` (correct)
- Route registered in App.tsx

### Gaps Found:

**GAP 1: No bilingual support** — Table has single `name` column, no `name_th`. Spec requires `name_en` + `name_th`.

**GAP 2: Class count is a static column** — `class_count` is a manually stored integer (always 0). Should be computed from actual `classes` rows via JOIN/subquery.

**GAP 3: No category details page** — No route `/class-category/:id`, no page component. Spec requires inline edit + "classes in this category" table.

**GAP 4: Create button is not wired** — The create button on the list page has no onClick handler or dialog.

**GAP 5: No row click navigation** — List page doesn't navigate to detail on row click.

**GAP 6: Rooms use free-text `categories text[]`** — Stores category names as strings, not UUIDs. The schedule validation RPC also compares by name string. This is fragile but changing to a join table is a large migration that affects rooms CRUD, schedule validation RPC, and room details page. **Recommend deferring join table migration** — current name-based approach works and is consistent across the system. Changing it risks breaking rooms/schedule.

**GAP 7: Packages use free-text `categories text[]`** — Same as rooms. Consistent with current pattern. **Recommend deferring** for same reasons.

**GAP 8: Realtime invalidation** — `class_categories` entry in `TABLE_INVALIDATION_MAP` only invalidates `['class-stats', 'classes']`, not `['class-categories']`.

---

## Implementation Plan

### Step 1: DB Migration
- Add `name_th text` column to `class_categories`
- No need to rename `name` to `name_en` (would break all existing references). Keep `name` as the EN name, add `name_th` alongside.

### Step 2: Fix class count — use computed query
- Update `useClassCategories` hook to join with `classes` table and compute count:
  ```
  select *, classes(count) from class_categories
  ```
  Or use a left join with count. Remove reliance on static `class_count` column.

### Step 3: Create category dialog
- Add `CreateClassCategoryDialog` component with `name` (required) and `name_th` (optional) fields.
- Wire it to the create button on ClassCategories page.

### Step 4: Category details page
- Create `ClassCategoryDetails.tsx` at `/class-category/:id`
- Show category info with inline edit for name/name_th
- Show "Classes in this category" table querying `classes` where `category_id = id`
- Register route in App.tsx

### Step 5: Wire list page
- Add row click → navigate to `/class-category/:id`
- Display `name_th` in the table if language is Thai

### Step 6: Fix realtime invalidation
- Add `'class-categories'` to the `class_categories` entry in `TABLE_INVALIDATION_MAP`

### Step 7: Update hooks for bilingual search
- Update `useClassCategories` search to also match `name_th`

### Step 8: Update data contract + i18n keys

### Files to Touch

| File | Change |
|------|--------|
| DB migration | Add `name_th` column |
| `src/hooks/useClassCategories.ts` | Compute class count via join; bilingual search |
| `src/pages/ClassCategories.tsx` | Wire create dialog, row click, bilingual display |
| `src/pages/ClassCategoryDetails.tsx` (new) | Details page with inline edit + classes table |
| `src/components/categories/CreateClassCategoryDialog.tsx` (new) | Create dialog |
| `src/App.tsx` | Add route `/class-category/:id` |
| `src/hooks/useRealtimeSync.ts` | Fix invalidation keys |
| `src/i18n/locales/en.ts` + `th.ts` | Add category detail i18n keys |
| `docs/data-contract-class-categories.md` (new) | Data contract |

### Out of Scope (deferred)
- Migrating rooms/packages from `categories text[]` to join tables with UUIDs. Current name-based approach is consistent across the entire system and changing it would require updating: rooms CRUD, room details, create room dialog, schedule validation RPC, packages CRUD, create package page, package details. Risk is too high for this task.

