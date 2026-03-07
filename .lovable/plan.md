

# Plan: Connect Stripe End-to-End

## Current State

The edge functions `stripe-create-checkout` and `stripe-webhook` already exist with complete business logic (pending tx creation, VAT calc, webhook handling for `checkout.session.completed` and `charge.refunded`, member_package entitlement, billing, activity log). However, the Stripe SDK calls are **commented out as stubs** — the functions create DB records but never actually call Stripe.

No `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` secrets exist yet.

## Implementation Plan

### Step 1: Enable Stripe via Lovable's built-in integration

Use the `stripe--enable` tool to prompt you for your Stripe secret key. This will securely store `STRIPE_SECRET_KEY` as a secret accessible from edge functions.

### Step 2: Add `STRIPE_WEBHOOK_SECRET` secret

After Stripe is enabled, request you to add the webhook signing secret separately.

### Step 3: Activate Stripe SDK in `stripe-create-checkout/index.ts`

Replace the stub comments with live Stripe code:

- Import `Stripe` from `https://esm.sh/stripe@17`
- Create checkout session with `line_items`, `metadata` (transaction_id, member_id, package_id, location_id), success/cancel URLs
- Update `transactions.source_ref` with the session ID
- Return `{ checkout_url, transaction_id, transaction_no }`

Key details:
- `unit_amount` = `amountGross * 100` (Stripe uses satang for THB)
- `currency: 'thb'`
- Success/cancel URLs fallback to `SUPABASE_URL` origin + `/finance?payment=success|cancelled`

### Step 4: Activate signature verification in `stripe-webhook/index.ts`

Replace the JSON.parse stub with proper Stripe signature verification:

- Import `Stripe` from `https://esm.sh/stripe@17`
- Use `stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)`
- Return 400 on invalid signature
- Keep all existing business logic (idempotency, tx update, billing, entitlement, activity log) unchanged

### Step 5: Add client-side hook `useStripeCheckout`

Create a small hook that calls the edge function and redirects:

```typescript
// src/hooks/useStripeCheckout.ts
const createCheckout = async ({ member_id, package_id, location_id }) => {
  const { data } = await supabase.functions.invoke('stripe-create-checkout', {
    body: { member_id, package_id, location_id }
  });
  if (data?.checkout_url) window.location.href = data.checkout_url;
};
```

### Step 6: Wire "Pay with Stripe" in package purchase UI

Add a "Pay with Stripe" button in the relevant purchase flow (e.g., MemberDetails package section or a purchase dialog) that invokes the hook above.

### Step 7: Settings page — wire "Setup Stripe" buttons

The buttons in `SettingsGeneral.tsx` (lines 157-159, 181-183) currently do nothing. Wire them to open a dialog/panel that:
- Shows the Stripe publishable key (read from `settings` table, section `general`, key `stripe_publishable_key`)
- Provides instructions for webhook URL: `https://qedxqilmnkbjncpnopty.supabase.co/functions/v1/stripe-webhook`
- Shows connection status based on whether the key is saved

No secret keys are shown in the UI — only the publishable key and webhook URL for configuration guidance.

### No DB migrations needed

All required tables and columns already exist (`transactions`, `member_packages`, `member_billing`, `activity_log`).

### Risk: Zero regressions

- Edge function changes only replace commented stubs with live code
- The new hook is additive (new file)
- Settings UI changes are isolated to the existing stub buttons
- No existing behavior is modified

### Files to create/modify

| File | Action |
|---|---|
| `supabase/functions/stripe-create-checkout/index.ts` | Uncomment + activate Stripe SDK |
| `supabase/functions/stripe-webhook/index.ts` | Activate signature verification |
| `src/hooks/useStripeCheckout.ts` | New — hook to invoke checkout |
| `src/pages/settings/SettingsGeneral.tsx` | Wire "Setup Stripe" buttons |
| `src/i18n/locales/en.ts` | Add Stripe settings labels if needed |
| `src/i18n/locales/th.ts` | Add Stripe settings labels if needed |

