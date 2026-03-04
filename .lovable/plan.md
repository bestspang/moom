

# Staff & Roles RBAC Recheck (`staff_roles_rbac_rls_complete_01`)

## Current State Analysis

### What's Working
| Area | Status |
|------|--------|
| Staff CRUD hooks | ✅ create/update/delete with positions + activity log |
| Staff list page | ✅ Tabs, search, columns (name, phone, email, roles, locations, status) |
| Staff details - profile tab | ✅ Inline editing for all fields + LINE identity |
| Staff details - positions tab | ✅ Read-only display of positions with role + location scope |
| Create staff dialog | ✅ Full form with multiple positions, draft persistence |
| Roles list page | ✅ Name, access level, accounts count |
| Role editor (create/edit) | ✅ Access level cards + full permission matrix |
| usePermissions hook | ✅ Merges DB permissions with access_level fallback |
| Sidebar permission filtering | ✅ Uses `can(resource, 'read')` |
| RLS on staff | ✅ level_1_minimum can read, level_3_manager can manage |
| RLS on roles | ✅ All can read, level_4_master can manage |
| RLS on role_permissions | ✅ All can read, level_4_master can manage |
| RLS on staff_positions | ✅ level_1_minimum can read, level_3_manager can manage |
| Realtime sync | ✅ staff, staff_positions, role_permissions all in TABLE_INVALIDATION_MAP |
| Activity log | ✅ staff_created/updated/deleted logged |

### Gaps Found

#### GAP 1: `useStaffStats` hits 1000-row limit
**Severity: HIGH** — Same bug pattern fixed for packages and promotions. Fetches ALL staff rows client-side and counts by status. Will produce wrong counts for >1000 staff.

This is also the likely root cause of the "stats show 10 but table empty" symptom: if the stats query returns cached/stale data while the list query fails (e.g., brief auth state transition during page load), you get stats with no rows.

**Fix**: Use head-only count queries per status (same pattern as `usePackageStats` fix).

#### GAP 2: `useRoles` account counting hits 1000-row limit  
**Severity: MEDIUM** — Fetches ALL `staff_positions` and ALL `staff` rows to count per role. Will be wrong for >1000 entries.

**Fix**: Use count queries grouped by role_id, or use head-only counts per role.

#### GAP 3: Staff details - no add/remove position capability
**Severity: MEDIUM** — Positions tab is read-only. Users cannot add new positions or remove existing ones from the detail page.

**Fix**: Add "Add position" button and remove button per position on the details page positions tab.

#### GAP 4: No data contract documentation
**Severity: LOW** — No `docs/data-contract-staff.md` or `docs/data-contract-roles.md`.

**Fix**: Create both files.

#### GAP 5: Promotions list still uses legacy `discount_type`/`discount_value` display
**Severity: LOW** — `Promotions.tsx` line 38-43 `getDiscountDisplay()` reads legacy `discount_type`/`discount_value` instead of new `discount_mode`/`percentage_discount`/`flat_rate_discount`. This was fixed in `PromotionDetails` but not in the list page.

**Fix**: Update `getDiscountDisplay()` in `Promotions.tsx` to use new columns with legacy fallback.

---

## Implementation Plan

### Step 1: Fix `useStaffStats` — head-only count queries
Replace client-side counting with 3 parallel `{ count: 'exact', head: true }` queries for active/pending/terminated.

**File**: `src/hooks/useStaff.ts`

### Step 2: Fix `useRoles` account counting
Replace fetching all staff_positions + staff rows with per-role count queries (or a single grouped query via RPC). Simpler approach: keep existing pattern but add `.limit(10000)` safeguard, or use count queries per role from the roles list.

**File**: `src/hooks/useRoles.ts`

### Step 3: Add position management to Staff details
Add "Add position" form and "Remove" button per position on the positions tab.

**File**: `src/pages/StaffDetails.tsx`
**New hooks needed**: `useAddStaffPosition`, `useRemoveStaffPosition` in `src/hooks/useStaff.ts`

### Step 4: Fix Promotions list discount display
Update `getDiscountDisplay()` to use new schema columns.

**File**: `src/pages/Promotions.tsx`

### Step 5: Create data contract docs

**Files**: `docs/data-contract-staff.md`, `docs/data-contract-roles.md`

### Files to Touch

| File | Change |
|------|--------|
| `src/hooks/useStaff.ts` | Fix stats + add position mutation hooks |
| `src/hooks/useRoles.ts` | Fix account counting |
| `src/pages/StaffDetails.tsx` | Add/remove positions UI |
| `src/pages/Promotions.tsx` | Fix discount display |
| `docs/data-contract-staff.md` (new) | Data contract |
| `docs/data-contract-roles.md` (new) | Data contract |

No DB migration needed. No breaking changes.

