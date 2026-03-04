

# Schedule Gaps — Status Check

## Already Fixed (No Changes Needed)

**Gap 1: `useScheduleStats` avgCapacity** — Already uses real booking counts from `class_bookings` table (lines 122-150). Correctly computes `attended / capacity * 100`.

**Gap 2: `useBatchMarkAttendance` cross-module writes** — Already loops through each attended booking and creates `member_attendance` rows, `package_usage_ledger` entries, and updates `sessions_remaining` (lines 334-382). Query invalidations are comprehensive.

## One Minor Cleanup

**Gap 3: `mapScheduleToItem` availability fallback** — Line 38 currently reads:
```
availability: `${s.booked_count ?? s.checked_in ?? 0}/${s.capacity || 0}`
checkedIn: s.attended_count ?? s.checked_in ?? 0
```

The `s.checked_in` fallback is stale data that's never updated. Since `useScheduleByDate` always populates `booked_count` and `attended_count`, the fallback should be removed for clarity:

```
availability: `${s.booked_count ?? 0}/${s.capacity || 0}`
checkedIn: s.attended_count ?? 0
```

### File to modify
| File | Change |
|------|--------|
| `src/hooks/useSchedule.ts` | Remove `s.checked_in` fallback from `mapScheduleToItem` (lines 38-39) |

This is a 2-line cosmetic fix. No behavior change since `booked_count`/`attended_count` are always set.

