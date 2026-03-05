

# Add Bulk Actions to Packages, Promotions, and Workout List

Add row-level selection with a bulk action bar supporting **Change Status**, **Delete**, **Export Selected**, and **Duplicate** for all three pages.

## Design

When rows are selected, a floating action bar appears at the bottom of the page showing:
- **Selected count** (e.g., "3 selected")
- **Change Status** dropdown (Archive, Activate, Draft, etc. — varies per entity)
- **Export Selected** button
- **Duplicate** button
- **Delete** button (destructive, with confirmation dialog)
- **Clear selection** button

The `DataTable` already supports `selectable`, `selectedRows`, `onSelectRow`, `onSelectAll` props — we just need to wire them up.

## Bulk Actions Per Entity

| Action | Packages | Promotions | Workouts |
|--------|----------|------------|----------|
| Change Status | `on_sale`, `scheduled`, `drafts`, `archive` | `active`, `scheduled`, `drafts`, `archive` | `is_active` toggle (active/inactive) |
| Delete | ✅ | ✅ | ✅ (delete training templates) |
| Export Selected | ✅ | ✅ | ✅ |
| Duplicate | ✅ (insert copy with "Copy of" prefix) | ✅ | ✅ |

## Implementation

### 1. Create `BulkActionBar` component (`src/components/common/BulkActionBar.tsx`)
A reusable floating bar component:
```
Props:
- selectedCount: number
- onClearSelection: () => void
- onDelete: () => void
- onExport: () => void
- onDuplicate: () => void
- statusOptions: { value: string; label: string }[]
- onChangeStatus: (status: string) => void
- isLoading?: boolean
```
Renders a fixed bottom bar with buttons. Re-export from `common/index.ts`.

### 2. Add bulk mutation hooks
- `src/hooks/usePackages.ts` — add `useBulkUpdatePackageStatus`, `useBulkDeletePackages`, `useBulkDuplicatePackages`
- `src/hooks/usePromotions.ts` — add `useBulkUpdatePromotionStatus`, `useBulkDeletePromotions`, `useBulkDuplicatePromotions`
- `src/hooks/useTrainingTemplates.ts` — add `useBulkToggleTrainings`, `useBulkDeleteTrainings`, `useBulkDuplicateTrainings`

Each mutation accepts an array of IDs, performs the batch operation, invalidates caches, and logs activity.

### 3. Wire up each page

**Packages.tsx:**
- Add `selectedRows` state, pass `selectable`, `selectedRows`, `onSelectRow`, `onSelectAll` to `DataTable`
- Render `BulkActionBar` when `selectedRows.length > 0`
- Status options: On Sale, Scheduled, Drafts, Archive
- Export selected: filter packages by selected IDs, call existing export logic
- Duplicate: insert copies with `name_en: "Copy of ..."`, status `drafts`
- Delete: confirm dialog, then bulk delete

**Promotions.tsx:**
- Same pattern as Packages
- Status options: Active, Scheduled, Drafts, Archive
- Duplicate: copy with `name: "Copy of ..."`, status `drafts`, clear promo_code

**WorkoutList.tsx:**
- Selection at training template level (not individual workout items)
- Status: bulk toggle `is_active`
- Duplicate: copy training + its workout_items
- Delete: bulk delete trainings (cascade deletes items)

### 4. Delete confirmation dialog
Show an `AlertDialog` before bulk delete, shared across pages. Can be part of `BulkActionBar` or rendered separately in each page.

## Files

| File | Action |
|------|--------|
| `src/components/common/BulkActionBar.tsx` | **Create** — reusable bulk action floating bar |
| `src/components/common/index.ts` | **Edit** — re-export |
| `src/hooks/usePackages.ts` | **Edit** — add 3 bulk mutations |
| `src/hooks/usePromotions.ts` | **Edit** — add 3 bulk mutations |
| `src/hooks/useTrainingTemplates.ts` | **Edit** — add 3 bulk mutations |
| `src/pages/Packages.tsx` | **Edit** — add selection state + BulkActionBar |
| `src/pages/Promotions.tsx` | **Edit** — add selection state + BulkActionBar |
| `src/pages/WorkoutList.tsx` | **Edit** — add selection state + BulkActionBar |
| `src/i18n/locales/en.ts` | **Edit** — add bulk action i18n keys |
| `src/i18n/locales/th.ts` | **Edit** — add bulk action i18n keys |

## Risk
- **Low**: DataTable already supports selection UI — no changes to shared component needed
- **No DB changes**: all operations use existing tables and mutation patterns
- Delete confirmation prevents accidental data loss
- Duplicate creates new records with `drafts` status, safe by default

