

# Fix: Enable Slips Import + Clean Up "Unknown" Label

## Problems Found

### 1. Slips import button disabled in BulkImportDropZone
`IMPORTABLE_MODULES` on line 39 of `BulkImportDropZone.tsx` only includes `['members', 'leads', 'packages', 'staff', 'promotions', 'finance']` — missing `'slips'`. The `onStartImport` callback type also doesn't include `'slips'`.

### 2. Finance page — slips tab ManageDropdown missing `onImport`
In `Finance.tsx` line 338-343, the slips tab renders `ManageDropdown` without `onImport`, so there's no Import CSV option on the Transfer Slips tab.

### 3. "Unknown" label in dropdown
The `__none__` option shows "Unknown" which is confusing. Should show something like "Select type..." or remove it if not needed.

## Changes

| # | File | Change |
|---|---|---|
| 1 | `src/components/settings/BulkImportDropZone.tsx` | Add `'slips'` to `IMPORTABLE_MODULES` and update `onStartImport` type signature |
| 2 | `src/pages/Finance.tsx` | Add `onImport` to slips tab `ManageDropdown`, set `presetEntity` based on active tab (`'finance'` or `'slips'`) |
| 3 | `src/components/settings/BulkImportDropZone.tsx` | Change "Unknown" label to "Select type..." for clarity |

All additive. No existing behavior broken.

