

# Improve CSV Import Dialogs — Required/Optional Fields, Preview, Enum Validation

## Current State
- `ImportCenterDialog` has a single flat column mapping list with no required/optional distinction
- No helper text explaining the mapping UI
- Preview shows only 3 fields truncated per row — no per-field detail
- Finance importer silently drops unrecognized `_type` values (returns `null` from `normalizePackageType`)
- No enum mismatch warnings anywhere
- `EntityConfig.targetFields` has no `required` flag — all fields look the same

## Plan

### 1. Extend `EntityConfig` type (`src/lib/importer/types.ts`)
Add `required?: boolean` to `targetFields` items:
```ts
targetFields: { value: string; label: string; required?: boolean }[];
```

### 2. Mark required fields in each entity config
- **Finance**: `transaction_id`, `amount`, `order_name` → required
- **Members**: `first_name` → required  
- **Leads**: `first_name` → required
- **Packages**: `name_en`, `type`, `price` → required
- **Staff**: `first_name`, `email` → required
- **Promotions**: `name` → required
- **Slips**: `amount_thb`, `slip_datetime` → required
- **Classes/Workouts**: `name` → required

### 3. Add validation warning for unrecognized enum values (Finance)
In `finance.ts` `validateRow`:
- If `_type` is present but `normalizePackageType()` returns null → add warning: `"Unrecognized type: '{value}'. Expected: unlimited, session, pt"`
- Same for `payment_method` and `status` if normalization fails

### 4. Rewrite mapping step in `ImportCenterDialog`
Split into two sections:
- **A) Required fields** — show all required target fields, each with a source column dropdown. If mapped to Skip → inline red error, block Next button
- **B) Optional fields** — show remaining mapped columns with Skip allowed
- Add helper text at top: "Dropdown shows all fields supported by this table. If your CSV doesn't contain a field, choose Skip."
- Flip the mapping direction: iterate over **target fields** (not CSV headers), showing source column dropdown for each

### 5. Enhanced preview step
- Show first 10 rows in a table with **all mapped field columns** (not just 3 truncated values)
- Per-field highlighting: if a field has a normalization issue, show it in orange
- Add "Download error CSV" button in preview (before import), not just after

### 6. Finance-specific: separate `transaction_type` and `package_type`
- Add `_transaction_type` target field to finance config (purchase/refund/void)
- Rename existing `_type` to `_package_type` for clarity
- In `upsertRows`: if `_transaction_type` not mapped, default to `'purchase'` (but this field doesn't exist in the `transactions` table schema currently — so store in notes or skip for now since the DB has no `transaction_type` column)
- Actually: the DB `transactions.type` column is `package_type` enum. There is no `transaction_type` column. So we keep mapping `_type` → `package_type` enum, and add the warning when unrecognized.

## Files to Modify
1. `src/lib/importer/types.ts` — add `required` to target field type
2. `src/lib/importer/entityConfigs/finance.ts` — add enum validation warnings, mark required fields
3. `src/lib/importer/entityConfigs/members.ts` — mark required fields
4. `src/lib/importer/entityConfigs/leads.ts` — mark required fields
5. `src/lib/importer/entityConfigs/packages.ts` — mark required fields
6. `src/lib/importer/entityConfigs/staff.ts` — mark required fields
7. `src/lib/importer/entityConfigs/promotions.ts` — mark required fields
8. `src/lib/importer/entityConfigs/slips.ts` — mark required fields
9. `src/lib/importer/entityConfigs/classes.ts` — mark required fields
10. `src/lib/importer/entityConfigs/workouts.ts` — mark required fields
11. `src/components/import/ImportCenterDialog.tsx` — rewrite mapping step (required/optional sections, helper text, enhanced preview)

## Risk
- Low: additive changes to EntityConfig type (backward compatible with `required?: boolean`)
- Medium: ImportCenterDialog mapping step rewrite — but it's self-contained UI, no other consumers

