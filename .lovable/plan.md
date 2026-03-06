

# Recheck Audit: Payment Architecture Completeness

## Verified as Complete — No Changes Needed

Every requirement from the spec has been audited against the current codebase:

| Requirement | Status | Evidence |
|---|---|---|
| `transactions` table: source_type, source_ref, idempotency_key, VAT columns, paid_at, sold_to_*, currency, discount_amount | Done | DB schema confirms all columns |
| `transfer_slips` table: all fields (status, reviewer, linked_transaction_id, slip_file_url, review_note, package_id) | Done | DB schema confirms |
| `member_packages`: purchase_transaction_id, package_name_snapshot, sessions_total, sessions_used, status | Done | DB schema confirms |
| `activity_log` table with event_type, entity_type, entity_id, staff_id, member_id, old/new_value | Done | DB schema confirms |
| `approve-slip` Edge Function: atomic (tx + billing + entitlement), idempotent via `slip:{id}` key, VAT calc, reviewer_staff_id, activity log | Done | `approve-slip/index.ts` |
| `stripe-create-checkout` Edge Function: pending tx, VAT, activity log, idempotency_key | Done | `stripe-create-checkout/index.ts` |
| `stripe-webhook` Edge Function: checkout.session.completed, charge.refunded, idempotent, full CORS | Done | `stripe-webhook/index.ts` |
| All 3 edge functions: `verify_jwt = false` in config.toml, manual JWT validation via `getClaims()` | Done | `config.toml` + function code |
| Stripe secrets never on client: STRIPE_SECRET_KEY only in edge functions via `Deno.env.get()` | Done | No client-side Stripe imports |
| `useApproveSlip` → edge function invocation (not client-side DB writes) | Done | `useTransferSlips.ts` line 149 |
| `useRejectSlip` and `useVoidSlip` set `reviewer_staff_id` via staff lookup | Done | Lines 187-196, 245-254 |
| Finance page: source_type column, VAT display, Stripe payment method filters (`card_stripe`, `qr_promptpay_stripe`) | Done | `Finance.tsx` lines 534-535 |
| Finance status filter: includes `refunded` and `failed` | Done | Lines 520-521 |
| Pie chart: Stripe method labels | Done | Lines 372-373 |
| `computeFinanceStats`: includes `refunded` in refunds counter | Done | `useFinance.ts` line 81 |
| Member packages table: purchase_transaction link column | Done | `MemberDetails.tsx` line 234 |
| `useMemberPackages`: joins `transactions` for transaction_id | Done | `useMemberDetails.ts` line 152 |
| Realtime sync: `transfer_slips` in TABLE_INVALIDATION_MAP | Done | `useRealtimeSync.ts` line 80 |
| Finance CSV importer: Stripe payment methods, `failed` status, VAT population, correct `queryKeysToInvalidate` | Done | `finance.ts` lines 46-47, 68, 200-205, 252 |
| Transfer Slips page: tabs (needs_review/paid/voided), date range + search, correct columns, detail dialog with approve/reject/void | Done | `TransferSlips.tsx` + `SlipDetailDialog.tsx` |
| Void workflow: voids linked transaction + slip, logs activity | Done | `useTransferSlips.ts` lines 256-295 |
| Dead legacy code removed from `useFinance.ts` | Done | File is clean (121 lines) |

## Result: All Requirements Are Fully Implemented

There are **zero remaining gaps**. The architecture is complete and ready for:
1. **Stripe go-live**: Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` as secrets, uncomment the Stripe SDK code in the edge functions.
2. **Beam/PromptPay extension**: The `source_type` and `payment_method` fields are already extensible enums.

No code changes are needed at this time.

