

# Pre-Production Readiness: Analysis & Prioritized Plan

## Current State Summary

| Area | Status | Impact |
|------|--------|--------|
| Reports mock data | 5 hooks return `Math.random()` data | Users see fake numbers — **critical** |
| AI service stub | `stubAiService` exists but is never imported anywhere | **No impact** — dead code, safe to defer |
| Client-side computation | Engagement, lead scoring, churn, business health all run N+1 queries from browser | Performance degrades at scale, but works correctly now |
| Testing | Only 1 placeholder test exists | No safety net for regressions |

## Priority Order

### Priority 1: Reports — Replace Mock Data with Real Supabase Queries

**5 hooks to fix** in `src/hooks/useReports.ts`:

| Hook | Real Data Source |
|------|-----------------|
| `useActiveMembers` | `member_attendance` grouped by date + `members` for demographics |
| `useClassCapacityByHour` | `schedule` (capacity, checked_in) grouped by day-of-week + hour |
| `useClassCapacityOverTime` | `schedule` grouped by date, with trainer/location joins |
| `usePackageSales` | `transactions` (status=paid) joined with `packages` for name/type/category |
| `usePackageSalesOverTime` | Same as above but grouped by time period |

**Approach**: Replace each `queryFn` internals with Supabase queries. Keep the same return shape (stats/chartData/tableData) so report pages need zero changes.

**File touched**: `src/hooks/useReports.ts` only (lines 206-507)

### Priority 2: Testing Coverage for Critical Flows

Add unit tests for the pure logic functions that are most regression-prone:

| Test File | Tests |
|-----------|-------|
| `src/lib/engagementScore.test.ts` | `calculateEngagementScore` edge cases (0 visits, stale, active) |
| `src/hooks/useLeadScoring.test.ts` | `computeLeadScore` with various lead shapes |
| `src/lib/dateRange.test.ts` | `getBangkokDayRange` timezone correctness |
| `src/lib/exportCsv.test.ts` | CSV generation with special characters |

These are pure functions — no mocking needed, high value, fast to write.

### Priority 3: AI Service — No Action Needed Now

`stubAiService` is never imported or used by any component/hook. The `daily-briefing` edge function already calls the Lovable AI gateway directly. This is dead code with zero runtime impact. Safe to leave as-is until an AI feature actually needs it.

### Priority 4: Client-Side Computation — Defer to Scale Need

The heavy hooks (`useEngagementScores`, `useChurnPrediction`, `useBusinessHealth`) query Supabase correctly but do N+1 patterns. At current scale (typical gym: hundreds of members) this is fine. Moving to backend (DB functions or edge functions) is worthwhile when member counts reach thousands. Not a launch blocker.

---

## Implementation Plan (Priority 1 + 2)

### Step 1: Replace `useActiveMembers` mock with real query
- Query `member_attendance` with date range filter, group by date
- Join `members` for location/age/gender filtering
- Compute stats from real aggregates

### Step 2: Replace `useClassCapacityByHour` mock with real query
- Query `schedule` with date range, extract day-of-week and hour from `start_time`
- Calculate avg capacity percentage per cell: `checked_in / capacity * 100`
- Derive peak time from highest cell

### Step 3: Replace `useClassCapacityOverTime` mock with real query
- Query `schedule` grouped by `scheduled_date`
- Join `staff` for trainer name, `locations` for location name
- Calculate daily avg capacity

### Step 4: Replace `usePackageSales` mock with real query
- Query `transactions` (status=paid) joined with `member_packages` → `packages`
- Group by package, sum amounts and count units
- Apply packageType/category filters

### Step 5: Replace `usePackageSalesOverTime` mock with real query
- Same data source as Step 4 but grouped by time period (day/week/month)

### Step 6: Add unit tests for pure logic functions
- 4 test files for engagement, lead scoring, date range, CSV export

### Risk Assessment
- **Reports**: Return shape stays identical — zero UI changes needed. If a table has no data, the existing `EmptyState` component handles it gracefully.
- **Tests**: Additive only, no production code changes.
- **Rollback**: Each hook is independent — can revert individually.

