

# Recheck: Import Center vs Spec — Gap Analysis

## What's Built and Working

| Requirement | Status | Notes |
|---|---|---|
| Column mapping (auto + manual) | Done | Header aliases + dropdown per column |
| Preview with validation | Done | First 20 rows, error badges |
| Upsert logic per entity | Done | Members, Leads, Packages, Staff, Promotions, Finance |
| Normalize dates/phone/currency/enums | Done | normalizers.ts covers all |
| Error CSV download | Done | exportToCsv with row + reason |
| Activity log per batch | Done | logActivity for batch + per-row |
| Query key invalidation | Done | Per-entity queryKeysToInvalidate |
| BulkImportDropZone (multi-file auto-detect) | Done | Signature-based detection |
| Settings Import/Export page | Done | Cards for 7 modules with export/import/template |
| Slips template-only | Done | "Coming soon" in entity selector |

## Gaps Found

### 1. No default location picker for Members import
**Spec**: "register_location_id required: if not in CSV, prompt user to pick a default location in the dialog"
**Current**: No location selector in ImportCenterDialog. If CSV lacks register_location_id, it inserts as null (which may be fine for the DB but spec explicitly requires a picker).

**Fix**: Add an optional "Default Location" dropdown in the ImportCenterDialog that appears during the mapping/preview step when entity is `members` and no column is mapped to `register_location_id`. Query `locations` table, let user pick one, apply it to all rows missing a location.

### 2. No Manage dropdown in list pages
**Spec**: "Add a Manage dropdown in each list page (Members, Packages, Finance, Staff, Promotions, Transfer Slips) with Import CSV / Export CSV / Download template"
**Current**: Import/Export only accessible from Settings > Import/Export. Individual list pages do NOT open ImportCenterDialog.

**Fix**: In each list page (Members.tsx, Packages.tsx, Staff.tsx, Promotions.tsx, Finance.tsx, TransferSlips.tsx), add or update the existing `ManageDropdown` to include "Import CSV" which opens `ImportCenterDialog` with `presetEntity`. Some pages already have ManageDropdown with export — just add the import option.

### 3. Finance module not in Settings card grid
**Current**: Finance is importable via BulkImportDropZone auto-detect but there's no Finance card in the `modules[]` array in SettingsImportExport.tsx. User can't manually click "Import Finance" from a card.

**Fix**: Add a Finance module config to the `modules[]` array with `hasImport: true, importEntity: 'finance'`.

### 4. No Zod schemas
**Spec**: "Create Zod schemas for each entity"
**Current**: Validation is done via inline `validateRow()` functions. This works but isn't Zod-based.

**Assessment**: Low priority. Current inline validation is functional and consistent. Adding Zod would be a refactor without behavioral change. **Recommend skip** unless user specifically wants Zod.

### 5. Members "overwrite toggle" missing
**Spec**: "If match found: update (default strategy: fill blanks only, but allow toggle overwrite)"
**Current**: Members upsert always overwrites all provided fields. No UI toggle for "fill blanks only" vs "overwrite existing".

**Fix**: Add a toggle/checkbox in ImportCenterDialog (visible during mapping step for members) for "Overwrite existing values" (default: off = fill blanks only). Pass this flag to the upsert function, which skips fields that already have values in DB when overwrite is off.

### 6. Finance "Sold to" member resolution not attempted
**Spec**: "Resolve Sold to -> member_id (match by full name; if not found, store as text)"
**Current**: Sold to is stored as info-only in notes. No attempt to match member.

**Assessment**: Per the approved plan, this was a deliberate decision ("Resolving abbreviated names is unreliable"). Current behavior is correct per plan. **No change needed.**

## Implementation Plan

### Files to modify:

| # | Task | File |
|---|---|---|
| 1 | Add Finance card to module grid | `src/pages/settings/SettingsImportExport.tsx` |
| 2 | Add default location picker for members | `src/components/import/ImportCenterDialog.tsx` |
| 3 | Add "fill blanks only" toggle for members | `src/components/import/ImportCenterDialog.tsx` + `src/lib/importer/entityConfigs/members.ts` |
| 4 | Add Import CSV to ManageDropdown in Members page | `src/pages/Members.tsx` |
| 5 | Add Import CSV to ManageDropdown in Packages page | `src/pages/Packages.tsx` |
| 6 | Add Import CSV to ManageDropdown in Staff page | `src/pages/Staff.tsx` |
| 7 | Add Import CSV to ManageDropdown in Promotions page | `src/pages/Promotions.tsx` |
| 8 | Add Import CSV to ManageDropdown in Finance page | `src/pages/Finance.tsx` |
| 9 | Add Import CSV to ManageDropdown in TransferSlips page | `src/pages/TransferSlips.tsx` |

### Risk: Low
- All changes are additive (no existing behavior modified)
- Entity configs untouched except members (adding overwrite flag support)
- No DB schema changes

