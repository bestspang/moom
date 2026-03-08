

# Recheck: Shared Backend / API Platform Contract

## Current State Assessment

The `docs/PLATFORM_CONTRACT.md` document is already created and comprehensive. All 7 Edge Functions have been updated with the 3-origin CORS allowlist. Phase 1 of the rollout plan is marked complete.

## Issues Found During Recheck

### Issue 1: `stripe-create-checkout` error path uses static CORS
Line 209 in `stripe-create-checkout/index.ts` uses `corsHeaders` (static, defaults to `admin.moom.fit`) instead of `dynamicCors` in the catch block. If a request from `member.moom.fit` triggers an error, the browser will block the error response due to CORS mismatch.

### Issue 2: `auto-notifications` uses wildcard CORS
`auto-notifications/index.ts` line 7 uses `'Access-Control-Allow-Origin': '*'` instead of the dynamic origin matching pattern used by all other functions. While this function is system-triggered (not browser-called), it's inconsistent and could be a security concern if ever called from a browser context.

### Issue 3: `stripe-webhook` uses static CORS (acceptable)
This function is called by Stripe servers, not browsers. Static CORS is fine here. No change needed.

## Plan

### Fix 1: `stripe-create-checkout` error CORS
- Change line 209 from `corsHeaders` to `dynamicCors`
- This requires moving `dynamicCors` to be accessible in the catch block (it already is — it's defined at the top of the handler)

### Fix 2: `auto-notifications` dynamic CORS
- Replace wildcard `*` with the same dynamic CORS pattern used by other functions
- Add `ALLOWED_ORIGINS` check and `dynamicCors` computation (the `ALLOWED_ORIGINS` array is already defined but unused)

### Files to modify
- `supabase/functions/stripe-create-checkout/index.ts` — line 209: `corsHeaders` → `dynamicCors`
- `supabase/functions/auto-notifications/index.ts` — add dynamic CORS matching

### Risk
- Zero regression: CORS header fix only affects error responses; dynamic matching is identical pattern to other functions
- `auto-notifications` is system-triggered so CORS change has no functional impact, only consistency

