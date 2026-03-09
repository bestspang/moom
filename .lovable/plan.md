

# Domain-Aware Auth & Access Redesign — Implementation Plan

## Current State Analysis

### What exists today
1. **Single login page** (`/login`) — same UI on both admin.moom.fit and member.moom.fit
2. **SurfaceGuard** exists but is **disabled on lovable.app** (dev environment) — so in preview both domains look identical
3. **Google OAuth** uses `lovable.auth.signInWithOAuth("google")` — the popup opens but nothing happens after account selection (likely a redirect_uri mismatch or the `setSession` call failing silently)
4. **Auth methods**: email+password only, plus broken Google OAuth
5. **`app_role` enum**: `owner | admin | trainer | front_desk` — no `member` role
6. **`handle_new_user` trigger**: auto-creates `staff` + `user_roles(front_desk)` for every signup — this means member signups get a staff record, which is wrong
7. **No OTP support**, no identity linking, no legacy account claiming

### Root cause of "nothing different between domains"
- In lovable.app preview, `isDevEnvironment()` returns `true`, so SurfaceGuard is a no-op
- Both domains share the same `/login` route with identical UI
- No surface-aware login routing exists

### Root cause of "Google OAuth does nothing"
- The `lovable.auth.signInWithOAuth("google")` call opens a popup, user selects account, popup closes, but `result.redirected` is likely `true` (popup-based flow) so the function returns early before `setSession` is called. The page doesn't reload or respond to the auth state change.

## Problems to Solve (Prioritized)

| # | Problem | Impact | Phase |
|---|---------|--------|-------|
| 1 | Google OAuth broken | Users can't log in with Google | 1 |
| 2 | Same login page on both domains | No domain differentiation | 1 |
| 3 | Signup creates staff records for everyone | Members get admin staff records | 1 |
| 4 | No `member` role in app_role enum | Can't distinguish members from staff | 1 |
| 5 | No domain-aware post-login redirect | Admin users land on member page, members land on admin page | 1 |
| 6 | Admin domain allows signup | Security: public signup shouldn't create admin accounts | 1 |
| 7 | No email OTP login | Required for legacy users | 2 |
| 8 | No legacy account claiming | Required for migration | 2 |
| 9 | No identity linking | Users can't add Google after OTP login | 2 |
| 10 | No phone OTP | Requires Twilio integration | 3 |

## Phase 1 Implementation Plan (This Pass)

### 1. Fix Google OAuth

**Problem**: After Google popup, `result.redirected === true` causes early return. The `onAuthStateChange` listener in AuthContext should catch the session, but the flow isn't completing.

**Fix**:
- Add `console.log` diagnostics to the OAuth flow to trace the exact failure point
- Ensure `redirect_uri` is set to `window.location.origin` (current origin, which changes per domain)
- After successful OAuth, navigate based on surface (admin → `/`, member → `/member`)

**Files**: `src/pages/Auth/Login.tsx`

### 2. Add `member` to `app_role` Enum + Fix `handle_new_user` Trigger

**DB Migration**:
```sql
-- Add member role to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'member';

-- Update handle_new_user to be surface-aware
-- Members signing up should get role='member', NOT 'front_desk'
-- Staff invited via admin should keep 'front_desk'
```

**New trigger logic**: Check `raw_user_meta_data->>'signup_surface'`:
- If `'member'` → create `user_roles(member)`, do NOT create staff record
- If `'admin'` or absent → keep existing behavior (staff + front_desk)

**Files**: DB migration, `src/contexts/AuthContext.tsx` (update roleToAccessLevel map)

### 3. Create Surface-Aware Login Pages

**Admin Login** (`/login` on admin.moom.fit):
- Login only (no signup link)
- Email+password + Google
- Branding: "MOOM Admin"
- Post-login: redirect to `/` (dashboard)
- If user has no admin-capable role → show "Access Denied" message

**Member Login** (`/login` on member.moom.fit):
- Login + signup + "Claim existing account" link (Phase 2)
- Email+password + Google
- Branding: "MOOM" (friendly, mobile-first)
- Post-login: redirect to `/member`

