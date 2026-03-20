

# Member App QC Audit — Findings & Fix Plan

## BUG 1 — Referral Share URL Points to Non-Existent Route (Critical)

**Root cause:** `MemberReferralPage.tsx` line 33 and `ReferralCard.tsx` line 33 generate:
```
${window.location.origin}/member/signup?ref=${code}
```
But the actual signup route is `/signup` (not `/member/signup`). The path `/member/signup` falls inside the `<MemberLayout>` which requires authentication — a non-logged-in referred user gets redirected to `/login` and the referral code is lost.

**Impact:** The entire referral system is non-functional for new users. Every shared link leads to a login page instead of signup.

**Fix:** Change both files from `/member/signup?ref=` to `/signup?ref=`. Two 1-line changes.

---

## BUG 2 — Onboarding Dismiss Resets on Every Navigation (Minor UX)

**Root cause:** `MemberHomePage.tsx` line 38 uses `useState(false)` for `onboardingDismissed`. Every time the user navigates to another tab and comes back, the dismissed onboarding card reappears.

**Impact:** Annoying but not broken. Users who dismiss the onboarding card will see it again every time they return to Home.

**Fix:** Use `localStorage` to persist the dismissed state:
```typescript
const [onboardingDismissed, setOnboardingDismissed] = useState(
  () => localStorage.getItem('moom-onboarding-dismissed') === 'true'
);
// in dismiss handler: localStorage.setItem('moom-onboarding-dismissed', 'true');
```

---

## BUG 3 — `date-fns` Dates Always in English for Thai Users (UX Gap)

**Root cause:** All member pages use `format()` and `formatDistanceToNow()` from `date-fns` without passing a locale. Examples:
- `MemberSchedulePage`: `format(parseISO(date), 'EEEE, d MMM')` → always "Monday, 3 Mar"
- `MemberNotificationsPage`: `formatDistanceToNow(...)` → always "2 hours ago"
- `MemberBookingDetailPage`: `format(parseISO(...), 'PPp')` → English format

Thai users see English day/month names and relative time strings throughout the app.

**Impact:** The app has full i18n for UI labels but dates are always English — inconsistent bilingual experience.

**Fix:** This is a larger change that needs careful implementation — a shared `useDateLocale()` hook that returns `th` or `enUS` locale, then pass it to all `format()` and `formatDistanceToNow()` calls. I recommend this as a separate follow-up to avoid touching 14+ files in one shot.

---

## Verified Working (No Issues)

- All 21 member routes exist in `App.tsx` and match their page components ✅
- `MemberBottomNav` paths match route definitions ✅
- `QuickMenuStrip` paths all have corresponding routes ✅
- `MemberLayout` auth guard redirects to `/login` correctly ✅
- `useMemberSession` resolves `memberId` via `identity_map` + `line_users` fallback ✅
- All queries use `enabled: !!memberId` guards — no premature fetches ✅
- Check-in page uses server-side RPC with duplicate check ✅
- Booking cancel uses `cancel_booking_safe` RPC ✅
- Class booking uses `create_booking_safe` RPC ✅
- Gamification events fire correctly after check-in and profile update ✅
- Momentum hero section, XP bar, streak, coins — all render from real data ✅
- Coupon page handles active/used/expired with correct date logic ✅
- Upload slip page has file size validation and preview ✅
- Purchase flow uses Stripe checkout correctly ✅
- Squad join/leave with confirmation dialog ✅
- Leaderboard with 5 tabs + "around me" section ✅
- Class rating sheet on attended bookings ✅
- Notification bell with unread count + mark all read ✅
- StatusTierBadge shows on Home and Profile pages ✅

---

## Implementation Plan

| # | File | Change | Risk |
|---|------|--------|------|
| 1 | `src/apps/member/pages/MemberReferralPage.tsx` line 33 | Change `/member/signup?ref=` → `/signup?ref=` | Zero — URL string change |
| 2 | `src/apps/member/features/referral/ReferralCard.tsx` line 33 | Same fix | Zero — URL string change |
| 3 | `src/apps/member/pages/MemberHomePage.tsx` line 38 | Persist dismiss state to `localStorage` | Zero — additive, same behavior but persistent |

---

## Feature Suggestions (Verified Safe — All Additive)

**1. date-fns Thai Locale Support** — Create a `useDateLocale()` hook that reads the current language and returns the correct `date-fns` locale. Apply to all `format()` calls across member pages. Purely additive — no logic changes.

**2. SP History Timeline** — Add a small card on MemberMomentumPage showing recent `sp_ledger` entries so members can see how they earn Status Points. New component + new query — no existing code touched.

**3. Tier Benefits Display** — Show current tier's benefits (from `status_tier_benefits` table) on the StatusTierCard. Members currently see their tier but not what it unlocks. Purely additive component enhancement.

