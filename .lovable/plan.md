

# Milestone 4: Add Permission-Aware Button Guards Across All Admin Pages

## Current State (Confirmed)

Previous milestones completed:
1. Route security hardening — all routes guarded ✅
2. Finance.tsx split — 806 → ~270 lines ✅
3. MemberDetails.tsx split — 901 → ~270 lines ✅

## Problem Confirmed

Only **2 of 11+ pages** (Members, Leads) use `usePermissions()` + `can()` to guard create/edit/delete buttons. The remaining pages show action buttons to **all authenticated users regardless of role**:

| Page | Has `can()` guards? | Create/Edit buttons shown to all? |
|------|---------------------|-----------------------------------|
| Members | ✅ Yes | No — properly guarded |
| Leads | ✅ Yes | No — properly guarded |
| Schedule | ❌ No | Yes — "Schedule Class" visible to all |
| Packages | ❌ No | Yes — "Create Package" visible to all |
| Promotions | ❌ No | Yes — "Create Promotion" visible to all |
| Classes | ❌ No | Yes — "Create Class" visible to all |
| Rooms | ❌ No | Yes — "Create Room" visible to all |
| WorkoutList | ❌ No | Yes — "Create Training" visible to all |
| Announcements | ❌ No | Yes — "Create" visible to all |
| Lobby | ❌ No | Yes — "Check In" visible to all |
| Roles | ❌ No | Yes — "Create Role" visible to all |

Route guards prevent unauthorized access to the *page*, but once a user with sufficient route access lands on a page, they see all action buttons even if their granular permissions don't include `write` for that resource.

**RLS will block the actual operation**, but showing buttons that fail silently is poor UX and confusing for staff.

## Why This Milestone Next

- **Security UX completeness**: Route guards (milestone 1) protect page access. Button guards complete the defense-in-depth by hiding actions the user can't perform.
- **Zero regression risk**: Only wrapping existing buttons in conditional renders. No logic, hook, or data flow changes.
- **Consistent pattern**: Members and Leads already demonstrate the exact pattern to replicate.

## Plan

For each page, add `import { usePermissions } from '@/hooks/usePermissions'`, call `const { can } = usePermissions()`, and conditionally render create/edit/delete buttons.

| File | Resource Key | What to guard |
|------|-------------|---------------|
| `src/pages/Schedule.tsx` | `schedule` | "Schedule Class" button |
| `src/pages/Packages.tsx` | `packages` | "Create Package" button, manage dropdown |
| `src/pages/Promotions.tsx` | `promotions` | "Create Promotion" button, manage dropdown |
| `src/pages/Classes.tsx` | `classes` | "Create Class" button, manage dropdown |
| `src/pages/Rooms.tsx` | `rooms` | "Create Room" button |
| `src/pages/WorkoutList.tsx` | `schedule` | "Create Training" button |
| `src/pages/Announcements.tsx` | `announcements` | "Create" button |
| `src/pages/Lobby.tsx` | `lobby` | "Check In" button |
| `src/pages/Roles.tsx` | `roles` | "Create Role" button |

### Approach
- Use `can('resource', 'write')` to conditionally show create/edit buttons
- Use `can('resource', 'delete')` for delete actions where applicable
- Follow the exact pattern already used in `Members.tsx` and `Leads.tsx`
- Wrap buttons in `{can('resource', 'write') && <Button>...</Button>}` pattern
- No behavior change for users who already have correct permissions

### Risk
- **Zero regression**: Pure conditional rendering additions. No hook, data, or layout changes.
- **Rollback**: Remove the `can()` wrappers to revert.

### Files to modify
9 page files listed above — each gets ~3 lines added (import + hook call + conditional wraps).

