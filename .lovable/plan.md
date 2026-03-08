

# Milestone 9: Insights Page Permission Guards + ReportItem Dedup

## Completed Milestones
1. Route security hardening ✅
2. Finance.tsx split ✅
3. MemberDetails.tsx split ✅
4. Permission guards (9 pages) ✅
5. Permission guards (remaining 4 pages) ✅
6. Dashboard role-aware rendering + Leads guards ✅
7. Members.tsx header guards + export dedup ✅
8. WorkoutList + Announcements permission fixes ✅

## Current State Summary

Permission guards are now comprehensive across all CRUD pages. The remaining gap is the **Insights page** (`src/pages/Insights.tsx`, 327 lines):

- **No `usePermissions` import** — all tabs (revenue charts, financial KPIs like ARPU/LTV/monthly revenue, business health scores) are visible to every role
- **Duplicated `ReportItem` component** — identical component exists in both `Insights.tsx` (lines 28-57) and `Reports.tsx` (lines 21-66)

All other pages (Dashboard, Members, Leads, Packages, Promotions, Schedule, Rooms, Classes, Staff, Locations, ClassCategories, Announcements, WorkoutList, TransferSlips) are properly guarded.

## What Must Be Preserved

- All existing Insights tabs and chart rendering
- All report navigation links
- The `ReportItem` component behavior and styling

## Problems Confirmed

### Issue 1: Insights shows finance data to all roles
The Overview tab displays ARPU, monthly revenue, estimated LTV, and revenue trend charts. The Revenue tab shows revenue bar charts. These should only be visible to users with `can('finance', 'read')` — consistent with the Dashboard milestone 6 pattern.

### Issue 2: Duplicated ReportItem
Both `Insights.tsx` and `Reports.tsx` define their own `ReportItem`. The versions are nearly identical (minor styling differences). This should be extracted to a shared component.

## Plan

### Fix 1: Add permission-based tab visibility
- Import `usePermissions` in `Insights.tsx`
- Gate the "Revenue" tab and revenue-related KPIs (ARPU, monthly revenue, LTV) behind `can('finance', 'read')`
- Keep members/classes/packages tabs visible to all (they show operational data, not financial)
- Gate the revenue sparkline in Overview behind `can('finance', 'read')`

### Fix 2: Extract shared ReportItem
- Create `src/components/reports/ReportItem.tsx` with the component
- Update both `Insights.tsx` and `Reports.tsx` to import from the shared location
- Remove inline definitions from both files

### Files to modify
- `src/components/reports/ReportItem.tsx` — new shared component
- `src/pages/Insights.tsx` — add permission guards + import shared ReportItem
- `src/pages/Reports.tsx` — import shared ReportItem, remove inline definition

### Risk
- Zero regression: conditional renders only + extracting identical component
- Charts and report links work exactly as before for authorized users
- Non-finance tabs remain fully visible to all roles

