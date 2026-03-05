

# Fix Bulk Import: Add "Transfer Slips" module + Fix Import button UX

## Problems
1. **No "Transfer Slips" option** — `slips-2.csv` gets detected as "Finance" but user expects a separate "Transfer Slips" category. The dropdown only has 6 modules, missing Transfer Slips.
2. **Import button disabled** for all modules except Members and Leads — `IMPORTABLE_MODULES` only includes those two, so clicking Import on Packages/Promotions/Staff/Finance/Slips does nothing.

## Plan

### File: `src/components/settings/BulkImportDropZone.tsx`

1. **Add `'slips'` to `DetectedModule` type** — `'members' | 'leads' | 'packages' | 'promotions' | 'staff' | 'finance' | 'slips' | null`

2. **Add slips detection signature** — signals like `slip`, `transfer`, `bank_transfer` + filename fallback for `slip`

3. **Add "Transfer Slips" to `ALL_MODULES`** dropdown with `labelKey: 'nav.transferSlips'` and a `Receipt` icon

4. **Add slips icon** to `ModuleIcon` (e.g., `Receipt` from lucide)

5. **Update filename fallback** — `slip` → `'slips'` (not `'finance'`), keep `finance`/`transaction` → `'finance'`

6. **Update drop zone description text** — change from "auto-detects Members or Leads" to something more generic like "auto-detects module type" since we now support 7 modules

7. **Keep `IMPORTABLE_MODULES` as `['members', 'leads']`** — this is correct since only those two have import dialogs. The disabled button + "Coming soon" tooltip is the right UX for unsupported modules.

### No other files need changes.

## Risk
- **Minimal**: Only adds a new module type option and fixes detection. No logic changes to import flow.

