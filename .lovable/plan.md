

# Recheck: Staff & Roles RBAC (`staff_roles_rbac_rls_complete_01`)

## Verification Summary

| Area | Status |
|------|--------|
| Staff stats (head-only counts) | ✅ Done |
| Roles account counting (head-only) | ✅ Done |
| Staff details - profile editing | ✅ Done |
| Staff details - add/remove positions | ✅ Done |
| Promotions list discount display (new schema) | ✅ Done |
| Data contract docs | ✅ Done |
| Realtime sync (staff, staff_positions, role_permissions) | ✅ Done |
| Activity log (staff CRUD, positions) | ✅ Done |

## Remaining Gaps

### GAP 1: Staff list "empty bug" — missing auth guard on queries
**Severity: HIGH — Root cause of the reported symptom**

`useStaff` and `useStaffStats` do NOT have `enabled: !!user` guards. During auth state transitions (page load, token refresh), the query fires with no auth token. RLS blocks everything, returning 0 rows. React Query caches the empty result. Meanwhile, `useStaffStats` may still show cached counts from a prior successful fetch — producing the exact symptom: "stats show Active 10, table shows empty."

**Fix**: Import `useAuth` and add `enabled: !!user` to both `useStaff` and `useStaffStats` queries. Same pattern should be applied to `useRoles`.

**File**: `src/hooks/useStaff.ts`, `src/hooks/useRoles.ts`

### GAP 2: Missing DB columns for emergency contact and staff_code
**Severity: MEDIUM**

The data contract (`docs/data-contract-staff.md`) and the `CreateStaffDialog` reference emergency contact fields (`emergency_first_name`, `emergency_last_name`, `emergency_phone`, `emergency_relationship`) and `staff_code`. These columns do **not exist** in the `staff` table.

The `StaffDetails` page does NOT render emergency fields yet, but the data contract promises them.

**Fix**: DB migration to add these 5 columns to the `staff` table. Then update `StaffDetails.tsx` to render emergency contact fields.

### GAP 3: CreateStaffDialog doesn't persist emergency fields
**Severity: LOW** — Blocked by GAP 2 (columns don't exist yet)

The `StaffDraft` interface in `CreateStaffDialog` does not include emergency fields. Once GAP 2 adds the columns, the dialog should be extended.

---

## Implementation Plan

### Step 1: Add auth guard to staff/roles queries (fixes empty bug)
Add `enabled: !!user` to `useStaff`, `useStaffStats`, and `useRoles` queries by importing `useAuth`.

**Files**: `src/hooks/useStaff.ts`, `src/hooks/useRoles.ts`

### Step 2: DB migration — add missing staff columns
```sql
ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS emergency_first_name text,
  ADD COLUMN IF NOT EXISTS emergency_last_name text,
  ADD COLUMN IF NOT EXISTS emergency_phone text,
  ADD COLUMN IF NOT EXISTS emergency_relationship text,
  ADD COLUMN IF NOT EXISTS staff_code text UNIQUE;
```

### Step 3: Update StaffDetails — show emergency contact section
Add emergency contact fields to the profile tab using the existing `EditableField` pattern.

**File**: `src/pages/StaffDetails.tsx`

### Step 4: Update CreateStaffDialog — include emergency fields
Extend `StaffDraft` interface and form to include emergency contact fields, persist them in the `onSubmit` handler.

**File**: `src/components/staff/CreateStaffDialog.tsx`

### Files to Touch

| File | Change |
|------|--------|
| `src/hooks/useStaff.ts` | Add `enabled: !!user` auth guard |
| `src/hooks/useRoles.ts` | Add `enabled: !!user` auth guard |
| DB migration | Add 5 missing columns to staff table |
| `src/pages/StaffDetails.tsx` | Add emergency contact section |
| `src/components/staff/CreateStaffDialog.tsx` | Add emergency fields to form |

No breaking changes. Backward compatible (all new columns nullable).

