

# Plan: Activate Full Stripe Integration

## Current State
- `STRIPE_SECRET_KEY` is already stored as a secret
- `STRIPE_WEBHOOK_SECRET` needs to be added
- Both edge functions exist but have Stripe SDK calls **commented out as stubs**
- No `useStripeCheckout` hook exists yet
- `config.toml` already has `verify_jwt = false` for both functions

## Steps

### 1. Store `STRIPE_WEBHOOK_SECRET`
Use the secrets tool to securely store the webhook signing secret.

### 2. Activate `stripe-create-checkout/index.ts`
Replace the stub comments with live Stripe SDK code:
- Import `Stripe` from `https://esm.sh/stripe@18.5.0`
- Create checkout session with `price_data` (THB, satang = amount × 100)
- Set `metadata`: `{ transaction_id, member_id, package_id, location_id }`
- Update `transactions.source_ref` with session ID
- Return `{ checkout_url, transaction_id, transaction_no }`
- Success/cancel URLs use the request origin + `/finance?payment=success|cancelled`

### 3. Activate `stripe-webhook/index.ts`
Replace JSON.parse stub with proper signature verification:
- Import `Stripe` from `https://esm.sh/stripe@18.5.0`
- Use `stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)`
- Return 400 on invalid signature
- All existing business logic (idempotency, tx update, billing, entitlement, activity log) stays unchanged

### 4. Create `src/hooks/useStripeCheckout.ts`
New hook that:
- Calls `supabase.functions.invoke('stripe-create-checkout', { body })` 
- Redirects to `checkout_url` on success
- Returns loading state and error handling

### 5. Wire "Pay with Stripe" in MemberDetails packages tab
Add a small "Pay with Stripe" button when viewing a member's available packages, invoking the hook.

### Files Modified/Created

| File | Action |
|---|---|
| `supabase/functions/stripe-create-checkout/index.ts` | Activate Stripe SDK (replace stub) |
| `supabase/functions/stripe-webhook/index.ts` | Activate signature verification |
| `src/hooks/useStripeCheckout.ts` | New — checkout hook |

### Risk Assessment
- **Zero regression**: Edge functions only replace commented stubs with live code
- **New hook is additive**: No existing code modified
- **Idempotency preserved**: Existing patterns unchanged

