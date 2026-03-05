

# Fix: Finance Import Enum Mismatches

## Root Cause

The `normalizePaymentMethod` and `normalizeStatus` functions in `src/lib/importer/entityConfigs/finance.ts` return values that don't exist in the database enums:

| Function | Returns | DB Enum Values |
|---|---|---|
| `normalizePaymentMethod` | `'cash'` | `credit_card`, `bank_transfer`, `qr_promptpay` (no `cash`) |
| `normalizeStatus` | `'completed'`, `'refunded'` | `paid`, `pending`, `voided`, `needs_review` (no `completed` or `refunded`) |

This causes 100% failure on import — every row hits an enum violation.

## Fix

### 1. Add `cash` to `payment_method` enum (DB migration)
```sql
ALTER TYPE payment_method ADD VALUE 'cash';
```

### 2. Fix `normalizeStatus` in `src/lib/importer/entityConfigs/finance.ts`
Map to actual enum values:
- `'paid'` / `'completed'` → `'paid'` (not `'completed'`)
- `'refunded'` / `'refund'` → `'voided'` (closest match, or we add `refunded` to enum)
- `'needs review'` → `'needs_review'`

### 3. Fix `normalizePaymentMethod`
- `'cash'` → `'cash'` (after enum addition)
- Keep existing mappings (they're correct)

### Optional: Add `refunded` to `transaction_status` enum
If refunds are a real business case:
```sql
ALTER TYPE transaction_status ADD VALUE 'refunded';
```

## Files Changed
- DB migration: add `cash` to `payment_method`, optionally `refunded` to `transaction_status`
- `src/lib/importer/entityConfigs/finance.ts`: fix return values in both normalize functions

Zero risk to existing data — `ALTER TYPE ADD VALUE` is additive only.

