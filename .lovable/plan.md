

# Fix: Finance Import — `package_type` Enum Error

## Root Cause

Line 102 in `src/lib/importer/entityConfigs/finance.ts` hardcodes `type: 'purchase'`:

```typescript
const tx: Record<string, any> = {
  transaction_id: txId,
  order_name: row.data.order_name || txId,
  amount: parseCurrency(row.data.amount) ?? 0,
  type: 'purchase',  // ← BUG: 'purchase' is NOT a valid package_type enum value
};
```

The `transactions.type` column uses the `package_type` enum which only accepts: `'unlimited' | 'session' | 'pt'`.

The CSV `_type` column has the correct values ("Unlimited", "Session", "PT") but they're never mapped to `tx.type`. Instead, `'purchase'` is hardcoded — which doesn't exist in the enum.

## Fix

**File: `src/lib/importer/entityConfigs/finance.ts`**

1. Add a `normalizePackageType` function to map CSV type values to valid enum values:
   - `'unlimited'` → `'unlimited'`
   - `'session'` → `'session'`
   - `'pt'` / `'personal training'` → `'pt'`
   - Otherwise → `null` (skip setting the field)

2. Replace the hardcoded `type: 'purchase'` with mapped value from `row.data._type`:
   ```typescript
   const tx: Record<string, any> = {
     transaction_id: txId,
     order_name: row.data.order_name || txId,
     amount: parseCurrency(row.data.amount) ?? 0,
   };
   // Map _type to package_type enum
   if (row.data._type) {
     const pt = normalizePackageType(row.data._type);
     if (pt) tx.type = pt;
   }
   ```

No DB migration needed. No other files affected. This is a one-line root cause fix.

