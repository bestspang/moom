

# System Hardening & Integration Plan

## 1. Detected Mismatches

### AUTH GUARD GAPS (High Priority — causes empty-list bugs)
Hooks missing `enabled: !!user`:
- `useMembers`, `useMemberStats`, `useNextMemberId`
- `useLeads`, `useLead`
- `usePackages`, `usePackageStats`, `usePackage`
- `usePromotions`, `usePromotionStats`, `usePromotion`
- `useClasses`, `useClassStats`, `useClass`, `useClassPerformance`
- `useClassCategories`, `useClassCategory`, `useCategoryClasses`
- `useRooms`, `useRoomStats`, `useRoom`
- `useLocations`, `useLocationStats`, `useLocation`
- `useScheduleByDate`, `useScheduleStats`, `useTrainers`
- `useCheckIns` (useLobby), `useMembersForCheckIn`, `useMemberPackages`, `useCheckDuplicate`
- `useClassBookings` (all hooks in file)

Already fixed: `useFinance`, `useAnnouncements`, `useStaff`, `useRoles`, `useTrainingTemplates`

### STATS 1000-ROW LIMIT (Medium Priority)
Stats hooks fetching all rows to count client-side:
- `useClassStats` — fetches all `classes.status` rows
- `useRoomStats` — fetches all `rooms.status` rows
- `useLocationStats` — fetches all `locations.status` rows

Already fixed: `useMemberStats`, `usePackageStats`, `usePromotionStats`, `useStaffStats`, `useAnnouncementStats`

### MISSING ACTIVITY LOGGING (Medium Priority)
Mutations with no `logActivity` call:
- `useCreateStaff` (standalone, not `useCreateStaffWithPositions`)
- `useDeleteLocation`
- `useDeletePromotion`
- `useDeleteRole`

### INCONSISTENT TOAST LIBRARY (Low Priority)
- `useSchedule` and `useLobby` use `@/hooks/use-toast` (radix-based)
- All other hooks use `sonner`
- Should standardize on `sonner` (majority pattern)

---

## 2. Implementation Plan

### Step 1: Add auth guards to all remaining hooks (12 files)

Each file: import `useAuth`, destructure `user`, add `enabled: !!user` to every `useQuery`. Pattern:
```typescript
const { user } = useAuth();
return useQuery({ ..., enabled: !!user && <existing conditions> });
```

Files: `useMembers`, `useLeads`, `usePackages`, `usePromotions`, `useClasses`, `useClassCategories`, `useRooms`, `useLocations`, `useSchedule`, `useLobby`, `useClassBookings`, `useClassCategories`

### Step 2: Fix stats queries to use head-count pattern (3 hooks)

Convert `useClassStats`, `useRoomStats`, `useLocationStats` from fetching-all-rows to parallel `{ count: 'exact', head: true }` queries.

### Step 3: Add missing activity logging (4 mutations)

Add `logActivity()` calls to `useCreateStaff`, `useDeleteLocation`, `useDeletePromotion`, `useDeleteRole`.

### Step 4: Standardize toast imports (2 files)

Change `useSchedule.ts` and `useLobby.ts` from `@/hooks/use-toast` to `sonner` pattern.

### Files to Touch

| File | Changes |
|------|---------|
| `src/hooks/useMembers.ts` | Auth guard |
| `src/hooks/useLeads.ts` | Auth guard |
| `src/hooks/usePackages.ts` | Auth guard |
| `src/hooks/usePromotions.ts` | Auth guard |
| `src/hooks/useClasses.ts` | Auth guard + fix `useClassStats` |
| `src/hooks/useClassCategories.ts` | Auth guard |
| `src/hooks/useClassBookings.ts` | Auth guard |
| `src/hooks/useRooms.ts` | Auth guard + fix `useRoomStats` |
| `src/hooks/useLocations.ts` | Auth guard + fix `useLocationStats` + add log |
| `src/hooks/useSchedule.ts` | Auth guard + toast migration |
| `src/hooks/useLobby.ts` | Auth guard + toast migration |
| `src/hooks/useRoles.ts` | Add missing log to `useDeleteRole` |
| `src/hooks/useStaff.ts` | Add missing log to `useCreateStaff` |
| `src/hooks/usePromotions.ts` | Add missing log to `useDeletePromotion` |

No DB migration needed. No breaking changes. All surgical fixes.

### Invariants Enforced

1. **Auth Guard**: Every `useQuery` in every data hook has `enabled: !!user`
2. **Stats Accuracy**: All stats use `head: true` count queries, never full-row fetch
3. **Audit Trail**: Every mutation (create/update/delete) calls `logActivity`
4. **Toast Consistency**: All hooks use `sonner` for user feedback

### Smoke Test Checklist
1. Log out → log in → verify no empty lists on any page
2. Check Members, Leads, Packages, Classes, Rooms, Locations, Schedule, Finance tabs all load
3. Check stats badges match actual row counts
4. Create/delete a location → verify activity log entry
5. Delete a promotion → verify activity log entry
6. Delete a role → verify activity log entry
7. Refresh any page → data persists correctly
8. Check mobile layout on Schedule and Lobby pages

