

# Root Cause Analysis: Google Login + Cross-Surface Session Issues on Custom Domains

## Problem 1: Google login fails on member.moom.fit

**Root cause**: `MemberLogin.tsx` uses `lovable.auth.signInWithOAuth("google")` which routes through the Lovable auth-bridge. The bridge redirects back to the **published URL** (`moom.lovable.app`), not the custom domain (`member.moom.fit`). The user ends up on the wrong domain after Google auth completes.

**Fix**: Detect custom domains and bypass the auth-bridge by using `supabase.auth.signInWithOAuth` directly with `skipBrowserRedirect: true`, then manually redirect to the Google OAuth URL. This ensures the callback returns to `member.moom.fit`.

Same fix needed in `AdminLogin.tsx` for `admin.moom.fit`.

## Problem 2: Switching admin → member requires re-login

**Root cause**: `admin.moom.fit` and `member.moom.fit` are different origins. Supabase stores the session in `localStorage`, which is per-origin. When the user clicks "Member App" from the admin header, they land on `member.moom.fit` with an empty localStorage → `MemberLayout` sees no user → redirects to `/login`.

**Fix**: When building cross-surface navigation URLs, append the current session tokens as URL hash parameters. On app initialization, check for these hash tokens and call `supabase.auth.setSession()` to restore the session on the new domain.

## Implementation Plan

### Step 1: Create a custom-domain detection helper
Add `isCustomDomain()` to `src/apps/shared/hostname.ts` — returns `true` when hostname is `*.moom.fit` (not `*.lovable.app` or `localhost`).

### Step 2: Fix Google OAuth on custom domains
In both `MemberLogin.tsx` and `AdminLogin.tsx`:
- If on a custom domain: use `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/login', skipBrowserRedirect: true } })`, then manually redirect to the returned URL.
- If on lovable.app/localhost: keep using `lovable.auth.signInWithOAuth` (existing behavior).

### Step 3: Add session transfer for cross-surface navigation
**New file**: `src/apps/shared/sessionTransfer.ts`
- `buildSessionTransferUrl(targetUrl: string)`: Gets current session, appends `access_token` + `refresh_token` as URL hash fragment (not query params — hash fragments are never sent to servers).
- `consumeSessionFromUrl()`: Checks `window.location.hash` for session tokens, calls `supabase.auth.setSession()`, then clears the hash.

### Step 4: Wire session transfer into cross-surface links
- Update `buildCrossSurfaceUrl` calls in `Header.tsx` and `MemberHeader.tsx` to use the session-transfer URL builder (only in production, not dev).
- Or: create a click handler that builds the URL with session tokens before navigating.

### Step 5: Consume transferred session on app init
In `AuthContext.tsx`, call `consumeSessionFromUrl()` before `getSession()` so the transferred tokens are set before the auth state listener fires.

### Files to modify
| File | Change |
|------|--------|
| `src/apps/shared/hostname.ts` | Add `isCustomDomain()` helper |
| `src/apps/shared/sessionTransfer.ts` | **New** — session token transfer utilities |
| `src/pages/Auth/MemberLogin.tsx` | Custom domain Google OAuth bypass |
| `src/pages/Auth/AdminLogin.tsx` | Custom domain Google OAuth bypass |
| `src/contexts/AuthContext.tsx` | Call `consumeSessionFromUrl()` on init |
| `src/components/layout/Header.tsx` | Wrap cross-surface links with session transfer |
| `src/apps/member/components/MemberHeader.tsx` | Wrap cross-surface links with session transfer |
| `src/apps/trainer/pages/TrainerProfilePage.tsx` | Wrap cross-surface links with session transfer |

### Risk Assessment
- **Google OAuth fix**: Low risk — only changes behavior on custom domains, lovable.app flow untouched.
- **Session transfer**: Medium risk — tokens in URL hash are transient (cleared immediately after consumption), but we must ensure hash is cleaned up promptly. The hash fragment is never sent to servers, making it safer than query params.
- **No existing behavior changes**: Dev/preview environment continues using `lovable.auth` as before.

### Security Considerations
- Hash fragments are client-side only (not sent in HTTP requests).
- Tokens are consumed and hash is cleared immediately on page load.
- Only used between known `*.moom.fit` domains (validated by `isCustomDomain()`).
- Supabase refresh tokens are single-use, limiting replay risk.

