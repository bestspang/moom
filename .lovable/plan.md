

# Enhance Activity Log — Filters, Pagination, Logger & Realtime

## Current State
- `ActivityLog.tsx` shows a table with date range filter, hardcoded `limit(100)`, no event type filters, no pagination
- `useActivityLog.ts` fetches from `activity_log` with date filters only
- Only 3 places currently write to `activity_log`: `useStaff.ts` (staff_created), `PackageDetails.tsx` (package_updated), `invite-staff` edge function (staff_invited)
- **Missing audit logging**: member create/update/delete, schedule create/update/delete, announcement, promotion, location, role changes — none of these log to `activity_log`
- `activity_log` table already has: `event_type`, `entity_type`, `entity_id`, `activity`, `old_value`, `new_value`, `staff_id`, `member_id`
- `activity_log` is NOT in `useRealtimeSync.ts` — no realtime updates
- No `supabase_realtime` publication for `activity_log`

## Plan

### 1. Database Migration — Enable realtime for `activity_log`

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;
```

### 2. Create `src/lib/activityLogger.ts`

Centralized helper that inserts into `activity_log`:

```ts
export async function logActivity(params: {
  event_type: string;
  activity: string;
  entity_type?: string;
  entity_id?: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  staff_id?: string;
  member_id?: string;
}) { ... }
```

Fire-and-forget (catch errors, don't block mutations).

### 3. Update `useActivityLog.ts` — Add filters + server-side pagination

- Accept `eventTypes: string[]` filter and `page/perPage` params
- Use `.in('event_type', eventTypes)` when filter is set
- Use `.range()` for pagination with `{ count: 'exact' }`
- Return `{ data, total }` for pagination controls

### 4. Update `ActivityLog.tsx` — Filter panel + pagination UI

- Add collapsible/popover filter panel with event type checkboxes
- Event type list: `member_created`, `member_updated`, `member_deleted`, `staff_created`, `staff_invited`, `package_updated`, `package_created`, `schedule_created`, `schedule_updated`, `schedule_deleted`, `promotion_created`, `promotion_updated`, `location_created`, `location_updated`, `role_updated`, `announcement_created`
- Add pagination controls at bottom (prev/next, page X of Y)
- Use existing `DataTable` or keep current table with added pagination

### 5. Wire `logActivity` into existing mutation hooks

Add `logActivity()` calls in `onSuccess` of these hooks:
- `useMembers.ts`: `useCreateMember`, `useUpdateMember`, `useDeleteMember`
- `useSchedule.ts`: `useCreateSchedule`/`useCreateScheduleValidated`, `useUpdateSchedule`, `useDeleteSchedule`
- `usePromotions.ts`: `useCreatePromotion`, `useUpdatePromotion`
- `useLocations.ts`: `useCreateLocation`, `useUpdateLocation`
- `useRoles.ts`: role save mutations
- `useStaff.ts`: already has staff_created — replace inline insert with `logActivity`

### 6. Update `useRealtimeSync.ts`

Add `activity_log` to the table union and invalidation map → invalidates `['activity-logs']`.

### 7. i18n Keys

Add filter-related keys under `activityLog`: `filterByEvent`, `allEvents`, `clearFilters`, `page`, `of`, and event type labels.

## Files Summary

| Action | File |
|--------|------|
| Migration | Enable realtime on `activity_log` |
| Create | `src/lib/activityLogger.ts` |
| Modify | `src/hooks/useActivityLog.ts` — filters + pagination |
| Modify | `src/pages/ActivityLog.tsx` — filter UI + pagination |
| Modify | `src/hooks/useMembers.ts` — add audit logging |
| Modify | `src/hooks/useSchedule.ts` — add audit logging |
| Modify | `src/hooks/usePromotions.ts` — add audit logging |
| Modify | `src/hooks/useLocations.ts` — add audit logging |
| Modify | `src/hooks/useRoles.ts` — add audit logging |
| Modify | `src/hooks/useStaff.ts` — use centralized logger |
| Modify | `src/hooks/useRealtimeSync.ts` — add activity_log |
| Modify | `src/i18n/locales/en.ts` + `th.ts` — add keys |

No schema changes needed (table already exists). Existing behavior preserved — logger is additive.

