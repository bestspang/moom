

# Add Bulk Actions to Classes Page

## Problem
The Classes page (`/class`) has no bulk action support — no row selection checkboxes, no `ManageDropdown` (export/template), and no `BulkActionBar`. The user expects it to match Packages/Promotions/WorkoutList which already have these features.

Packages, Promotions, and WorkoutList already have full bulk action support — no changes needed there.

## Plan

### 1. Add bulk mutation hooks to `src/hooks/useClasses.ts`
Add three new hooks following the same pattern as Packages/Promotions:
- `useBulkUpdateClassStatus()` — update status (active/inactive) for selected classes
- `useBulkDeleteClasses()` — delete selected classes
- `useBulkDuplicateClasses()` — duplicate selected classes as drafts

### 2. Update `src/pages/Classes.tsx`
- Add `selectedRows` state and selection handlers (`handleSelectRow`, `handleSelectAll`, `clearSelection`)
- Add `ManageDropdown` with export/template download to `PageHeader` actions
- Pass `selectable`, `selectedRows`, `onSelectRow`, `onSelectAll` to `DataTable`
- Add `BulkActionBar` with delete/duplicate/status change/export wired to the new bulk hooks
- Add CSV export logic (reuse `exportToCsv`) and template download

### 3. Add i18n keys (if missing)
Check and add any missing bulk-related translation keys for classes in `en.ts` / `th.ts`.

## Files to Change

| File | Action |
|------|--------|
| `src/hooks/useClasses.ts` | Add 3 bulk mutation hooks |
| `src/pages/Classes.tsx` | Add selection, ManageDropdown, BulkActionBar, CSV export |

## Risk
- **Low**: Only adds new hooks + UI wiring to the Classes page. No existing functionality modified.

