

# Refactor: Single Source of Truth for Schedule Data

## Problem (Confirmed)
- `useScheduleByDate` exists in **both** `useDashboardStats.ts` (lines 204-245) and `useSchedule.ts` (lines 26-48)
- Both use the same query key `queryKeys.schedule(dateStr)` — so they **conflict** (whichever runs first caches its shape, the other gets wrong data)
- Dashboard imports `ScheduleItem` type + `useScheduleByDate` from `useDashboardStats.ts`

## Solution

### 1. Move `ScheduleItem` type to `useSchedule.ts`
Add the `ScheduleItem` interface and a mapper function:

```typescript
export interface ScheduleItem {
  id: string; time: string; className: string; trainer: string;
  location: string; room: string; availability: string;
  checkedIn: number; capacity: number;
}

export function mapScheduleToItem(s: ScheduleWithRelations): ScheduleItem {
  return {
    id: s.id,
    time: `${s.start_time.slice(0,5)} - ${s.end_time.slice(0,5)}`,
    className: s.class?.name || 'Unknown',
    trainer: s.trainer ? `${s.trainer.first_name} ${s.trainer.last_name}` : '-',
    location: s.location?.name || '-',
    room: s.room?.name || '-',
    availability: `${s.checked_in || 0}/${s.capacity || 0}`,
    checkedIn: s.checked_in || 0,
    capacity: s.capacity || 0,
  };
}
```

### 2. Remove duplicate from `useDashboardStats.ts`
- Delete `ScheduleItem` interface (lines 32-42)
- Delete `useScheduleByDate` function (lines 204-245)

### 3. Update `Dashboard.tsx`
- Import `useScheduleByDate`, `ScheduleItem`, `mapScheduleToItem` from `useSchedule.ts`
- Map the data: `const scheduleItems = (scheduleData || []).map(mapScheduleToItem)`
- Use `scheduleItems` for the table instead of `scheduleData` directly

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/useSchedule.ts` | Add `ScheduleItem` type + `mapScheduleToItem` |
| `src/hooks/useDashboardStats.ts` | Remove `ScheduleItem` + `useScheduleByDate` |
| `src/pages/Dashboard.tsx` | Update imports to use `useSchedule.ts` + map data |

No database changes. No new files. Existing behavior preserved — just deduplicated.

