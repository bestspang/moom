

# Data Contract: Your Gym Section — Gap Analysis & Fix Plan

## Analysis Summary

After thorough code review, most of the system already works correctly. The gaps are:

### What Already Works (No Changes Needed)
- **Locations**: Full CRUD with `opening_hours`, `categories`, `status` — already complete
- **Roles & Permissions**: `roles` + `role_permissions` tables with UI — complete
- **Workouts**: DB-backed via `training_templates` + `workout_items` — no hardcoded data
- **LINE Identity**: Correctly stored in `line_users` table (normalized); `LineIdentityCard` component already renders for staff
- **Realtime**: All relevant tables already in `useRealtimeSync.ts`
- **Most activity logging**: Members, schedule, locations, promotions, roles, staff create — all log

### What Needs Fixing

**1. Staff table — missing columns**

Current `staff` table has a single `address` text field. The contract requires structured address and demographic fields:

```
Missing columns to ADD:
- date_of_birth (date, nullable)
- gender (text, nullable)  
- address_1 (text, nullable)
- address_2 (text, nullable)
- subdistrict (text, nullable)
- district (text, nullable)
- province (text, nullable)
- postal_code (text, nullable)
```

The existing `address` column will be kept for backward compatibility but the UI will use structured fields going forward.

**2. Staff list page — missing columns**

Currently shows: Name, Phone, Email, Positions. Missing:
- **Location scope** column (shows "All" or specific location names)
- **Status** column (currently only shows "Pending" badge inline — should be a proper column)

**3. Staff create dialog — missing fields**

Form currently captures: first_name, last_name, nickname, phone, email, address (single field), positions. Missing:
- `date_of_birth` (date picker)
- `gender` (select)
- Structured address fields (address_1, address_2, subdistrict, district, province, postal_code)

**4. Staff details page — missing fields**

Currently shows editable fields for: first_name, last_name, nickname, phone, email, address. Missing:
- `date_of_birth`, `gender`
- Structured address fields (replace single `address` with individual fields)

**5. Activity logging gaps**

These mutations do NOT log:
- `useUpdateStaff` — no `logActivity` call
- `useDeleteStaff` — no `logActivity` call
- `useCreateTraining` — no `logActivity` call
- `useUpdateTraining` — no `logActivity` call

**6. Data contract document**

Create `docs/data-contract-yourgym.md` as source of truth.

---

## Implementation Plan

### Step 1: Database Migration
Add missing columns to `staff` table (additive only, no breaking changes).

### Step 2: Create `docs/data-contract-yourgym.md`
Document all tables, required fields, and storage mapping for Staff, Locations, Roles, Workouts, Activity Log.

### Step 3: Update Staff Create Dialog
Add date_of_birth (date picker), gender (select), and structured address fields. Update `StaffDraft` interface and submission to use new columns.

### Step 4: Update Staff Details Page
Add editable fields for date_of_birth, gender, and structured address. Replace single `address` field with structured fields.

### Step 5: Update Staff List Page
Add "Location Scope" and "Status" columns to the table.

### Step 6: Add Missing Activity Logging
Wire `logActivity` into `useUpdateStaff`, `useDeleteStaff`, `useCreateTraining`, `useUpdateTraining`.

### Step 7: i18n Keys
Add translation keys for new fields (date_of_birth, gender, address fields, etc.)

---

## Files Summary

| Action | File |
|--------|------|
| Migration | Add 8 columns to `staff` table |
| Create | `docs/data-contract-yourgym.md` |
| Modify | `src/components/staff/CreateStaffDialog.tsx` — add demographic + structured address fields |
| Modify | `src/pages/StaffDetails.tsx` — add new editable fields |
| Modify | `src/pages/Staff.tsx` — add location scope + status columns |
| Modify | `src/hooks/useStaff.ts` — add logActivity to update/delete |
| Modify | `src/hooks/useTrainingTemplates.ts` — add logActivity to create/update |
| Modify | `src/i18n/locales/en.ts` + `th.ts` — add field labels |

No breaking changes. All changes are additive. Existing data and flows preserved.

