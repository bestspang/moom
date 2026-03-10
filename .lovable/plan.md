

# Phase 4E: Complete Member Surface i18n — Final Remaining Pages

## Diagnosis

Phases 4A-4D localized the core member pages. The following 10 files still contain hardcoded English:

| File | Hardcoded strings |
|------|------------------|
| **MemberSchedulePage** | "Schedule", "Browse & book classes", "All", "No classes found", "Try a different category", "Check back later...", "with", "spots", "Book", "Full" |
| **MemberAttendancePage** | "Attendance", "Your check-in history", "No check-ins", "Your attendance history will appear here" |
| **MemberNotificationsPage** | "Notifications", "unread", "All caught up!", "Mark all read", "You're all caught up! 🎉", "We'll let you know when something happens" |
| **MemberEditProfilePage** | "Edit Profile", "First Name", "Last Name", "Email", "Phone", "Preferred Language", "Back", "Profile updated", "Failed to update profile", "Save Changes", "Saving..." |
| **MemberLeaderboardPage** | "Leaderboard", "See who's on top 🏆", "XP", "Squads", "Challenges", "(You)", "(Yours)", "No XP earners yet", "No squads yet", "No challenges yet", "members", "completed" |
| **MemberUploadSlipPage** | "Upload Transfer Slip", "Tap to upload slip image", "JPG, PNG up to 5MB", "Amount (THB)", "Bank Name", "Transfer Date", "Submit Transfer Slip", "Uploading...", "Transfer slip uploaded", "Failed to upload slip", "Back" |
| **MemberSecurityPage** | "Security & Login", "Account Security", "Manage your login methods" |
| **MemberMomentumPage** | "Momentum", ~30 strings including tab labels, section titles, event labels, rarity labels, empty states, CTAs |
| **MemberPurchasePage** | "Credit/Debit Card", "PromptPay", "Bank Transfer", "Review", "Payment", "Package not found", "Purchase Initiated!", "View My Packages", "Book a Class", "Continue to Payment", "Processing...", "Pay", "Payment Method", "Price", "sessions", "day term" |
| **MemberBottomNav** | "Home", "Schedule", "Check In", "Rewards", "Profile" |

## Plan

### Step 1: Add ~80 i18n keys to en.ts and th.ts
Add keys under `member` namespace for all strings from the 10 files above.

### Step 2: Update each file to use `t()` calls

All files will import `useLanguage` or `useTranslation` and replace hardcoded strings.

### Files Modified

| File | Changes |
|------|---------|
| `src/i18n/locales/en.ts` | ~80 new member keys |
| `src/i18n/locales/th.ts` | ~80 new member keys (Thai) |
| `src/apps/member/pages/MemberSchedulePage.tsx` | i18n ~10 strings |
| `src/apps/member/pages/MemberAttendancePage.tsx` | i18n ~4 strings |
| `src/apps/member/pages/MemberNotificationsPage.tsx` | i18n ~6 strings |
| `src/apps/member/pages/MemberEditProfilePage.tsx` | i18n ~12 strings |
| `src/apps/member/pages/MemberLeaderboardPage.tsx` | i18n ~12 strings |
| `src/apps/member/pages/MemberUploadSlipPage.tsx` | i18n ~11 strings |
| `src/apps/member/pages/MemberSecurityPage.tsx` | i18n ~3 strings |
| `src/apps/member/pages/MemberMomentumPage.tsx` | i18n ~30 strings |
| `src/apps/member/pages/MemberPurchasePage.tsx` | i18n ~15 strings |
| `src/apps/member/components/MemberBottomNav.tsx` | i18n ~5 nav labels |

No database changes. No new Edge Functions. All frontend-only.