**Implementation approach**:
- Create `src/pages/Auth/AdminLogin.tsx` — login-only, desktop-first card UI
- Create `src/pages/Auth/MemberLogin.tsx` — login + signup tabs, mobile-first
- Update `src/pages/Auth/MemberSignup.tsx` — member-specific signup (no staff record)
- In `App.tsx`, render the correct login component based on `useSurface()`:
  - Problem: `useSurface()` depends on `SurfaceProvider` which needs `detectSurface()`, but in dev everything defaults to admin
  - Solution: Make login route render a `<SurfaceAwareLogin />` wrapper that picks the right component

**Files**: 
- New: `src/pages/Auth/AdminLogin.tsx`, `src/pages/Auth/MemberLogin.tsx`, `src/pages/Auth/MemberSignup.tsx`
- Updated: `src/App.tsx` (route changes), `src/pages/Auth/Login.tsx` (becomes router)

### 4. Surface-Aware Post-Login Redirect

**AuthContext changes**:
- Add `surface` awareness to auth context
- After login, redirect based on surface:
  - Admin surface → `/`
  - Member surface → `/member`
- After login on admin, if user role is `member` only → show "no admin access" error
- After login on member, any role can access (admin users can use member features)

**ProtectedRoute changes**:
- Member routes: any authenticated user can access (no min access level needed for member surface)
- Admin routes: require `level_1_minimum` or higher (existing behavior)

**Files**: `src/contexts/AuthContext.tsx`, `src/components/auth/ProtectedRoute.tsx`, `src/apps/member/layouts/MemberLayout.tsx`

### 5. Update SurfaceGuard for Login Routes

**Current issue**: `/login` and `/signup` have `shared` affinity, so they're served on both domains. But the UI should differ.

**Fix**: Keep them as `shared` affinity but render different components based on detected surface. The `SurfaceGuard` doesn't need changes — the login page itself will be surface-aware.

### 6. Dev Environment Surface Testing

**Problem**: In lovable.app, everything defaults to admin surface.

**Enhancement**: Make `?surface=member` work for login page differentiation in dev. The `detectSurface()` already supports this. The login page wrapper just needs to read it.

## File Summary

**Create (3 files)**:
- `src/pages/Auth/AdminLogin.tsx` — admin-only login (no signup)
- `src/pages/Auth/MemberLogin.tsx` — member login with signup tab
- `src/pages/Auth/MemberSignup.tsx` — member-specific signup (passes `signup_surface: 'member'` in user metadata)

**Update (5 files)**:
- `src/pages/Auth/Login.tsx` — becomes surface-aware router that renders AdminLogin or MemberLogin
- `src/contexts/AuthContext.tsx` — add `member` to roleToAccessLevel, surface-aware redirect after login, pass `signup_surface` metadata
- `src/App.tsx` — update `/signup` route for member surface, keep `/login` as surface-aware
- `src/apps/member/layouts/MemberLayout.tsx` — allow any authenticated user (not just staff)
- `src/components/auth/ProtectedRoute.tsx` — handle `member` role (no access level needed for member routes)

**DB Migration (1)**:
- Add `member` to `app_role` enum
- Update `handle_new_user` trigger to check `signup_surface` metadata

**Zero changes to**: Admin pages, existing member pages, shared components, momentum features, Supabase client

## Risks

1. **Adding enum value** — `ALTER TYPE ADD VALUE` cannot be rolled back in a transaction. Safe but irreversible.
2. **Trigger change** — existing users won't be affected. Only new signups.
3. **Google OAuth** — may require testing with actual custom domains (not lovable.app preview) to fully validate redirect flow.

## Phase 2 (Future)
- Email OTP (magic link) login for legacy users
- Legacy account claiming flow
- Identity linking (add Google after OTP login)
- Verification state management

## Phase 3 (Future)
- Phone OTP (requires Twilio connector)
- Provisional → active account lifecycle

