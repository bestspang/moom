

# Recheck: Payment Architecture Completeness Audit

## Verified as Complete (No Changes Needed)

| Requirement | Status |
|---|---|
| `transactions` table: source_type, source_ref, idempotency_key, VAT, paid_at, sold_to_* | Done |
| `member_packages`: purchase_transaction_id, package_name_snapshot, sessions_total | Done |
| `transfer_slips` table with all required fields | Done |
| `activity_log` table | Done |
| `approve-slip` Edge Function (atomic, idempotent, VAT, entitlement) | Done |
| `stripe-create-checkout` Edge Function (stub) | Done |
| `stripe-webhook` Edge Function (checkout + refund handling) | Done |
| `useApproveSlip` calls edge function | Done |
| Reject/Void set `reviewer_staff_id` | Done |
| Finance page: source column, VAT display | Done |
| Finance filter: card_stripe, qr_promptpay_stripe | Done |
| Member packages: purchase_transaction link column | Done |
| Realtime sync: transfer_slips | Done |
| CORS headers consistent across all 3 edge functions | Done |

## Remaining Issues (4 items)

### Issue 1: `computeFinanceStats` ignores `refunded` status
**File**: `src/hooks/useFinance.ts` line 81
**Problem**: Stats count `voided` as refunds but ignore the new `refunded` status. Since the spec adds `refunded` as a distinct status (used by stripe-webhook for charge.refunded), these transactions are invisible in KPIs.
**Fix**: Add `|| tx.status === 'refunded'` to the refunds counter.

### Issue 2: Finance status filter missing `refunded` and `failed`
**File**: `src/pages/Finance.tsx` lines 513-518
**Problem**: The status dropdown has paid/pending/needs_review/voided but not `refunded` or `failed` — both are valid `transaction_status` enum values added in migration.
**Fix**: Add two SelectItems.

### Issue 3: Pie chart legend missing Stripe method labels
**File**: `src/pages/Finance.tsx` lines 366-374
**Problem**: The `methodLabel` function used in the Overview pie chart tooltip/legend only maps cash/bank_transfer/credit_card/promptpay. If a Stripe payment exists, it shows raw enum values like `card_stripe` instead of "Stripe Card".
**Fix**: Add card_stripe and qr_promptpay_stripe to the map.

### Issue 4: Dead legacy code in `useFinance.ts`
**File**: `src/hooks/useFinance.ts` lines 89-157
**Problem**: `useTransferSlips` and `useTransferSlipStats` in this file query the `transactions` table (not `transfer_slips`). They are NOT used anywhere — Finance.tsx imports from `useTransferSlips.ts` instead. This dead code is confusing and could lead to accidental wrong imports.
**Fix**: Remove the two unused exports. No callers will break.

## Implementation Plan

### Step 1: Fix `computeFinanceStats` to include `refunded`
`src/hooks/useFinance.ts` line 81 — change condition to `tx.status === 'voided' || tx.status === 'refunded'`

### Step 2: Add missing status filter options
`src/pages/Finance.tsx` after the `voided` SelectItem — add `refunded` and `failed`

### Step 3: Add Stripe methods to pie chart legend
`src/pages/Finance.tsx` `methodLabel` function — add `card_stripe: 'Stripe Card'` and `qr_promptpay_stripe: 'Stripe PromptPay'`

### Step 4: Remove dead transfer slip code from useFinance.ts
Remove `useTransferSlips` and `useTransferSlipStats` exports (lines 89-157) — verified zero imports

### Risk: None — all fixes are additive or remove dead code. No behavior changes to existing working flows.

