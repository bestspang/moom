

# Fix: Google OAuth "missing OAuth secret" on Custom Domain

## Root Cause

Auth logs show `member.moom.fit` hitting `/authorize` → **400: "Unsupported provider: missing OAuth secret"**.

The code in both `MemberLogin.tsx` and `AdminLogin.tsx` has an `isCustomDomain()` branch that bypasses Lovable Cloud's managed Google OAuth and calls `supabase.auth.signInWithOAuth` directly. Since there are no Google OAuth credentials configured in the Supabase project itself, this fails on custom domains (`member.moom.fit`, `admin.moom.fit`).

```text
Current flow (broken):
  isCustomDomain() = true → supabase.auth.signInWithOAuth → 400 missing secret

Correct flow:
  Always → lovable.auth.signInWithOAuth → Lovable Cloud manages credentials
```

The same bug exists in `IdentityLinkingCard.tsx` (Link Google Account on member security page).

## Fix

Remove all `isCustomDomain()` branches for Google OAuth. Always use `lovable.auth.signInWithOAuth("google", ...)` regardless of domain.

### Files to change

| # | File | Change |
|---|------|--------|
| 1 | `src/pages/Auth/MemberLogin.tsx` | Remove `isCustomDomain()` branch in `handleGoogleSignIn`, always use `lovable.auth.signInWithOAuth` |
| 2 | `src/pages/Auth/AdminLogin.tsx` | Same fix |
| 3 | `src/apps/member/features/auth/IdentityLinkingCard.tsx` | Already uses `lovable.auth` — no change needed |

### What stays the same
- Email/password login — unaffected
- Phone OTP — unaffected
- Email OTP — unaffected
- All other auth flows, RLS, permissions
- `isCustomDomain()` function itself (used elsewhere)

### Smoke Test
1. Google login works on preview (lovable.app)
2. Google login works on custom domain (member.moom.fit / admin.moom.fit)
3. After Google login, user lands on correct surface
4. Existing email/password login still works

