# Recheck: Member Self-Serve Payment

## Acceptance criteria — status

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Card checkout end-to-end, member_packages created, activity_log written | ✅ Pass | `stripe-webhook` calls `process_stripe_payment` RPC atomically (transaction + member_package + billing + audit) |
| 2 | PromptPay option creates Stripe session containing `promptpay` | ✅ Pass | `useMemberStripeCheckout` passes `['promptpay','card']`; edge function validates + forwards to `stripe.checkout.sessions.create` |
| 3 | Replayed webhook does not double-fulfill | ✅ Pass | Guard in `fulfillCheckoutSession`: early-return when `tx.status === 'paid'`; RPC also idempotent |
| 4 | Slip upload path unchanged | ✅ Pass | `transfer` branch of `handlePurchase` still routes to `/member/upload-slip`; `member_upload_slip` RPC untouched |

## Task compliance — deviations

**A. Host resolution not using `hostname.ts`**
`stripe-create-checkout` hardcodes `admin.moom.fit → member.moom.fit` swap. Task asked for the same host-resolution approach as `src/apps/shared/hostname.ts`. Current logic works for the 3 known origins but is brittle. Low priority — fix if we ever add a new host.

**B. Success URL differs from spec**
Spec said `/member/packages?payment=success|cancelled`. Implementation redirects to `/member/packages/{id}/purchase?payment=success|cancelled`. This is actually better because `MemberPurchasePage` owns the `?payment=` handler (shows success state, invalidates queries). No fix needed unless we want the spec's exact path.

**C. Query keys not centralized**
`useMemberStripeCheckout` doesn't declare a query key (it's an invoke, not a query) — OK. But `MemberPurchasePage` invalidates `['available-packages']` and `['member-packages', memberId]` inline instead of via `src/lib/queryKeys.ts`. Minor CLAUDE.md convention gap.

## Recommendation

No functional bugs. The three deviations are cosmetic/convention. Recommend a small follow-up PR:

1. Move the inline query keys in `MemberPurchasePage` and `useMemberStripeCheckout` into `src/lib/queryKeys.ts`.
2. Optionally centralize the admin→member host swap into `src/apps/shared/hostname.ts` (exported `getSurfaceHostForRequest(origin, surface)`) and reuse in the edge function via a small inline copy (edge functions can't import from `src/`).

Say the word and I'll ship the follow-up. Otherwise, the feature is production-ready as delivered.
