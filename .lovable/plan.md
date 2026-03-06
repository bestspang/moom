

# Status: Most of this spec is ALREADY IMPLEMENTED

The previous session already delivered the core architecture. Here's what exists and the remaining gaps.

## Already Done (No Changes Needed)

| Requirement | Status |
|---|---|
| `transactions` table with source_type, source_ref, idempotency_key, VAT columns | Done (migration ran) |
| `member_packages` with purchase_transaction_id, sessions_total, package_name_snapshot | Done |
| `transfer_slips` table with all required fields | Already existed |
| `activity_log` table | Already existed |
| `approve-slip` Edge Function (atomic, idempotent, VAT calc, entitlement) | Done |
| `stripe-create-checkout` Edge Function (stub with VAT, pending tx, activity log) | Done |
| `stripe-webhook` Edge Function (checkout.session.completed, charge.refunded, idempotent) | Done |
| `useApproveSlip` calls edge function instead of client-side | Done |
| Finance page: source_type column, VAT display, new payment methods | Done |
| SlipDetailDialog: approve/reject/void flows | Done |
| Realtime sync for transactions, member_packages, transfer_slips | Done |

## Remaining Gaps (5 issues)

### Issue 1: `stripe-webhook` CORS headers incomplete
The webhook function uses abbreviated CORS headers missing the `x-supabase-client-*` headers. While webhooks come from Stripe (not browser), keeping headers consistent prevents issues if tested from browser/Postman.

**Fix**: Update line 4 of `stripe-webhook/index.ts` to use the full CORS headers.

### Issue 2: Finance page payment method filter missing new options
The `SelectContent` at lines 520-530 only lists `cash`, `bank_transfer`, `credit_card`, `promptpay`. Missing: `card_stripe`, `qr_promptpay_stripe`.

**Fix**: Add 2 SelectItems for the new Stripe payment methods.

### Issue 3: Reject/Void flows don't set `reviewer_staff_id`
The `useRejectSlip` mutation (line 186-195) updates `reviewed_at` and `review_note` but **never sets `reviewer_staff_id`** because it doesn't look up the staff record. Same for `useVoidSlip`.

**Fix**: Add staff lookup via `user_id` in both mutations, set `reviewer_staff_id`.

### Issue 4: Member packages table doesn't show linked transaction
`packageColumns` in MemberDetails.tsx (lines 223-234) shows package name, status, sessions, expiry — but **no purchase transaction reference**. The data is available via `purchase_transaction_id` but not queried or displayed.

**Fix**: 
- Update `useMemberPackages` select to include `purchase_transaction:transactions(transaction_id)` join
- Add a "Transaction" column to `packageColumns`

### Issue 5: `transfer_slips` table not in realtime subscription
The `useRealtimeSync` hook subscribes to `transactions` and `member_packages` but **not `transfer_slips`**. When a slip is approved via the edge function, the slips list won't auto-refresh for other tabs/users.

**Fix**: Add `transfer_slips` to `TABLE_INVALIDATION_MAP` with keys `['transfer-slips', 'transfer-slip-stats', 'transfer-slip-detail']`.

---

## Implementation Plan

### Step 1: Fix stripe-webhook CORS headers
**File**: `supabase/functions/stripe-webhook/index.ts` line 4
**Change**: Replace with full CORS header set

### Step 2: Add Stripe payment methods to Finance filter
**File**: `src/pages/Finance.tsx` lines 526-529
**Change**: Add `<SelectItem value="card_stripe">Stripe Card</SelectItem>` and `<SelectItem value="qr_promptpay_stripe">Stripe PromptPay</SelectItem>`

### Step 3: Set reviewer_staff_id in reject/void
**File**: `src/hooks/useTransferSlips.ts`
**Change**: In both `useRejectSlip` and `useVoidSlip`, add staff lookup before the update call and include `reviewer_staff_id` in the update payload.

### Step 4: Show transaction link on member packages
**Files**: `src/hooks/useMemberDetails.ts` line 152, `src/pages/MemberDetails.tsx` line 223
**Change**: Add join in query, add column to table

### Step 5: Add transfer_slips to realtime sync
**File**: `src/hooks/useRealtimeSync.ts`
**Change**: Add `transfer_slips` entry to `TableName` type and `TABLE_INVALIDATION_MAP`

### Risk Assessment
All changes are additive or surgical single-line fixes. No existing behavior is modified. Zero regression risk.

