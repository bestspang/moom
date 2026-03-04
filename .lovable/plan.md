

# Recheck: Class Categories (`class_categories_data_complete_01`)

## What's Working Correctly

- **DB schema**: `class_categories` has `id`, `name`, `name_th`, `description`, `class_count`, `created_at`, `updated_at`. `name_th` column exists and is in generated types.
- **Hooks**: `useClassCategories` computes class count via `select('*, classes(count)')` — correct dynamic count. Bilingual search on `name`/`name_th`. CRUD hooks with activity logging all present.
- **List page**: Search, bilingual display, row click → `/class-category/:id`, create button wired to dialog.
- **Details page**: Inline edit for `name`/`name_th`, classes table via `useCategoryClasses` querying `classes.category_id`.
- **Create dialog**: Fields for `name` + `name_th`, persists via mutation with activity log.
- **Realtime**: `class_categories` entry in `TABLE_INVALIDATION_MAP` invalidates `['class-categories', 'class-stats', 'classes']`.
- **Data contract**: `docs/data-contract-class-categories.md` exists.

## Gaps Found

### GAP 1: Unnecessary `as any` casts — `name_th` is in types
**Severity**: Low (code quality only)
**Where**: `ClassCategoryDetails.tsx` lines 31, 42, 75-76, 128 use `(category as any).name_th`. `CreateClassCategoryDialog.tsx` line 31 uses `as any` on insert payload. `useClassCategories.ts` line 33 uses `as any[]` on data mapping. Since `name_th` is in the generated types, these casts are unnecessary.
**Fix**: Remove all `as any` casts.

### GAP 2: `ClassCategoryWithCount` type redundantly declares `name_th`
**Severity**: Low
**Where**: `useClassCategories.ts` line 12 declares `name_th: string | null` but `ClassCategory` (from `Tables<'class_categories'>`) already has it.
**Fix**: Remove the redundant `name_th` from the intersection type.

### GAP 3: Rooms/Packages use `categories text[]` (name strings, not IDs)
**Severity**: Known — deferred in previous plan
**Status**: Consistent across the system. `rooms.categories` stores category names as `text[]`. `packages.categories` stores category names as `text[]`. The schedule validation RPC (`create_schedule_with_validation`) compares by name string. Changing to UUID join tables would require updating rooms CRUD, room details, create room dialog, schedule validation RPC, packages CRUD, create package page. **This was explicitly deferred previously and remains deferred** — the current approach is internally consistent.

### GAP 4: `useUpdateClassCategory` missing `old_value` in activity log
**Severity**: Low
**Where**: `useClassCategories.ts` line 123-129 — logs `new_value` but not `old_value`. The spec says "Write activity_log event_type='class_category_updated' with old/new".
**Fix**: Accept `oldData` parameter in the mutation variables and pass it as `old_value`.

## Implementation Plan

Only 2 small fixes needed (GAPs 1, 2, 4):

### Step 1: Remove `as any` casts in ClassCategoryDetails.tsx
- Replace `(category as any).name_th` → `category.name_th` (4 occurrences)

### Step 2: Remove `as any` casts in CreateClassCategoryDialog.tsx
- Remove `as any` from the insert payload (line 31) — `name_th` is already in `ClassCategoryInsert`

### Step 3: Clean up useClassCategories.ts
- Remove redundant `name_th` from `ClassCategoryWithCount` type
- Remove `as any[]` cast — use proper typing
- Remove `as any` from update mutation payload in ClassCategoryDetails

### Step 4: Add `old_value` to update activity log
- Update `useUpdateClassCategory` to accept optional `oldData` and pass to `logActivity`
- Update `ClassCategoryDetails.tsx` `saveEdit` to pass current category data as `oldData`

### Files to Touch

| File | Change |
|------|--------|
| `src/hooks/useClassCategories.ts` | Remove redundant type, remove `as any`, add `old_value` to update log |
| `src/pages/ClassCategoryDetails.tsx` | Remove `as any` casts, pass `oldData` to update |
| `src/components/categories/CreateClassCategoryDialog.tsx` | Remove `as any` cast |

No DB migration needed. No new files. Surgical cleanup only.

