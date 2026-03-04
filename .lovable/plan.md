

# Activity Log Data Complete (`activity_log_data_complete_01`)

## Current State

| Area | Status |
|------|--------|
| DB table `activity_log` | ✅ Exists with core columns |
| `logActivity()` helper | ✅ Used in 21 files across all major modules |
| Activity log page (date range, event filter, pagination) | ✅ Working |
| Staff join for "who performed" | ✅ LEFT JOIN via `staff:staff_id(...)` |
| Realtime invalidation | ✅ `activity_log` in `TABLE_INVALIDATION_MAP` |
| Value change display | ✅ `formatValueChange()` renders old→new diffs |

## Gaps

### GAP 1: Missing DB indexes (performance)
Only the PK index exists. No indexes on `created_at`, `event_type`, or `staff_id`. Date range + event type queries will do full table scans as data grows.

### GAP 2: Missing auth guard on query
`useActivityLogs` has no `enabled: !!user` guard — same pattern that caused the staff empty-list bug.

### GAP 3: No search functionality
The page has date range and event type filters but no text search bar. User requirement: search across `activity` text.

### GAP 4: Page size mismatch
Currently 25 per page; user requests 50.

### GAP 5: Missing `location_id` column
Data contract specifies `location_id` on activity_log for location-scoped filtering. Column doesn't exist yet.

---

## Implementation Plan

### Step 1: DB migration — add indexes + `location_id` column
```sql
ALTER TABLE public.activity_log
  ADD COLUMN IF NOT EXISTS location_id uuid;

CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_event_type ON public.activity_log (event_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_staff_id ON public.activity_log (staff_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_location_id ON public.activity_log (location_id);
```

### Step 2: Fix `useActivityLog.ts`
- Add `enabled: !!user` auth guard (import `useAuth`)
- Add optional `search` parameter that filters with `.or('activity.ilike.%${search}%')`
- Change default `perPage` to 50

### Step 3: Update `ActivityLog.tsx`
- Add `SearchBar` component between date picker and filter button
- Wire search state to hook
- Change `PER_PAGE` to 50

### Step 4: Update `logActivity` params interface
- Add optional `location_id` field to `LogActivityParams`
- Pass it through to the insert

### Files to Touch

| File | Change |
|------|--------|
| DB migration | Add `location_id`, indexes |
| `src/hooks/useActivityLog.ts` | Auth guard, search param, perPage 50 |
| `src/pages/ActivityLog.tsx` | Add SearchBar, perPage 50 |
| `src/lib/activityLogger.ts` | Add `location_id` to interface + insert |

No breaking changes. All additive.

