

# Milestone 8: Fix Permission Inconsistencies in WorkoutList and Announcements

## Completed Milestones
1. Route security hardening ✅
2. Finance.tsx split ✅
3. MemberDetails.tsx split ✅
4. Permission guards (9 pages) ✅
5. Permission guards (remaining 4 pages) ✅
6. Dashboard role-aware rendering + Leads guards ✅
7. Members.tsx header guards + export dedup ✅

## Problems Confirmed

### Issue 1: WorkoutList uses wrong resource key
`src/pages/WorkoutList.tsx` line 155 uses `can('schedule', 'write')` to guard workout management actions. The correct resource key is `workout_list` (defined in `usePermissions.ts` ALL_RESOURCES). This means a user with `schedule` write but NOT `workout_list` write can incorrectly manage workouts, and vice versa.

### Issue 2: WorkoutList inline edit/delete buttons are unguarded
Lines 136-140 (edit/delete per workout item) and lines 209-219 (edit name / toggle active / delete per training group) render for all users regardless of permissions. These destructive actions should be gated by `can('workout_list', 'write')` and `can('workout_list', 'delete')`.

### Issue 3: Announcements delete button is unguarded
`src/pages/Announcements.tsx` lines 190-213 render a delete button with confirmation dialog for every announcement row, visible to all users. The create button IS properly guarded (line 123), but delete is not. Should be wrapped in `can('announcements', 'delete')`.

## Plan

### WorkoutList.tsx
- Change `can('schedule', 'write')` → `can('workout_list', 'write')` for header actions (ManageDropdown + Create button)
- Wrap inline edit/delete buttons on workout items in `can('workout_list', 'write')` check
- Wrap training-level edit/toggle/delete controls in `can('workout_list', 'write')` check
- Guard BulkActionBar selectable behavior with permission check

### Announcements.tsx  
- Wrap the delete button (AlertDialog trigger) in `can('announcements', 'delete')` check

### Files to modify
- `src/pages/WorkoutList.tsx`
- `src/pages/Announcements.tsx`

### Risk
- Zero regression: Only fixing conditional renders and correcting a resource key
- Identical pattern to all previous permission guard milestones

