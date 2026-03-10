

# Phase 4B: Auth Polish + Member i18n + Diagnostics Enhancement

## Diagnosis

After inspecting all member-facing files, here's what still needs fixing:

### Auth Issues
1. **MemberSignup Google login on custom domains** — Line 85-96 uses `lovable.auth.signInWithOAuth` directly without the `isCustomDomain()` check that MemberLogin has. On `member.moom.fit`, Google OAuth will use the wrong redirect.
2. **Hardcoded strings in MemberSignup** — "Sign up with Google" (L188), "Join MOOM" (L169), "Use a different number" (L304), referral copy (L174-175).
3. **DiagnosticsAuthPage** missing phone verification state and phone number display.

### i18n Issues (hardcoded English across member surface)
Across ~8 member files, approximately 40+ strings are hardcoded English instead of using `t()`:
- **MemberHomePage**: "Welcome to MOOM!", "Dismiss", "Browse classes...", "Check In", "Book Class", "Next Up", "View all", "No upcoming bookings", "Active Packages", "Ready to train?", etc.
- **MemberBadgeGalleryPage**: "Badge Collection", "No badges yet", "Earned", "Locked", "Collected"
- **MemberRewardsPage**: "Reward Wallet", "Momentum Coin", "Redeemable Rewards", "Points History", "No Rewards Available", etc.
- **MemberProfilePage**: "Profile", "Edit Profile", "Sign Out", "Admin Portal", all menu labels
- **MemberPackagesPage**: "My Packages", "Browse", "No packages", tab labels
- **DailyBonusCard**: "Check in today", "Earn bonus XP..."
- **CheckInCelebration**: "Keep Going 🚀", "Quest Progress", "Coin earned"

## Plan

### Step 1: Add ~50 i18n keys to en.ts and th.ts
Add keys under a `member` namespace covering all hardcoded strings found above.

### Step 2: Fix MemberSignup Google OAuth for custom domains
Apply the same `isCustomDomain()` pattern from MemberLogin — use `supabase.auth.signInWithOAuth` with `redirectTo` on custom domains, `lovable.auth` otherwise.

### Step 3: i18n all member pages
Update these files to use `t()` for all user-visible strings:
- `MemberHomePage.tsx` (~15 strings)
- `MemberBadgeGalleryPage.tsx` (~8 strings)
- `MemberRewardsPage.tsx` (~10 strings)  
- `MemberProfilePage.tsx` (~12 strings)
- `MemberPackagesPage.tsx` (~6 strings)
- `DailyBonusCard.tsx` (~2 strings)
- `CheckInCelebration.tsx` (~4 strings)
- `MemberSignup.tsx` (~4 strings)

### Step 4: Enhance DiagnosticsAuthPage
Add phone verification state (`user?.phone`, `user?.phone_confirmed_at`), provider list, and member ID resolution display.

### Files Modified

| File | Changes |
|------|---------|
| `src/i18n/locales/en.ts` | Add ~50 member surface keys |
| `src/i18n/locales/th.ts` | Add ~50 member surface keys (Thai) |
| `src/pages/Auth/MemberSignup.tsx` | Fix Google OAuth custom domain + i18n |
| `src/apps/member/pages/MemberHomePage.tsx` | i18n all strings |
| `src/apps/member/pages/MemberBadgeGalleryPage.tsx` | i18n all strings |
| `src/apps/member/pages/MemberRewardsPage.tsx` | i18n all strings |
| `src/apps/member/pages/MemberProfilePage.tsx` | i18n all strings |
| `src/apps/member/pages/MemberPackagesPage.tsx` | i18n all strings |
| `src/apps/member/features/momentum/DailyBonusCard.tsx` | i18n strings |
| `src/apps/member/features/momentum/CheckInCelebration.tsx` | i18n strings |
| `src/pages/Auth/DiagnosticsAuthPage.tsx` | Add phone verification display |

No database changes. No new Edge Functions. All frontend-only.

