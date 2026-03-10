

# Phase 4D: Final Member Surface i18n + Check-in Page Polish

## Diagnosis

Phases 4A/B/C completed auth fixes (Phone OTP, Google OAuth, domain-aware redirects) and i18n for core pages (Home, Rewards, Badges, Profile, Packages, Login, Signup). The following member pages still have fully hardcoded English:

| Page | Hardcoded strings |
|------|------------------|
| `MemberCheckInPage.tsx` | "Check-in", "Day X streak!", "Scan QR", "or type code", "Member code...", "Check In & Earn XP", "Checking in...", "Stop", "Failed to check in", camera error |
| `MemberBookingsPage.tsx` | "My Bookings", "Your upcoming & past bookings", filter labels (All/Upcoming/Past/Cancelled), "No bookings" |
| `MemberBookingDetailPage.tsx` | "Booking Details", cancel dialog, all field labels, error/success toasts |
| `MemberClassDetailPage.tsx` | "Class Details", "Book This Class", booking confirmation dialog, "Cancellation Policy", capacity labels |
| `MemberSquadPage.tsx` | "My Squad", "Available Squads", leave/join dialogs, member count, XP labels |
| `MemberCouponsPage.tsx` | "My Coupons", tab labels, discount labels ("% off", "฿X off"), "All items"/"Merchandise"/"Packages" |
| `MemberReferralPage.tsx` | "Invite Friends", "Share & earn rewards", "Referral History", copy/share labels |

## Plan

### Step 1: Add ~60 i18n keys to en.ts and th.ts
Add to `member` namespace covering all strings from the 7 pages above.

### Step 2: Update each page to use `t()` calls

**MemberCheckInPage.tsx** (~12 strings): Title, subtitle, scan button, code input, CTA, loading, error, stop button.

**MemberBookingsPage.tsx** (~8 strings): Title, subtitle, filter labels, empty state.

**MemberBookingDetailPage.tsx** (~15 strings): Section titles, cancel dialog, field labels, toasts.

**MemberClassDetailPage.tsx** (~12 strings): Booking confirmation, capacity, cancellation policy, field labels.

**MemberSquadPage.tsx** (~12 strings): Title, squad info, leave/join dialogs, empty states.

**MemberCouponsPage.tsx** (~10 strings): Title, tabs, discount labels, applies-to labels, status labels.

**MemberReferralPage.tsx** (~10 strings): Title, subtitle, stats labels, copy/share buttons, history section.

### Files Modified

| File | Changes |
|------|---------|
| `src/i18n/locales/en.ts` | Add ~60 member keys |
| `src/i18n/locales/th.ts` | Add ~60 member keys (Thai) |
| `src/apps/member/pages/MemberCheckInPage.tsx` | Full i18n |
| `src/apps/member/pages/MemberBookingsPage.tsx` | Full i18n |
| `src/apps/member/pages/MemberBookingDetailPage.tsx` | Full i18n |
| `src/apps/member/pages/MemberClassDetailPage.tsx` | Full i18n |
| `src/apps/member/pages/MemberSquadPage.tsx` | Full i18n |
| `src/apps/member/pages/MemberCouponsPage.tsx` | Full i18n |
| `src/apps/member/pages/MemberReferralPage.tsx` | Full i18n |

No database changes. No new Edge Functions. All frontend-only.

