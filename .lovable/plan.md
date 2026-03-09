

# Phase 3: Remaining Auth Sections — Recheck & Plan

## Current State Assessment

All critical infrastructure is built and working:

| Section | Status | Notes |
|---------|--------|-------|
| 1 — Domain-aware auth | **Done** | SurfaceGuard, hostname detection, Login router |
| 2 — Role-aware access | **Done** | ProtectedRoute, allRoles, roleToAccessLevel, access levels |
| 3 — Login/signup UX | **Done** | AdminLogin (no signup), MemberLogin (Google + password + OTP), MemberSignup |
| 4 — Legacy account claim | **Done** | handle_new_user trigger auto-links by email match |
| 5 — Identity/verification | **Not started** | No linking UI, no verification states |
| 6 — Supabase auth impl | **Done** | Google OAuth, email OTP, trigger, diagnostics |
| 7 — UX/UI deliverables | **Partially done** | Missing: onboarding states, admin switch, signup route guard |
| 8 — Implementation plan | **Meta** | Tracking document |

## Issues Found

### Issue 1: `/signup` accessible on admin surface
The `/signup` route renders `MemberSignup` on ALL surfaces. On admin.moom.fit (production), SurfaceGuard would let it through because `/signup` has `shared` affinity via the login/shared prefixes. But the requirement says admin domain should NOT allow public signup.

**Fix**: Add `/signup` route guard — if surface is `admin`, redirect to `/login`.

### Issue 2: No admin-switch shortcut for multi-role users on member surface
Business requirement #7: "member app may show limited admin shortcuts for admin users." Currently `allRoles` is exposed in AuthContext but nothing uses it in the member surface.

**Fix (minimal)**: Add a small "Admin Portal" link in the member profile page when the user has admin/owner role. This links to `admin.moom.fit` (or `/` in dev).

### Issue 3: Identity linking UI (Section 5)
No UI exists for users to add Google or password after initial login. This requires:
- A settings/security section in the member profile
- Calls to `supabase.auth.linkIdentity()` or `supabase.auth.updateUser()` for password

**Recommendation**: Defer full identity linking UI to Phase 4. For now, document the design and add a placeholder.

### Issue 4: Verification model (Section 5)
Requirement #9: "every account must verify at least one primary contact method." Currently:
- Email/password signup requires email confirmation (Lovable Cloud default)
- Google OAuth users have verified email by default
- OTP users have verified email by definition

No additional verification enforcement is needed for current flows. The requirement is naturally satisfied.

## Implementation Plan (This Pass)

### Task 1: Guard `/signup` on admin surface

**File**: `src/App.tsx`

Wrap the `/signup` route with a component that checks surface. If admin surface, redirect to `/login`.

### Task 2: Admin switch link in member profile

**File**: `src/apps/member/pages/MemberProfilePage.tsx`

Add a conditional "Go to Admin Portal" button/link when `allRoles` includes `admin`, `owner`, `trainer`, `freelance_trainer`, or `front_desk`. Links to `admin.moom.fit` in production, `/?surface=admin` in dev.

### Task 3: Enhance diagnostics auth page

**File**: `src/pages/Auth/DiagnosticsAuthPage.tsx`

Add:
- Provider identities list (from `user.identities`)
- Auth methods available
- Redirect result preview (using `getRedirectResult`)

### Task 4: Document remaining Phase 4 items

No code change — just noting what's deferred:
- Identity linking UI (add Google/password to existing account)
- Phone OTP (requires Twilio)
- Onboarding wizard for new members (first-time-user experience)

## Files to Change

| File | Change |
|------|--------|
| `src/App.tsx` | Add surface guard wrapper for `/signup` route |
| `src/apps/member/pages/MemberProfilePage.tsx` | Add admin switch link for multi-role users |
| `src/pages/Auth/DiagnosticsAuthPage.tsx` | Add provider identities section |

## Zero Changes To
- AuthContext, AdminLogin, MemberLogin, MemberSignup, ProtectedRoute, SurfaceGuard, hostname detection, DB triggers, all admin pages, all shared components

## Risks
- Very low risk — all changes are additive UI-only
- Signup guard on admin surface is a UX improvement, not a security fix (the trigger already handles surface-based role assignment correctly)

