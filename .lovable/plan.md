

# Domain-Aware Auth — Recheck & Continue

## Current State (What's Built)

Phase 1 is structurally complete:
- Surface-aware Login router (`Login.tsx` → `AdminLogin` or `MemberLogin`)
- AdminLogin (no signup), MemberLogin (Google-first + signup link), MemberSignup
- DB: `member` role in `app_role` enum, surface-aware `handle_new_user` trigger
- AuthContext: `.maybeSingle()`, member role fallback, `signup_surface` metadata
- Google OAuth calls with `prompt: "select_account"` and correct `redirect_uri`

## Critical Gap Found

**Member self-signup creates no `members` row.**

The `handle_new_user` trigger creates only a `user_roles(member)` row. But `useMemberSession` resolves `memberId` via `identity_map` or `line_users` — neither gets created for self-signup members. Result: `memberId = null`, so bookings, packages, attendance, rewards all return empty.

**Fix**: Update `handle_new_user` trigger to also:
1. Create a `members` row (using email, first_name, last_name from metadata)
2. Create an `identity_map` row linking auth user → members row

## Missing Enum Value

Requirements list `freelance_trainer` as a role but it doesn't exist in `app_role` enum. Need to add it.

## Google OAuth — Cannot Fix Further

The `lovable.auth.signInWithOAuth` is an auto-generated module (`@lovable.dev/cloud-auth-js`). The popup/redirect flow is managed by the library. Our code correctly:
- Sets `redirect_uri: window.location.origin`
- Sets `prompt: "select_account"`
- Relies on `onAuthStateChange` for session pickup

If "nothing happens" after account selection, the issue is likely in the managed OAuth configuration (redirect URI allowlist). This needs verification on real custom domains, not lovable.app preview.

## Implementation Plan

### Task 1: DB Migration — Create `members` + `identity_map` for member signups

Update `handle_new_user` trigger:

```sql
IF v_surface = 'member' THEN
  -- Create user_roles
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member');
  
  -- Create members record
  INSERT INTO public.members (email, first_name, last_name, status)
  VALUES (
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'active'
  ) RETURNING id INTO v_member_id;
  
  -- Create identity_map linking auth user → member
  INSERT INTO public.identity_map (
    admin_entity_id, experience_user_id, entity_type,
    shared_identifier, shared_identifier_type, is_verified
  ) VALUES (
    v_member_id, NEW.id, 'member',
    NEW.email, 'email', true
  );
END IF;
```

### Task 2: DB Migration — Add `freelance_trainer` to `app_role` enum

```sql
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'freelance_trainer';
```

Update `has_min_access_level` and `get_user_access_level` to handle `freelance_trainer` (same as `trainer` = `level_2_operator`).

### Task 3: Update AuthContext — Add `freelance_trainer` to `roleToAccessLevel`

Add `freelance_trainer: 'level_2_operator'` to the map.

### Task 4: Add Google OAuth diagnostics

Add `console.log` statements in `handleGoogleSignIn` callbacks (AdminLogin, MemberLogin) to trace the OAuth flow result, making it easier to debug on production domains.

### Task 5: Surface-aware "Access Denied" redirect

Update `ProtectedRoute` AccessDenied button: if on member surface, redirect to `/member` instead of `/`.

## Files to Change

| File | Change |
|------|--------|
| DB migration | Update `handle_new_user` to create `members` + `identity_map` for member signups; add `freelance_trainer` enum; update access level functions |
| `src/contexts/AuthContext.tsx` | Add `freelance_trainer` to `roleToAccessLevel` |
| `src/pages/Auth/AdminLogin.tsx` | Add OAuth diagnostic logs |
| `src/pages/Auth/MemberLogin.tsx` | Add OAuth diagnostic logs |
| `src/components/auth/ProtectedRoute.tsx` | Surface-aware "Back" button |

## Zero Changes To
- Member app pages, momentum components, admin pages, Supabase client, shared components

## Risks
- Adding enum value is irreversible (safe but one-way)
- Creating `members` row in trigger: need to verify `members` table required columns and defaults

## Deferred (Phase 2+)
- Email OTP / Magic Link login
- Legacy account claiming flow
- Identity linking (add Google/password after first login)
- Phone OTP (Twilio)
- Verification states and onboarding flow

