

# Plan: Re-add Google Login with Inactive-by-Default OAuth Users

## Problem
Google OAuth was removed for security. We want it back, but OAuth signups must be gated — new Google users should be `inactive` and blocked from accessing the app until a manager approves them.

## Current State
- `staff_status` enum: `active | pending | terminated` — no `inactive` value
- `handle_new_user` trigger sets `status = 'pending'` for all signups
- `ProtectedRoute` checks `user` + `accessLevel` but never checks staff status
- No staff status check in `AuthContext` — any authenticated user with a role can access data
- `lovable.auth.signInWithOAuth("google")` is available via `src/integrations/lovable/index.ts`

## Design

### Security Model
1. **DB trigger** (`handle_new_user`): Detect if signup is via OAuth (password provider = empty in `raw_app_meta_data`). If OAuth → set staff status to `inactive`. If email/password (invited) → keep `pending`.
2. **AuthContext**: After fetching role, also fetch staff status. If staff status is `inactive`, sign the user out and show a "pending approval" message.
3. **ProtectedRoute**: Check staff status from AuthContext; if not `active`/`pending`, redirect to a blocked page or login with message.
4. **Login page**: Re-add Google sign-in button using `lovable.auth.signInWithOAuth("google")`.

### Why `inactive` not `pending`?
`pending` is used for invited staff awaiting their first login. `inactive` means "signed up on their own, not yet approved." This keeps the existing invite flow intact.

## Steps

### Step 1 — DB Migration
- Add `inactive` to `staff_status` enum
- Update `handle_new_user` trigger: check `NEW.raw_app_meta_data->>'provider'`. If not `'email'`, set status to `'inactive'` instead of `'pending'`

```sql
ALTER TYPE public.staff_status ADD VALUE IF NOT EXISTS 'inactive';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.staff (user_id, email, first_name, last_name, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    CASE
      WHEN NEW.raw_app_meta_data->>'provider' = 'email' THEN 'pending'
      ELSE 'inactive'
    END
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'front_desk');
  RETURN NEW;
END;
$$;
```

### Step 2 — AuthContext: Fetch & enforce staff status
- Add `staffStatus` to context
- After fetching role, also query `staff.status` where `user_id = userId`
- If `staffStatus === 'inactive'`, auto sign-out + set an error flag

### Step 3 — Login page: Add Google OAuth button + inactive handling
- Add Google sign-in button using `lovable.auth.signInWithOAuth("google")`
- After sign-in, if AuthContext detects `inactive` status, show toast: "Your account is pending approval. Please contact a manager."
- Add divider between email form and Google button

### Step 4 — i18n keys
- Add `auth.googleLogin`, `auth.accountInactive`, `auth.pendingApproval` to EN and TH

### Step 5 — Staff page: Add ability to activate inactive users
- The existing Staff page already supports status changes via bulk actions. `inactive` will appear as a new tab/filter. Managers can change status from `inactive` → `active`. Minimal change: add `inactive` to `STAFF_STATUS_OPTIONS` in `Staff.tsx`.

## Files

| File | Action |
|---|---|
| DB migration | Add `inactive` enum value + update trigger |
| `src/contexts/AuthContext.tsx` | Add `staffStatus` state, fetch from `staff` table, enforce inactive block |
| `src/pages/Auth/Login.tsx` | Add Google OAuth button |
| `src/pages/Staff.tsx` | Add `inactive` status option |
| `src/i18n/locales/en.ts` | Add i18n keys |
| `src/i18n/locales/th.ts` | Add i18n keys |

## Risk
- **Low**: Adding enum value is non-breaking. Existing `active`/`pending`/`terminated` unaffected.
- **Trigger change**: Only affects NEW signups. Existing users unaffected.
- **Auth gate**: Only blocks `inactive` users. Existing `active`/`pending` users pass through as before.

