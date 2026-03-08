

# Milestone 7: Members.tsx Header Permission Guards + Export Dedup

## Completed Milestones
1. Route security hardening ✅
2. Finance.tsx split ✅
3. MemberDetails.tsx split ✅
4. Permission guards (9 pages) ✅
5. Permission guards (remaining 4 pages) ✅
6. Dashboard role-aware rendering + Leads guards ✅

## Problem Confirmed

**Members.tsx** (423 lines) has two issues:

### Issue 1: Missing header-level permission guards
The Members page was marked as "properly guarded" in Milestone 4 audit, but only the **per-row edit action** (line 219) uses `can('members', 'write')`. The **header-level actions** (Create Member button + Manage dropdown with import/export/template) are rendered to ALL users regardless of permissions — lines 322-363 have no `can()` wrapper.

This is the same gap that was fixed on Leads.tsx in Milestone 6.

### Issue 2: Duplicated export mapping
`handleExport` (lines 99-135) and `handleBulkExport` (lines 271-308) contain nearly identical 35-line member-to-export mapping logic. This violates DRY and increases maintenance risk.

## Plan

### Fix 1: Wrap header actions in permission check
Wrap the `PageHeader` `actions` prop with `can('members', 'write')` — identical pattern used in Leads.tsx milestone 6:
```
actions={can('members', 'write') ? (...) : undefined}
```

### Fix 2: Extract shared export mapper
Create a `mapMemberToExport` helper function used by both `handleExport` and `handleBulkExport`, reducing ~35 duplicated lines to a single function call each.

### Files to modify
- `src/pages/Members.tsx` — add permission guard to header actions + extract shared mapper function

### Risk
- Zero regression: conditional render + internal refactor only
- Export behavior unchanged — same mapping, just deduplicated
- Identical pattern to Leads.tsx fix

