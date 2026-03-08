

# Fix: AuthContext Console Error Spam — `PGRST116` on Staff Lookup

## Problem (Confirmed from console logs)
Every auth state change triggers `fetchUserRoleAndStatus` which calls:
```typescript
.from('staff').select('status').eq('user_id', userId).single()
```

`.single()` throws `PGRST116` ("The result contains 0 rows") when no staff row exists for the authenticated user. This error fires repeatedly (6+ times visible in logs) and:
- Causes the function to `return` early (line 75), meaning `staffStatus` never gets set
- Floods the console with misleading errors
- Could mask real errors

## Root Cause
Line 67-71 in `src/contexts/AuthContext.tsx` uses `.single()` which requires exactly 1 row. If the `handle_new_user` trigger failed or the user was created before the trigger existed, no staff row exists, and `.single()` throws.

## Fix (1 line change)

**File**: `src/contexts/AuthContext.tsx`, line 71
- Change `.single()` → `.maybeSingle()`

This returns `null` data instead of throwing when 0 rows are found. The existing code at line 78 (`if (staffData?.status === 'inactive')`) and line 85 (`setStaffStatus(staffData?.status ?? null)`) already handle `null` correctly via optional chaining.

## Risk
- **Minimal**: `.maybeSingle()` behaves identically to `.single()` when 1 row exists. Only changes behavior for 0-row case (returns null instead of error). All downstream code already handles null.

