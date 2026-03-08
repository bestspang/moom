

# Milestone 5: Complete Permission Guards on Remaining Pages

## Problem Confirmed

Milestone 4 added `can()` guards to 9 pages but missed 4 pages that still show create/edit/manage buttons to all users regardless of permissions:

| Page | Resource Key | What needs guarding |
|------|-------------|---------------------|
| `src/pages/Staff.tsx` | `staff` | "Create Staff" button, ManageDropdown |
| `src/pages/Locations.tsx` | `locations` | "Create Location" button, ManageDropdown, edit actions |
| `src/pages/ClassCategories.tsx` | `class_categories` | "Create Category" button |
| `src/pages/TransferSlips.tsx` | `transfer_slips` | ManageDropdown (import/export) |

## Why This First

- Completes the security UX layer started in Milestone 4 — leaving gaps undermines the pattern
- Zero regression risk: only adding conditional renders
- Small scope (~3 lines per file), fast to implement
- Must be done before moving to feature work (Dashboard refinement)

## Plan

For each page:
1. Add `import { usePermissions } from '@/hooks/usePermissions'`
2. Call `const { can } = usePermissions()`
3. Wrap create/edit buttons in `{can('resource', 'write') && ...}`

### Staff.tsx
- Guard "Create Staff" button with `can('staff', 'write')`
- Guard ManageDropdown with `can('staff', 'write')`
- Guard bulk action bar selectable prop with `can('staff', 'delete') || can('staff', 'write')`

### Locations.tsx
- Guard "Create Location" button with `can('locations', 'write')`
- Guard ManageDropdown with `can('locations', 'write')`
- Guard edit action column with `can('locations', 'write')`

### ClassCategories.tsx
- Guard "Create Category" button with `can('class_categories', 'write')`

### TransferSlips.tsx
- Guard ManageDropdown with `can('transfer_slips', 'write')`

### Risk
- Zero regression: Pure conditional rendering additions
- Identical pattern to Members/Leads/Schedule pages

### Files to modify
4 page files — each gets ~3 lines added

