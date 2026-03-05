

# Recheck: Import Center Full Spec Compliance

## Current State Summary

The import system is largely complete. All 9 entity configs exist and are registered. The ImportCenterDialog supports column mapping, preview, validation, upsert, error CSV download, activity logging, and query invalidation. Members-specific features (default location picker, overwrite toggle) are implemented.

## Gaps Found

### 1. Classes config — missing activity logging + missing invalid row filtering
**File**: `src/lib/importer/entityConfigs/classes.ts`
- No `logActivity` calls (batch or per-row)
- `upsertRows` processes ALL rows including those with validation errors (doesn't filter `rows.filter(r => r.errors.length === 0)`)
- Fix: Add `logActivity` import, filter valid/invalid rows, log batch result

### 2. Workouts config — missing activity logging + missing invalid row filtering
**File**: `src/lib/importer/entityConfigs/workouts.ts`
- Same issues as classes: no activity log, no error filtering
- Fix: Same pattern as classes

### 3. TransferSlips page — missing Import CSV in ManageDropdown
**File**: `src/pages/TransferSlips.tsx`
- The ManageDropdown only has export + template download — no "Import CSV" action
- `ImportCenterDialog` is not imported or rendered
- Fix: Add `importOpen` state, import `ImportCenterDialog`, add `onImport` to ManageDropdown

### 4. Slips export button disabled in SettingsImportExport but should show export
**File**: `src/pages/settings/SettingsImportExport.tsx`  
- Slips has `hasExport: false` but there's no export handler for it either — this is fine since there's no transfer_slips table. No change needed.

### 5. ManageDropdown — need to verify `onImport` prop exists
**File**: `src/components/common/ManageDropdown.tsx`
- Need to check if it supports an `onImport` prop

## Files to Read

Let me verify ManageDropdown supports `onImport`.

## Implementation Plan

| # | Task | File | Risk |
|---|---|---|---|
| 1 | Add activity logging + invalid row filtering to classes config | `src/lib/importer/entityConfigs/classes.ts` | Low |
| 2 | Add activity logging + invalid row filtering to workouts config | `src/lib/importer/entityConfigs/workouts.ts` | Low |
| 3 | Add Import CSV to TransferSlips ManageDropdown | `src/pages/TransferSlips.tsx` | Low |

All changes are additive. No existing behavior modified.

