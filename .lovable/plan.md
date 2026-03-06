

# Recheck Audit: Stripe-Ready Payment Architecture

## Already Fully Implemented (No Changes Needed)

| Requirement | Status |
|---|---|
| `transactions` table: source_type, source_ref, idempotency_key, VAT columns, paid_at, sold_to_* | Done |
| `member_packages`: purchase_transaction_id, package_name_snapshot, sessions_total | Done |
| `transfer_slips` table with all required fields | Done |
| `activity_log` table | Done |
| `approve-slip` Edge Function (atomic, idempotent, VAT calc, entitlement, activity log) | Done |
| `stripe-create-checkout` Edge Function (stub with pending tx, VAT, activity log) | Done |
| `stripe-webhook` Edge Function (checkout.session.completed, charge.refunded, idempotent, CORS) | Done |
| `useApproveSlip` → edge function invocation | Done |
| Reject/Void set `reviewer_staff_id` via staff lookup | Done |
| Finance page: source_type column, VAT display, Stripe payment method filters, refunded/failed status filters | Done |
| Pie chart: Stripe method labels | Done |
| Member packages: purchase_transaction link column | Done |
| Realtime sync: transfer_slips in TABLE_INVALIDATION_MAP | Done |
| KPI stats: `refunded` status included in refunds counter | Done |
| Dead legacy code removed from useFinance.ts | Done |

## Remaining Gaps (3 items)

### Gap 1: Finance CSV importer missing Stripe payment methods and `failed` status

**File**: `src/lib/importer/entityConfigs/finance.ts`

The `normalizePaymentMethod` function (line 43-50) only maps to `cash`, `qr_promptpay`, `bank_transfer`, `credit_card`. It does NOT recognize `card_stripe` or `qr_promptpay_stripe`. Similarly, `normalizeStatus` (line 60-68) does not recognize `failed`.

The `ENUM_FIELDS` options lists (lines 84-89, 95-101) also lack these values, so the interactive enum mapping step won't offer them.

**Fix**:
- Add `card_stripe` and `qr_promptpay_stripe` to `normalizePaymentMethod` and its `ENUM_FIELDS` options
- Add `failed` to `normalizeStatus` and its `ENUM_FIELDS` options

### Gap 2: Finance CSV importer missing `source_type` column mapping

When importing transactions, there's no way to specify `source_type` (stripe/transfer_slip/manual/etc). All imported rows default to `'manual'` via the DB default, which is correct for CSV imports. However, the importer also doesn't populate `amount_gross`, `amount_ex_vat`, `amount_vat` from the existing `_price_ex_vat` and `_vat` mapped columns — these are treated as info-only and discarded.

**Fix**: In `upsertRows`, when `_price_ex_vat` or `_vat` values are present, populate the corresponding `amount_ex_vat`, `amount_vat`, and `amount_gross` columns so VAT data survives import.

### Gap 3: Finance importer `queryKeysToInvalidate` is stale

Line 238: `queryKeysToInvalidate: [['transactions']]` — should also include `['finance-transactions']` to match the query key used by `useFinanceTransactions`.

**Fix**: Change to `[['transactions'], ['finance-transactions']]`.

## Implementation Plan

### Step 1: Update finance importer enums + VAT population
**File**: `src/lib/importer/entityConfigs/finance.ts`
- Add `card_stripe` and `qr_promptpay_stripe` to `normalizePaymentMethod` + ENUM_FIELDS options
- Add `failed` to `normalizeStatus` + ENUM_FIELDS options
- In `upsertRows`, populate `amount_gross`, `amount_ex_vat`, `amount_vat` from mapped CSV columns
- Fix `queryKeysToInvalidate` to include `['finance-transactions']`

### Risk: Zero — additive enum options, no behavior change for existing imports.

