

# Domain-Aware Auth Redesign — Recheck & Continue

## Current State Assessment

### What's Already Built (Phase 1 — Previous Pass)
1. **Surface-aware Login router** (`Login.tsx`) — renders `AdminLogin` or `MemberLogin` based on `detectSurface()`
2. **AdminLogin.tsx** — login-only (no signup link), "MOOM Admin" branding
3. **MemberLogin.tsx** — login + signup link, Google-first, "MOOM" branding
4. **MemberSignup.tsx** — passes `signup_surface: 'member'` metadata
5. **DB: `member` role** added to `app_role` enum
6. **DB: `handle_new_user` trigger** — surface-aware (member signup → `member` role, no staff record)
7. **DB: `has_min_access_level` / `get_user_access_level`** — handles `member` role

### Critical Issues Found

**Issue 1: Google OAuth "does nothing" after account selection**

The `lovable.auth.signInWithOAuth("google")` opens a popup/redirect. After the user selects an account:
- If `result.redirected === true`, the code returns early without calling `setSession` — this is by design for redirect flows
- The `onAuthStateChange` listener in AuthContext should pick up the new session on page reload
- **Root cause**: After OAuth redirect back to origin, the user likely lands on `/` (root), which is a `ProtectedRoute`. Since auth state isn't loaded yet, they get redirected to `/login`. But by the time the login page loads, `onAuthStateChange` fires, sets user, and Login.tsx's `useEffect` should redirect. There may be a timing race, OR the redirect_uri isn't being handled correctly by the Lovable Cloud auth library.
- **Fix**: Add `prompt: "select_account"` to force the account chooser. More importantly, add console diagnostics to the OAuth callback flow, and ensure the `onAuthStateChange` handler in AuthContext properly navigates after OAuth return. Also verify the `redirect_uri` is correct for both custom domains.

**Issue 2: "Nothing different between admin.moom.fit and member.moom.fit"**

- In the lovable.app preview, `isDevEnvironment()` returns `true`, so SurfaceGuard is disabled and `detectSurface()` defaults to `admin`
- On actual production domains (admin.moom.fit / member.moom.fit), the login pages WOULD differ — but the user may be testing in preview
- **Fix**: The Login.tsx router already works correctly. We need to ensure it's testable in preview via `?surface=member`. Currently `detectSurface()` supports `?surface=` override, so navigating to `/login?surface=member` should show MemberLogin. This needs to be communicated or made more discoverable.

**Issue 3: `fetchUserRoleAndStatus` uses `.single()` for role lookup**

Line 51-55 of AuthContext uses `.single()` which throws PGRST116 if no row exists. For new OAuth users whose trigger hasn't fired yet, this will fail silently and leave `role` as `null`.
- **Fix**: Change to `.maybeSingle()` (per memory: security/auth-lookup-resilience)

### What's NOT Built Yet (Sections 4-8 of the Original Request)

| Section | Status | Priority |
|---------|--------|----------|
| 4 — Legacy account claim flow | Not started | Phase 2 |
| 5 — Identity/verification model | Not started | Phase 2 |
| 6 — OTP login (email/phone) | Not started | Phase 2-3 |
| 7 — Onboarding/verification states | Not started | Phase 2 |
| 8 — Full implementation plan | Partially done | This pass |

## Implementation Plan (This Pass — Fix Critical Issues)

### Task 1: Fix Google OAuth Flow

**Files**: `src/pages/Auth/AdminLogin.tsx`, `src/pages/Auth/MemberLogin.tsx`, `src/pages/Auth/MemberSignup.tsx`

Changes:
- Add `prompt: "select_account"` to `extraParams` in Google OAuth calls
- After `lovable.auth.signInWithOAuth` returns, if `result.redirected` is true, do nothing (browser will redirect). If result has no error and no redirect, the `setSession` was called by the lovable module — trigger a page reload or navigate to the correct surface route
- Add a small delay/check after OAuth to handle the popup-close scenario where `onAuthStateChange` fires asynchronously

### Task 2: Fix AuthContext Role Lookup

**File**: `src/contexts/AuthContext.tsx`

Changes:
- Change `.single()` to `.maybeSingle()` on the `user_roles` query (line 55)
- Handle `null` roleData gracefully (default to `member` role for users with no explicit role)

### Task 3: Handle Post-OAuth Redirect in Login.tsx

**File**: `src/pages/Auth/Login.tsx`

The current `useEffect` depends on `role` being loaded, but after OAuth redirect, `role` may be null initially while `fetchUserRoleAndStatus` runs asynchronously.

Changes:
- If `user` is truthy but `role` is still null, show a loading spinner instead of rendering the login form
- Once `role` loads, redirect appropriately

### Task 4: Add Google OAuth Signup Surface Metadata

**Problem**: When a user signs up via Google OAuth on member.moom.fit, the `handle_new_user` trigger checks `raw_user_meta_data->>'signup_surface'`. But Google OAuth doesn't pass this metadata — it's only set during email/password signup via `signUp()`.

**Fix**: The `handle_new_user` trigger defaults to `'admin'` when `signup_surface` is missing. For Google OAuth signups on member surface, we can't inject metadata into the OAuth flow. Instead, update the trigger to also check the provider: if provider is `google` and no `signup_surface` is set, default to `'member'` (since admin staff are typically invited, not self-signup via Google).

OR — better approach: After Google OAuth success on member surface, check if user has no role yet, then insert `member` role via an edge function or RPC call.

**Recommended**: Update `handle_new_user` trigger — if `signup_surface` is not set AND provider is NOT `email`, default to `member` role (safer default). Admin staff are always created via invite or admin-surface email signup.

### Task 5: Ensure SurfaceGuard Allows Login Routes

**File**: `src/apps/shared/SurfaceGuard.tsx`

Currently login routes have `shared` affinity in `getRouteHostAffinity()`, which means they're served on both domains. This is correct. No change needed.

### Task 6: Add member.moom.fit to Edge Function CORS

Per memory: `security/shared-backend-platform`, CORS allows `admin.moom.fit`, `member.moom.fit`, and `moom.lovable.app`. This is already configured. No change needed.

## Summary of Changes

| File | Change |
|------|--------|
| `src/pages/Auth/AdminLogin.tsx` | Add `prompt: "select_account"` to Google OAuth params |
| `src/pages/Auth/MemberLogin.tsx` | Add `prompt: "select_account"` to Google OAuth params |
| `src/pages/Auth/MemberSignup.tsx` | Add `prompt: "select_account"` to Google OAuth params |
| `src/contexts/AuthContext.tsx` | Fix `.single()` → `.maybeSingle()` for role query; handle null role |
| `src/pages/Auth/Login.tsx` | Show loading while role is being fetched post-OAuth; improve redirect logic |
| DB migration | Update `handle_new_user` trigger default: if no `signup_surface` AND provider != `email`, default to `member` |

## Risks
- Google OAuth behavior depends on the Lovable Cloud auth library internals (`@lovable.dev/cloud-auth-js`). If the popup flow returns `redirected: true` unexpectedly, we can't fix it from our side.
- The trigger default change (non-email providers → member) is safe because admin staff are always invited via email or created manually.

## What's Deferred (Phase 2+)
- Email OTP / Magic Link login
- Phone OTP (needs Twilio)
- Legacy account claiming flow
- Identity linking (add Google/password after first login)
- Verification states and onboarding flow
- Admin shortcuts in member surface

