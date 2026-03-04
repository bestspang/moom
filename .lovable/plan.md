

# Realtime Sync Layer: queryKeys + useRealtimeSync

## Overview

Create a centralized query key registry and a single Supabase Realtime subscription that auto-invalidates React Query caches on database changes. Mount once in `MainLayout`.

---

## 1. New File: `src/lib/queryKeys.ts`

Canonical query key builders replacing all inline `['schedule', ...]` arrays:

```typescript
export const queryKeys = {
  schedule: (dateStr: string) => ['schedule', dateStr] as const,
  scheduleStats: (dateStr: string) => ['schedule-stats', dateStr] as const,
  rooms: (status?: string, search?: string) => ['rooms', status, search] as const,
  roomStats: () => ['room-stats'] as const,
  locations: (status?: string, search?: string) => ['locations', status, search] as const,
  locationStats: () => ['location-stats'] as const,
  classes: (status?: string, search?: string) => ['classes', status, search] as const,
  classStats: () => ['class-stats'] as const,
  classBookings: (scheduleId?: string) => ['class-bookings', scheduleId] as const,
  classWaitlist: (scheduleId?: string) => ['class-waitlist', scheduleId] as const,
  bookingCount: (scheduleId: string) => ['booking-count', scheduleId] as const,
  memberBookings: (memberId: string, status?: string) => ['member-bookings', memberId, status] as const,
  members: (params?: object) => ['members', params] as const,
  member: (id: string) => ['member', id] as const,
  memberStats: () => ['member-stats'] as const,
  leads: (search?: string) => ['leads', search] as const,
  dashboardStats: () => ['dashboard-stats'] as const,
  highRiskMembers: () => ['high-risk-members'] as const,
  hotLeads: () => ['hot-leads'] as const,
  upcomingBirthdays: () => ['upcoming-birthdays'] as const,
  trainers: () => ['trainers'] as const,
  featureFlags: () => ['feature-flags'] as const,
  featureFlag: (key: string) => ['feature-flag', key] as const,
};
```

---

## 2. New File: `src/hooks/useRealtimeSync.ts`

Single hook that:
- Creates one Supabase channel `realtime-sync`
- Subscribes to `postgres_changes` for 12 tables
- On change, does targeted query invalidation:

**Table → Invalidation mapping:**

| Table | Invalidated Keys |
|-------|-----------------|
| `schedule` | `schedule` (by `scheduled_date` if available), `schedule-stats`, `dashboard-stats` |
| `member_attendance` | `dashboard-stats`, `schedule` (broad) |
| `class_bookings` | `class-bookings`, `member-bookings`, `booking-count`, `schedule` |
| `class_waitlist` | `class-waitlist` |
| `rooms` | `rooms`, `room-stats` |
| `locations` | `locations`, `location-stats` |
| `classes` | `classes`, `class-stats` |
| `class_categories` | `class-stats`, `classes` |
| `members` | `members`, `member-stats`, `high-risk-members`, `upcoming-birthdays` |
| `member_packages` | `high-risk-members`, `member-bookings` |
| `package_usage_ledger` | `member-bookings` |
| `leads` | `leads`, `hot-leads` |

- Uses `queryClient.invalidateQueries({ queryKey: [prefix] })` (prefix match, not exact) for broad invalidation
- For `schedule` changes: extracts `scheduled_date` from payload for targeted invalidation

---

## 3. Database Migration

Enable realtime publication for the 12 tables:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE 
  schedule, member_attendance, class_bookings, class_waitlist,
  rooms, locations, classes, class_categories,
  members, member_packages, package_usage_ledger, leads;
```

---

## 4. Mount Point: `MainLayout.tsx`

Add `useRealtimeSync()` call inside `MainLayout` component body. This runs after auth (since `MainLayout` is inside `ProtectedRoute`), and cleans up on unmount.

---

## 5. Update Existing Hooks to Use `queryKeys`

Update all 9 hook files to import from `queryKeys` instead of inline arrays:
- `useSchedule.ts`
- `useRooms.ts`
- `useLocations.ts`
- `useClasses.ts`
- `useMembers.ts`
- `useLeads.ts`
- `useDashboardStats.ts`
- `useClassBookings.ts`
- `useFeatureFlags.ts`

This is a mechanical find-replace of query key strings with `queryKeys.xxx()` calls. No behavior change.

---

## 6. Files Summary

| Action | File |
|--------|------|
| Create | `src/lib/queryKeys.ts` |
| Create | `src/hooks/useRealtimeSync.ts` |
| Modify | `src/components/layout/MainLayout.tsx` (add hook call) |
| Modify | `src/hooks/useSchedule.ts` (use queryKeys) |
| Modify | `src/hooks/useRooms.ts` (use queryKeys) |
| Modify | `src/hooks/useLocations.ts` (use queryKeys) |
| Modify | `src/hooks/useClasses.ts` (use queryKeys) |
| Modify | `src/hooks/useMembers.ts` (use queryKeys) |
| Modify | `src/hooks/useLeads.ts` (use queryKeys) |
| Modify | `src/hooks/useDashboardStats.ts` (use queryKeys) |
| Modify | `src/hooks/useClassBookings.ts` (use queryKeys) |
| Modify | `src/hooks/useFeatureFlags.ts` (use queryKeys) |
| Migration | Enable realtime for 12 tables |

---

## 7. Safety

- No behavior change — only centralizes key strings and adds background sync
- Existing mutation `onSuccess` invalidation still works (redundant but harmless)
- Channel cleanup on unmount prevents memory leaks
- Only runs inside `ProtectedRoute` so auth is guaranteed

