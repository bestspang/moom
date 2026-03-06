

# System Consistency Audit — Verified Issues and Fixes

## Issues Found (verified via code)

### Issue 1: Finance export missing from Settings page (REAL BUG)
**Root cause**: `SettingsImportExport.tsx` `handleExport` switch statement has no `case 'finance'` — clicking "Export CSV" for Finance does nothing (falls through to default, shows success toast without exporting).
**Evidence**: The switch only handles: `members`, `leads`, `packages`, `promotions`, `staff`, `classes`, `workouts`. Finance is missing.
**Fix**: Add `case 'finance'` to the switch, matching the Finance page export format (`Finance.tsx` lines 145-166), fetching `transactions` with joins to `members`, `packages`, `locations`, `staff`.

### Issue 2: `enumOverrides` missing from `doImport` dependency array (REAL BUG)
**Root cause**: `ImportCenterDialog.tsx` line 308 — the `doImport` `useCallback` dependency array is `[csvRows, csvHeaders, mapping, config, queryClient, overwriteExisting, defaultLocationId, entity]` but **does not include `enumOverrides`**. If a user maps enums in the enum-mapping step, then clicks Import, the callback captures a stale `enumOverrides` closure (empty `{}`), so overrides are silently ignored.
**Evidence**: Line 308 vs line 70 where `enumOverrides` state is defined and used inside `doImport` at lines 281-293.
**Fix**: Add `enumOverrides` to the dependency array on line 308.

### Issue 3: Packages/Promotions importer configs missing `enumFields` (MINOR GAP)
**Root cause**: `packages.ts` has `normalizeType` and `normalizeStatus` functions but does not define `enumFields`, so the interactive enum-mapping step will never trigger for packages import (unrecognized type values like "Time" or "Personal Training" will just fail in preview). Same for `promotions.ts` (has `normalizeStatus` but no `enumFields`).
**Evidence**: `packagesConfig` (line 133-141) and `promotionsConfig` (line 143-151) have no `enumFields` property. Only `financeConfig` defines it.
**Fix**: Add `enumFields` definitions to `packagesConfig` (for `type` and `status`) and `promotionsConfig` (for `status` and `_type`).

### Issue 4: Settings template headers out of sync with actual export columns
**Root cause**: Settings page `modules[].templateHeaders` don't match the actual exported columns:
- **Packages template**: `['name_en','name_th','type','price','sessions','expiration_days','term_days','status']` — missing `ID`, `Categories`, `Access locations`, `Sold at`, `Date modified`
- **Promotions template**: `['name','name_en','name_th','promo_code','discount_type','discount_value','status','start_date','end_date']` — uses raw field names (`discount_type`, `discount_value`) but export uses formatted headers (`Type`, `Discount`, `Started on`, `Ending on`, `Date modified`)
**Fix**: Align template headers to match export column headers.

---

## Implementation Plan

### Step 1: Fix `enumOverrides` in `doImport` dependency array
**File**: `src/components/import/ImportCenterDialog.tsx` line 308
**Change**: Add `enumOverrides` to the dependency array.
**Risk**: None — fixes a stale closure bug.

### Step 2: Add `case 'finance'` to Settings export
**File**: `src/pages/settings/SettingsImportExport.tsx`
**Change**: Add finance export case with joins to `members(first_name, last_name)`, `location:locations(name)`, `staff(first_name, last_name)` matching Finance page format.
**Risk**: Low — additive only.

### Step 3: Add `enumFields` to packages and promotions importer configs
**Files**: `src/lib/importer/entityConfigs/packages.ts`, `src/lib/importer/entityConfigs/promotions.ts`
**Change**: Add `enumFields` arrays using existing normalize functions.
**Risk**: Low — purely additive; existing behavior unchanged when all enum values match.

### Step 4: Sync template headers
**File**: `src/pages/settings/SettingsImportExport.tsx`
**Change**: Update `templateHeaders` for packages and promotions modules to match their actual export column headers.
**Risk**: None — only affects downloaded template CSV headers.

---

## What was NOT changed (verified working correctly)
- Export logic for members, leads, staff, classes, workouts — all consistent between Settings and their respective pages
- Import flow steps (required/optional sections, helper text, preview table) — all working
- Enum-mapping UI rendering — working correctly
- `buildPreview` applies `enumOverrides` correctly (has it in deps)
- Slips module correctly has `hasExport: false` — no false export button issue
- Command palette aliases — verified no actual duplicates (different navigation targets)

