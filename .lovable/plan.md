

# System Consistency Audit — Verified Issues

## Issues Found (all verified via code)

### Issue 1: Slips "Export CSV" button shown but does nothing (BUG)
**Root cause**: Line 325 always renders an Export CSV button for every module, but `hasExport: false` is only checked for the Import button (line 329). Slips has `hasExport: false` but the export button is still clickable. Since there's no `case 'slips'` in the `handleExport` switch, it falls through silently and shows a **false success toast** ("Export successful") without downloading anything.

**Fix**: Wrap the Export CSV button with the same `mod.hasExport` conditional used for import, showing a disabled/tooltip button when `hasExport` is `false`.

**Risk**: None — purely UI guard, no logic change.

---

### Issue 2: Staff export in Settings missing 5 columns vs Staff page (BUG)
**Root cause**: Settings exports only 6 columns (`first_name, last_name, nickname, email, phone, status`), but Staff.tsx exports 11 columns including **Role, Gender, Birthdate, Address, Branch**. The Settings export also does a plain `select('*')` without joining `staff_positions` or `locations`, so it can't resolve roles or branches even if columns were added.

**Fix**: 
1. Update the staff export query to join `staff_positions(role:roles(name), scope_all_locations, location_ids)`.
2. Fetch locations for branch name resolution.
3. Add missing columns: Role, Gender, Birthdate, Address, Branch — matching Staff.tsx `buildCsvColumns()`.

**Risk**: Low — only changes CSV output, no other behavior affected.

---

### Issue 3: Staff template headers out of sync
**Root cause**: Settings uses `['first_name','last_name','nickname','email','phone','status']` but Staff.tsx uses `['Firstname', 'Lastname', 'Nickname', 'Role', 'Gender', 'Birthdate', 'Email', 'Phone', 'Address', 'Branch', 'Status']`.

**Fix**: Update Settings `templateHeaders` for staff to match Staff.tsx's `TEMPLATE_HEADERS`.

**Risk**: None — only affects downloaded template CSV.

---

## Implementation Plan

### Step 1: Fix Export button visibility for modules with `hasExport: false`
**File**: `src/pages/settings/SettingsImportExport.tsx` lines 325-328
- Wrap Export CSV button with `mod.hasExport` check, same pattern as import button (show disabled + tooltip when false).

### Step 2: Expand Staff export to match Staff.tsx
**File**: `src/pages/settings/SettingsImportExport.tsx` lines 210-222
- Update query: `supabase.from('staff').select('*, staff_positions(role:roles(name), scope_all_locations, location_ids)')`
- Fetch locations with `Promise.all`
- Add columns: Role, Gender, Birthdate, Address, Branch
- Add helper functions for role/location/address resolution matching Staff.tsx

### Step 3: Sync Staff template headers
**File**: `src/pages/settings/SettingsImportExport.tsx` line 53
- Update to: `['Firstname','Lastname','Nickname','Role','Gender','Birthdate','Email','Phone','Address','Branch','Status']`

---

## What was verified as already correct (NO changes needed)
- Members export: Settings matches Members page (both use `exportMembers`)
- Leads export: Settings matches Leads page (both use `exportLeads`)
- Packages export: Already fixed in previous session — columns match
- Promotions export: Already fixed in previous session — columns match
- Finance export: Already fixed in previous session — columns match
- Classes export: Settings matches (7 basic columns, both consistent)
- Workouts export: Settings matches (3 columns, both consistent)
- `enumOverrides` dependency: Already fixed in previous session
- Package/Promotions `enumFields`: Already added in previous session
- Import flow: All 9 entities working correctly

