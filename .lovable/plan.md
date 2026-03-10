

# Phase 4: Member Auth Fixes + UX Polish

## Diagnosis

### Auth Issues
1. **No Phone OTP login** — spec requires it, not built
2. **MemberLogin hardcoded English** — "Password", "Email Link", "Check your email", "Send sign-in link" are not i18n'd
3. **Google OAuth redirect on custom domains** uses `skipBrowserRedirect: true` + manual `window.location.href` — works but loses the `prompt: "select_account"` param
4. **MemberSignup** has Google but no Email OTP or Phone OTP signup path
5. **No post-login verification prompt** — if user signs up via Google but has no verified phone, nothing guides them

### UX Issues
1. **DailyBonusCard** hardcodes "+8 XP · +1" — should pull from gamification rules like CheckInCelebration does
2. **MemberPackagesPage** has no gamification connection — no "earn XP when you renew" nudge
3. **Badge Gallery** shows earned badges only — no "locked" badges section showing what to aim for
4. **MomentumCard** is dense but good — minor: "View all" text needs better contrast
5. **Home page** has good structure — could benefit from an "Almost there" milestone nudge

## Plan (2 Milestones)

### Milestone 1: Auth Friction Fixes (Priority)

**A. Add Phone OTP to MemberLogin** (`src/pages/Auth/MemberLogin.tsx`)
- Add a third login mode: `'password' | 'email_otp' | 'phone_otp'`
- Replace the 2-button toggle with a 3-option pill group: Password | Email Link | Phone
- Phone OTP flow: phone input → `supabase.auth.signInWithOtp({ phone })` → 6-digit code entry via InputOTP → verify → session
- Include resend timer (60s countdown), error states, expired code handling
- i18n all new strings in both `en.ts` and `th.ts`

**B. Add Phone OTP to MemberSignup** (`src/pages/Auth/MemberSignup.tsx`)
- Add phone signup option alongside Google / email+password
- Phone signup: enter phone → OTP → verify → collect first/last name → complete
- Pass `signup_surface: 'member'` metadata

**C. Fix i18n in auth pages**
- Replace all hardcoded English strings in MemberLogin and MemberSignup with `t()` calls
- Add missing keys to `en.ts` and `th.ts`: `auth.phoneLogin`, `auth.sendOtp`, `auth.enterCode`, `auth.resendIn`, `auth.phoneNumber`, `auth.verifyCode`, `auth.otpExpired`, `auth.invalidCode`, `auth.emailLink`, `auth.passwordLogin`, `auth.phoneOtp`

**D. Improve Google OAuth redirect consistency**
- On custom domains, add `queryParams: { prompt: 'select_account' }` to the Supabase OAuth options so account selection works the same as on lovable.app

**E. Auth diagnostics enhancement** (`src/pages/Auth/DiagnosticsAuthPage.tsx`)
- Add phone verification state display
- Add OTP flow state info

### Milestone 2: Member UX Polish

**A. DailyBonusCard dynamic values** (`src/apps/member/features/momentum/DailyBonusCard.tsx`)
- Query `gamification_rules` for `check_in` action to show real XP/Coin values instead of hardcoded "+8 XP · +1"

**B. Badge Gallery — add locked badges** (`src/apps/member/pages/MemberBadgeGalleryPage.tsx`)
- Fetch all `gamification_badges` (not just earned)
- Show earned badges first, then locked badges (greyed out, with description of how to earn)
- Add a "X / Y Collected" counter

**C. Packages page — gamification nudge** (`src/apps/member/pages/MemberPackagesPage.tsx`)
- Add a small info banner: "Renewing your package earns XP + Coin"
- Pull values from `gamification_rules` where `action_key = 'package_purchase'`

**D. Home "Almost There" section** (`src/apps/member/pages/MemberHomePage.tsx`)
- After MomentumCard, show an "Almost there" nudge if the user is within 15% of next level
- Show: "X more XP to reach Level Y" with a mini progress indicator

**E. MomentumCard minor polish** (`src/apps/member/features/momentum/MomentumCard.tsx`)
- Ensure "View all" text contrasts on primary background (already uses `primary-foreground/0.7`, just verify)

## Files to Create/Update

| File | Action |
|------|--------|
| `src/pages/Auth/MemberLogin.tsx` | Add phone OTP mode, i18n fixes |
| `src/pages/Auth/MemberSignup.tsx` | Add phone OTP signup option, i18n fixes |
| `src/i18n/locales/en.ts` | Add ~15 new auth keys |
| `src/i18n/locales/th.ts` | Add ~15 new auth keys (Thai) |
| `src/apps/member/features/momentum/DailyBonusCard.tsx` | Dynamic XP/Coin from rules |
| `src/apps/member/pages/MemberBadgeGalleryPage.tsx` | Add locked badges section |
| `src/apps/member/pages/MemberPackagesPage.tsx` | Add gamification nudge |
| `src/apps/member/pages/MemberHomePage.tsx` | Add "Almost there" milestone nudge |
| `src/pages/Auth/DiagnosticsAuthPage.tsx` | Add phone verification state |

No database changes needed. No new Edge Functions. All changes are frontend-only.

## Implementation Order
1. i18n keys first (both languages)
2. MemberLogin phone OTP
3. MemberSignup phone OTP
4. Google OAuth fix
5. DailyBonusCard dynamic values
6. Badge Gallery locked badges
7. Home "Almost there" nudge
8. Packages gamification nudge
9. Auth diagnostics enhancement

