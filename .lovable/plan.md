
## Goal
Let a logged-in member self-purchase a package via Stripe (card + PromptPay) end-to-end, reusing the existing `stripe-create-checkout` + `stripe-webhook` fulfillment path. Keep the transfer/slip flow unchanged.

## Affected modules (status)
- `supabase/functions/stripe-create-checkout/index.ts` — WORKING for admin. Extend, preserve staff behavior.
- `supabase/functions/stripe-webhook/index.ts` — WORKING; fulfillment is already idempotent on `transactions.status='paid'` and guarded on session id via `process_stripe_payment` RPC. Add member surface hooks only.
- `src/apps/member/pages/MemberPurchasePage.tsx` — enable card + promptpay branches.
- New: `src/hooks/useMemberStripeCheckout.ts`
- `src/lib/queryKeys.ts` — add `memberStripeCheckout` key namespace.
- `src/i18n/locales/{en,th}.ts` — new strings.
- No RLS, no `create_booking_safe`, no slip approval changes.

## Design decisions

### 1. `stripe-create-checkout` — dual-surface authorization
Currently gated by `has_min_access_level('level_3_manager')`. Split the authz:

- Parse body first: `{ member_id, package_id, location_id?, nonce?, payment_method_types?, surface? }`.
- If `surface === 'member'`: require that the caller's `user.id` resolves (via `identity_map` verified member OR `line_users.member_id`) to the same `member_id` in the body. Reject otherwise. `staff_id` on the transaction stays `null`; `source_type` becomes `stripe_member`.
- Else (default / `surface === 'admin'`): keep the existing `level_3_manager` check.

### 2. `stripe-create-checkout` — payment methods + URLs
- `payment_method_types`: accept optional array. Validate against `['card','promptpay']`. Default `['card']`. Reject anything else. `promptpay` only when `currency = 'thb'` (always true here).
- Pass `payment_method_types` to `stripe.checkout.sessions.create`.
- Metadata: add `surface` and keep `member_id`.
- Success/cancel URLs:
  - Admin surface → existing `${origin}/finance?payment=success|cancelled` (origin from request whitelist, unchanged).
  - Member surface → derive member base host from the request origin using the same allowlist logic already in the file: if request origin is `https://member.moom.fit` use it; if it's `https://admin.moom.fit` swap to `https://member.moom.fit`; for `moom.lovable.app` (preview) keep origin (SPA routes handle `/member/...`). Then `${memberBase}/member/packages?payment=success|cancelled`. No hardcoded host outside the existing `ALLOWED_ORIGINS` list.

### 3. `stripe-webhook` — member surface path
Fulfillment already:
- Uses `process_stripe_payment` RPC (atomic tx paid + member_billing + member_package + activity log).
- Is idempotent: early-returns when `transactions.status === 'paid'`; RPC also keyed on `p_stripe_session_id`.
- Fires `package_purchase` gamification event with `idempotency_key = purchase:${tx.id}`.

Changes:
- After successful `fulfillCheckoutSession`, if `session.metadata.surface === 'member'` AND the `line_push_outbox` table exists in the schema (defensive `try/catch` insert; the current DB has no such table, so this is a no-op today and safe when the table is later added), enqueue a `payment_success` row `{ member_id, template: 'payment_success', payload: { transaction_id, package_name, amount } }`. Wrap in try/catch so a missing table never blocks fulfillment.
- No duplication risk: idempotency guard is unchanged.

### 4. Frontend

`src/hooks/useMemberStripeCheckout.ts`:
```ts
export function useMemberStripeCheckout() {
  const { memberId } = useMemberSession();
  const [isLoading, setLoading] = useState(false);
  const start = async (packageId: string, method: 'card'|'promptpay') => {
    // nonce + supabase.functions.invoke('stripe-create-checkout', {
    //   body: { member_id: memberId, package_id: packageId, surface: 'member',
    //           payment_method_types: method === 'promptpay' ? ['card','promptpay'] : ['card'],
    //           nonce }
    // })
    // window.location.href = data.checkout_url  (same tab — member is on mobile)
  };
  return { start, isLoading };
}
```
Query-key namespace added to `queryKeys.ts`: `memberStripeCheckout: ['member','stripe-checkout'] as const` (used only for potential future cache tagging; mutation itself has no key).

`MemberPurchasePage.tsx`:
- `PAYMENT_METHODS`: `transfer` (enabled), `promptpay` (enabled), `card` (enabled).
- `handlePurchase`:
  - `transfer` → existing navigate to `/member/upload-slip`.
  - `card` / `promptpay` → `start(id, method)`.
- Read `?payment=success|cancelled` on mount:
  - `success` → set `step='success'`, invalidate `queryKeys.member.packages` (and `available-packages`), `toast.success`.
  - `cancelled` → `toast.error(t('member.paymentCancelled'))`, stay on review step.
- Add `logActivity({ event_type: 'member.stripe_checkout_initiated', ... })` in the hook `onSuccess`.

### 5. i18n keys (both `en.ts` and `th.ts`)
`member.payWithCard`, `member.payWithPromptPay`, `member.redirectingToStripe`, `member.paymentSuccessTitle`, `member.paymentSuccessDesc`, `member.paymentCancelled`, `member.paymentFailed`.

## What is preserved
- Admin sell-package via Stripe (unchanged code path, unchanged authz).
- Slip upload → `approve-slip` flow.
- `process_stripe_payment` RPC and all RLS.
- Webhook idempotency on replayed events.

## Implementation order
1. Edit `stripe-create-checkout` (authz split + payment_method_types + member URLs + metadata).
2. Edit `stripe-webhook` (defensive `line_push_outbox` enqueue on member surface).
3. Add `queryKeys.ts` entry + `useMemberStripeCheckout.ts`.
4. Wire `MemberPurchasePage.tsx` (enable methods, handler, redirect-return handling).
5. i18n en + th.
6. DEVLOG entry.

## Regression checklist
- Admin sell-package Stripe checkout still works (staff_id set, redirects to `/finance?payment=...`).
- Member card checkout completes → `member_packages` row created, `activity_log` row present, no duplicate on webhook replay.
- Member PromptPay session shows `promptpay` in Stripe test dashboard payment methods.
- Member cancel returns to `/member/packages?payment=cancelled` with toast, no pending duplicate.
- Slip upload path renders identically and reaches `/member/upload-slip`.
- No RLS/policy migration; typecheck via `bun run build` clean.
