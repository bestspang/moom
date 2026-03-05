

# Add Bulk Actions to Staff Page

## Changes

### 1. Add bulk mutation hooks in `src/hooks/useStaff.ts`
Following the exact Classes pattern, add three hooks:
- `useBulkUpdateStaffStatus` — update status (active/pending/terminated) for selected IDs
- `useBulkDeleteStaff` — delete selected staff rows
- `useBulkDuplicateStaff` — duplicate selected staff as "Copy of" with status=pending

All three invalidate `['staff']` + `['staff-stats']` and log activity.

### 2. Update `src/pages/Staff.tsx`
- Add `selectedRows` state + `handleSelectRow`/`handleSelectAll`/`clearSelection` callbacks (same as Classes page)
- Import `BulkActionBar` from common + new bulk hooks
- Pass `selectable`, `selectedRows`, `onSelectRow`, `onSelectAll` to `DataTable`
- Render `BulkActionBar` with staff status options (`active`/`pending`/`terminated`)
- Wire export-selected to filter staff by selectedRows
- Clear selection on search/tab change

### Status options for bulk bar
```
{ value: 'active', label: 'Active' }
{ value: 'pending', label: 'Pending' }
{ value: 'terminated', label: 'Terminated' }
```

### Risk
Low — additive only. Existing staff list behavior unchanged. DataTable already supports selectable mode.

