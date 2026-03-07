

# Payment Flow for Package Purchase

## Current State
The `PurchasePackageDialog` currently selects a package and immediately inserts a `member_packages` row with status `ready_to_use` — no payment step, no transaction record. This skips the entire billing flow.

## Proposed Flow (Multi-Step Dialog)
Transform the dialog into a 3-step wizard:

```text
Step 1: Select Package (existing)
   ↓
Step 2: Payment Details
   - Choose payment method (cash, bank_transfer, credit_card, qr_promptpay)
   - Select location (where the sale happens)
   - Optional: notes
   ↓
Step 3: Summary & Confirm
   - Package name, price, VAT breakdown
   - Member name
   - Payment method, location
   - "Confirm Purchase" button
```

## What Happens on Confirm

**For cash / bank_transfer / qr_promptpay:**
1. Create a `transactions` record (status: `paid`, payment_method chosen, amount from package price, VAT computed)
2. Insert `member_packages` row (status: `ready_to_use`)
3. Log activity
4. Show success toast, close dialog

**For card_stripe (future):**
- Call `stripe-create-checkout` edge function (already exists)
- Insert `member_packages` with status `pending` (webhook activates it)
- For now, Stripe is staged/not live, so this option will show "Coming soon"

## Files to Create/Modify

| File | Change |
|------|--------|
| `src/components/members/PurchasePackageDialog.tsx` | Rewrite as 3-step wizard with payment method selection and summary |
| `src/hooks/useMemberDetails.ts` | Update `useAssignPackageToMember` to also create a `transactions` record (or create a new `usePurchasePackage` mutation that does both atomically) |
| `src/i18n/locales/en.ts` | Add keys: `members.selectPaymentMethod`, `members.purchaseSummary`, `members.paymentNotes`, `finance.cash`, `finance.bankTransfer`, `finance.creditCard`, `finance.qrPromptpay`, `members.totalWithVat`, `members.confirmPurchase` |
| `src/i18n/locales/th.ts` | Same keys in Thai |

## Technical Details

### Transaction Creation
The mutation will:
1. Generate transaction_id via `supabase.rpc('next_transaction_number')`
2. Compute VAT (7%): `amount_ex_vat = price / 1.07`, `amount_vat = price - amount_ex_vat`
3. Insert into `transactions` with member_id, package_id, payment_method, location_id, status `paid`, source_type `pos`
4. Insert into `member_packages` with status `ready_to_use`
5. Invalidate `['member-packages']`, `['finance-transactions']`, `['members']`

### Payment Method Options
From existing enum: `cash`, `bank_transfer`, `credit_card`, `qr_promptpay`, `card_stripe` (disabled/coming soon), `other`

### UI Design (Step 2 - Payment)
- Radio group for payment methods with icons
- Location dropdown (from `useLocations`)
- Optional notes textarea

### UI Design (Step 3 - Summary)
- Card with package details (name, type, sessions, term)
- Price breakdown (gross, VAT, total)
- Member name, payment method label, location
- Back button + Confirm Purchase button

## Risk
- **Low**: Additive change — the old "direct assign" path is replaced with assign + transaction
- Existing `useAssignPackageToMember` callers: only `PurchasePackageDialog` uses it
- `transactions` table and `member_packages` table already exist with correct schema

