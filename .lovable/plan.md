

# Phase 2: Email OTP, Legacy Claim, Auth Diagnostics

## Current State Verification

Phase 1 is structurally complete and correct:
- Surface-aware login router works (AdminLogin vs MemberLogin)
- `handle_new_user` trigger is attached to `auth.users` (created in early migration)
- Trigger creates `members` + `identity_map` + `user_roles(member)` for member signups
- `freelance_trainer` enum and access level functions updated
- AuthContext uses `.maybeSingle()` with member fallback
- Google OAuth has diagnostics logging
- 231 legacy members exist in DB, 0 linked via `identity_map`

**No critical bugs found in Phase 1 code.**

## What This Phase Builds

### 1. Legacy Account Claiming via Trigger (DB Migration)

Update `handle_new_user` to detect existing members by email before creating a new one:

```text
IF v_surface = 'member' THEN
  -- Check for existing member with same email (legacy)
  SELECT id INTO v_member_id FROM members WHERE email = NEW.email LIMIT 1;
  
  IF v_member_id IS NOT NULL THEN
    -- Legacy claim: link auth user to existing member, don't create duplicate
    INSERT INTO user_roles (user_id, role) VALUES (NEW.id, 'member');
    INSERT INTO identity_map (...) VALUES (v_member_id, NEW.id, 'member', email, true);
  ELSE
    -- New member: create members row + identity_map (existing logic)
  END IF;
END IF;
```

This handles legacy claiming automatically -- no separate UI flow needed. When a legacy member signs up (via Google, email/password, or OTP) with the same email, they get linked to their existing record.

### 2. Email OTP (Magic Link) Login on Member Surface

Add email OTP tab/option to `MemberLogin.tsx`:
- New "Sign in with email link" section
- User enters email, clicks send
- Calls `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + '/login' } })`
- Shows "Check your email" confirmation state
- On return, `onAuthStateChange` picks up session, `handle_new_user` trigger fires (for new users) or session is established (for existing)

**Admin surface**: No OTP option (prevents public account creation)

### 3. Auth Diagnostics Page

Create `/diagnostics/auth` page showing:
- Current user (id, email, provider)
- Current role, access level, staff status
- Member ID resolution (identity_map check)
- Surface detection
- Session state

### 4. AuthContext: Expose `allRoles` for Multi-Role Users

Currently fetches only the highest role. For Phase 2, fetch ALL roles so the UI can show admin shortcuts to multi-role users on member surface.

Change `fetchUserRoleAndStatus` to fetch all `user_roles` rows, pick highest for `role`/`accessLevel`, but also expose `allRoles: AppRole[]`.

## Files to Change

| File | Change |
|------|--------|
| DB migration | Update `handle_new_user` for legacy email matching |
| `src/pages/Auth/MemberLogin.tsx` | Add email OTP option with "send magic link" flow |
| `src/pages/Auth/DiagnosticsAuthPage.tsx` | New diagnostics page |
| `src/App.tsx` | Register diagnostics route |
| `src/contexts/AuthContext.tsx` | Expose `allRoles` array |

## Zero Changes To
- AdminLogin, MemberSignup, ProtectedRoute, SurfaceGuard, hostname detection, admin pages, member app pages, shared components

## Risks
- `signInWithOtp` auto-creates auth users. Combined with updated trigger, legacy members get linked automatically. New emails create new member records. This is the desired behavior for member surface.
- Magic link emails require email delivery to be working in Lovable Cloud (should be enabled by default).

## Deferred
- Phone OTP (requires Twilio connector)
- Identity linking UI (add Google/password to existing account)
- Provisional → active account lifecycle
- Admin shortcuts in member surface (needs `allRoles` first, then UI work)

