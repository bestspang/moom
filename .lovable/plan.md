

# Add Bulk Actions to Members Page

## What exists
- `BulkActionBar` component already built with: Change Status, Export, Duplicate, Delete actions
- `DataTable` already supports `selectable`, `selectedRows`, `onSelectRow`, `onSelectAll` props
- `useDeleteMember` and `useUpdateMember` hooks exist for single-record operations
- Members page currently has NO selection state or bulk bar

## Plan

### 1. Add bulk mutation hooks to `useMembers.ts`
- `useBulkDeleteMembers`: Delete multiple members by ID array using `.in('id', ids)`
- `useBulkUpdateMemberStatus`: Update status for multiple members using `.in('id', ids).update({ status })`
- Both invalidate `['members']`, `['member-stats']` and log activity

### 2. Wire selection state + BulkActionBar into `Members.tsx`
- Add `selectedRows` state (`string[]`)
- Add `onSelectRow` toggle and `onSelectAll` handler
- Pass `selectable={true}` to DataTable (gated by `can('members', 'delete')` or `can('members', 'write')`)
- Add `BulkActionBar` with:
  - **Change Status**: options = active, suspended, on_hold, inactive → calls bulk update
  - **Export Selected**: filter `members` by selectedRows, call `exportMembers`
  - **Delete**: calls bulk delete with confirmation (already built into BulkActionBar)
  - **Duplicate**: hidden/no-op for members (doesn't make sense to duplicate a person) — pass a no-op or hide
- Clear selection on tab change, search change, page change

### 3. No DB changes needed
Existing RLS policies allow operators+ to manage members.

### Files to modify
- `src/hooks/useMembers.ts` — add `useBulkDeleteMembers`, `useBulkUpdateMemberStatus`
- `src/pages/Members.tsx` — add selection state, import BulkActionBar, wire handlers

