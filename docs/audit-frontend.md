# MOOM Frontend Audit Report
**NOVA — Comprehensive Frontend Audit**  
**Date:** 2026-04-21  
**Auditor:** NOVA Subagent  
**Scope:** `src/apps/{member,trainer,staff}/**`, `src/pages/**`, `src/hooks/**`, `src/components/**`  
**Stack:** React 18 · TypeScript · Vite · Tailwind · shadcn/ui · TanStack Query 5

---

## Executive Summary

The MOOM frontend is generally well-structured with solid i18n foundations and consistent mutation patterns in the majority of hooks. However, the audit uncovered **11 confirmed "stub" / coming-soon buttons at P0 severity**, several hooks that violate the mandatory `logActivity()` rule, widespread inline query keys (bypassing `queryKeys.ts`), and a cluster of hardcoded English strings in security-critical components.

| Severity | Category | Count |
|----------|----------|-------|
| **P0** | Fake / stub buttons (no real action) | 11 |
| **P1** | Incomplete CRUD (missing Delete mutation) | 2 |
| **P1** | Missing `logActivity()` in mutations | 9 hooks / 27 mutation functions |
| **P2** | i18n violations (hardcoded English strings) | 12 occurrences across 3 files |
| **P2** | Missing `MobilePageHeader` | 0 (all pages compliant ✅) |
| **P2** | Inline query keys (not using `queryKeys.ts`) | 40+ across apps/ and pages/ |
| **P2** | Typo / property bug (`slip_image_url` vs `slip_file_url`) | 1 |
| **P3** | UX improvements (loading states, error display) | 6 |

---

## P0 — Fake / Stub Buttons

These buttons exist in the UI but trigger no real navigation, mutation, or meaningful action. They are placeholders with `toast.info("Coming Soon")` or similar no-ops that **mislead users**.

### Staff Surface

| # | File | Line | Component | Label Shown | What It Should Do |
|---|------|------|-----------|-------------|-------------------|
| 1 | `src/apps/staff/pages/StaffHomePage.tsx` | 117 | `StaffHomePage` — quick action grid | "View Schedule" | Navigate to `/staff/schedule` (route needs creation) or to the shared schedule view |
| 2 | `src/apps/staff/pages/StaffMembersPage.tsx` | 63 | `StaffMembersPage` — member list rows | (each member row tap) | Navigate to member detail page `/staff/members/:id` |

```tsx
// StaffHomePage.tsx:117 — FAKE BUTTON
<Button variant="outline" size="sm" onClick={() => toast.info(t('staff.comingSoonLabel'))}>
  <Calendar className="h-4 w-4 mr-1.5" />{t('staff.viewSchedule')}
</Button>

// StaffMembersPage.tsx:63 — FAKE BUTTON (every list item)
onClick={() => toast.info(t('staff.comingSoonLabel'))}
```

### Trainer Surface

| # | File | Line | Component | Label Shown | What It Should Do |
|---|------|------|-----------|-------------|-------------------|
| 3 | `src/apps/trainer/pages/TrainerProfilePage.tsx` | 78 | `TrainerProfilePage` — settings list | "Notifications" | Open notification preferences page or sheet |
| 4 | `src/apps/trainer/pages/TrainerProfilePage.tsx` | 83 | `TrainerProfilePage` — settings list | "Help & Support" | Navigate to FAQ/support page or open external link |
| 5 | `src/apps/trainer/pages/TrainerWorkoutsPage.tsx` | 46 | `TrainerWorkoutsPage` — workout list rows | (each workout tap) | Navigate to workout detail page `/trainer/workouts/:id` |

```tsx
// TrainerProfilePage.tsx:78 — FAKE BUTTON
onClick={() => toast.info(t('trainer.comingSoonLabel'))}

// TrainerWorkoutsPage.tsx:46 — FAKE BUTTON (every list item)
onClick={() => toast.info(t('trainer.comingSoonLabel'))}
```

### Member Surface

| # | File | Line | Component | Label Shown | What It Should Do |
|---|------|------|-----------|-------------|-------------------|
| 6 | `src/apps/member/pages/MemberRunClubPage.tsx` | (entire page) | `MemberRunClubPage` | "Run Club" page is entirely a stub | Implement run club feature or remove from nav entirely |

```tsx
// MemberRunClubPage.tsx — ENTIRE PAGE IS STUB
// Page renders only a construction icon and "coming soon" text
// No data, no actions, no interactive elements whatsoever
```

### Admin Surface (Reports / Insights)

| # | File | Line | Component | Label Shown | What It Should Do |
|---|------|------|-----------|-------------|-------------------|
| 7 | `src/pages/Reports.tsx` | 54, 64, 95, 105 | `Reports` — 4 report export buttons | "Export Report (Coming Soon)" | Implement CSV/Excel export, or remove button |
| 8 | `src/pages/Insights.tsx` | 269 | `Insights` — Package Usage report | "View Full Report (Coming Soon)" | Implement package usage report or link to one |
| 9 | `src/pages/Insights.tsx` | 478 | `Insights` — Package At Risk report | "View Full Report (Coming Soon)" | Implement at-risk report or link to one |

```tsx
// Reports.tsx:54 (and 64, 95, 105) — DISABLED+FAKE BUTTONS
{
  buttonText: `${t('reports.exportReport')} (${t('reportsExtra.comingSoon')})`,
  disabled: true,
  ...
}
```

**Note:** Lines 57, 67, 98, 108 in `Reports.tsx` mark these as `disabled: true` — they are visually disabled but the underlying feature is simply absent.

### Admin Settings

| # | File | Lines | Component | Label Shown | What It Should Do |
|---|------|-------|-----------|-------------|-------------------|
| 10 | `src/pages/settings/SettingsGeneral.tsx` | 206, 293, 339 | `SettingsGeneral` — 3 feature toggles | (tooltip "Coming Soon") | Implement respective setting saves |
| 11 | `src/pages/settings/SettingsClass.tsx` | 93 | `SettingsClass` — control button | (tooltip "Coming Soon") | Implement the described class setting |

---

## P1 — Missing or Incomplete CRUD Operations

### useGamificationChallenges — Missing DELETE

`src/hooks/useGamificationChallenges.ts` exposes only `useCreateGamificationChallenge` and `useUpdateGamificationChallenge`. **There is no `useDeleteGamificationChallenge` mutation.** The admin UI in `src/pages/gamification/GamificationChallenges.tsx` renders a challenge list but deletion is impossible.

**Fix:** Add `useDeleteGamificationChallenge` following the pattern from `useGamificationRewards.ts` (which also lacks delete — see below).

### useGamificationRewards — Missing DELETE

`src/hooks/useGamificationRewards.ts` exposes `useCreateGamificationReward` and `useUpdateGamificationReward`. **There is no delete mutation.** Rewards can be created and edited but never removed from the system.

```ts
// useGamificationRewards.ts ends at line 72 — no deleteReward function exists
```

### usePromotionPackages — Missing toast/error handlers on mutations

`src/hooks/usePromotionPackages.ts` — `useAddPromotionPackage`, `useRemovePromotionPackage`, and `useUpdatePromotionPackage` have **no `onError` handlers** and no `toast.success()` on success. Silent failures provide no feedback to the admin user.

---

## P1 — Missing `logActivity()` Calls

Per `CLAUDE.md`: *"Every mutation calls `logActivity()` in `onSuccess`."* The following hooks violate this rule:

| Hook File | Mutation Functions Missing `logActivity()` |
|-----------|-------------------------------------------|
| `src/hooks/useGoals.ts` | `useCreateGoal` (ln 94), `useDeleteGoal` (ln 113) |
| `src/hooks/useCheckinQR.ts` | `useGenerateQRToken` (ln 29), `useValidateQRToken` (ln 91) |
| `src/hooks/useFeatureFlags.ts` | `useToggleFeatureFlag` (ln 103), `useCreateFeatureFlag` (ln 132), `useUpdateFeatureFlag` (ln 172), `useDeleteFeatureFlag` (ln 213), `useSetFlagAssignment` (ln 237) |
| `src/hooks/useNotifications.ts` | `useMarkAsRead` (ln 105), `useMarkAllAsRead` (ln 127) |
| `src/hooks/useAiSuggestions.ts` | `useApproveSuggestion` (ln 48), `useRejectSuggestion` (ln 75), `useApplySuggestion` (ln 98) |
| `src/hooks/usePackageUsage.ts` | `useRecordUsage` (ln 81), `useRefundUsage` (ln 167), `useAdjustBalance` (ln 234) |
| `src/hooks/useLineIdentity.ts` | `useRequestLineLink` (ln 49), `useUnlinkLineIdentity` (ln 104) |
| `src/hooks/useLineUsers.ts` | `useLinkLineAccount` (ln 82), `useUnlinkLineAccount` (ln 194), `useUpdateLineLastLogin` (ln 222), `useUpdateLineProfile` (ln 252) |
| `src/hooks/usePromotionPackages.ts` | `useAddPromotionPackage` (ln 62), `useRemovePromotionPackage` (ln 78), `useUpdatePromotionPackage` (ln 96) |

**Total: 27 mutation functions lacking audit trail entries.**

### High-Priority Fixes (financial/security impact)

- `useValidateQRToken` — check-in events are not audit-logged; critical for dispute resolution
- `useRecordUsage`, `useRefundUsage`, `useAdjustBalance` — session balance changes untracked
- `useLinkLineAccount`, `useUnlinkLineAccount` — identity linking events not logged
- `useToggleFeatureFlag`, `useCreateFeatureFlag`, `useDeleteFeatureFlag` — feature flag changes untracked

---

## P2 — i18n Violations (Hardcoded English Strings)

All strings below are hardcoded in JSX/TSX and do **not** use `t()` from `useTranslation`.

### `src/apps/member/features/auth/IdentityLinkingCard.tsx`

```tsx
// Line 77
<h3 className="text-sm font-semibold text-foreground">Login Methods</h3>

// Line 110
Link Google Account

// Line 119
{hasEmail ? 'Update Password' : 'Set Password'}

// Line 124
<Label htmlFor="new-pw">New Password</Label>

// Line 130
placeholder="Min 8 characters"

// Line 134
<Label htmlFor="confirm-pw">Confirm Password</Label>

// Line 140
placeholder="Re-enter password"

// Line 153
{hasEmail ? 'Update Password' : 'Set Password'}  // (button label)
```

Also hardcoded toast strings in the same file:
```tsx
// Line 40, 43: toast.error('Failed to link Google account')
// Line 51: toast.error('Password must be at least 8 characters')
// Line 54: toast.error('Passwords do not match')
// Line 64: toast.success('Password set successfully!')
// Line 69: toast.error('Failed to set password')
```
**All 5 toast messages in `IdentityLinkingCard` bypass i18n.** This is the member-facing security page — Thai users see English error messages.

### `src/apps/staff/pages/StaffPaymentsPage.tsx`

```tsx
// Line 134 — detail sheet label
<span className="text-muted-foreground">Status</span>

// Line 139 — detail sheet label  
<span className="text-muted-foreground">Date</span>

// Line 155 — Reject button text
Reject

// Line 158 — Approve button text  
Approve
```

The Approve/Reject buttons on the staff payment review sheet are hardcoded in English. Thai-speaking front-desk staff see English action buttons.

### `src/apps/shared/components/QueryError.tsx`

```tsx
// Line 15
<h3 className="text-base font-semibold text-foreground">Failed to load</h3>
```

The generic error component shown across all surfaces uses hardcoded English text.

### `src/hooks/useGamificationChallenges.ts`, `useGamificationBadges.ts`, `useGamificationLevels.ts`, `useGamificationShopRules.ts`, `useGamificationRules.ts`, `useGamificationRewards.ts`, `useGamificationCoupons.ts`

All gamification hooks use raw English toast strings instead of `i18n.t()`:
```ts
toast.success('Challenge created');
toast.success('Badge updated');
toast.success('Level deleted');
// etc. — 20+ hardcoded gamification toast messages
```

### `src/hooks/useGoals.ts`
```ts
toast.error('Failed to create goal'); // Line 106 — no i18n
```

### `src/hooks/useCheckinQR.ts`
```ts
toast.error('Failed to generate QR code'); // Line 81
toast.success('Check-in successful!');     // Line 140
```

### `src/hooks/useLineIdentity.ts`
```ts
toast.success('LINE link request sent');  // Line 93
toast.success('LINE account unlinked');   // Line 117
```

### `src/hooks/useRoles.ts`
```ts
toast.success('Role created successfully'); // Line 160
toast.success('Role updated successfully'); // Line 179
toast.success('Role deleted successfully'); // Line 203
```

### `src/hooks/useEconomyGuardrails.ts`
```ts
toast.success('Guardrail updated'); // Line 60 (also duplicate at 57)
```

---

## P2 — Missing MobilePageHeader

✅ **All member, trainer, and staff pages include `MobilePageHeader`.** No violations found.

Complete coverage verified across:
- **Member:** All 22 pages under `src/apps/member/pages/` include `<MobilePageHeader />`
- **Trainer:** All 7 pages under `src/apps/trainer/pages/` include `<MobilePageHeader />`
- **Staff:** All 5 pages under `src/apps/staff/pages/` include `<MobilePageHeader />`

---

## P2 — Inline Query Keys (Not Using `queryKeys.ts`)

The architecture rule states: *"keys always declared in `src/lib/queryKeys.ts` (never inline)"*. The following are inline string key violations found in page components and surface hooks. (Hook files in `src/hooks/` have partial violations noted separately in the table.)

### Surface Apps (apps/) — High Volume Violations

All queries in `src/apps/` use inline string keys. None of the following are in `queryKeys.ts`:

| File | Inline Key(s) |
|------|---------------|
| `apps/trainer/pages/TrainerImpactPage.tsx` | `'trainer-type'`, `'coach-impact-profile'`, `'partner-reputation-profile'`, `'trainer-quests'` |
| `apps/trainer/pages/TrainerRosterPage.tsx` | `'trainer-roster'` |
| `apps/trainer/pages/TrainerHomePage.tsx` | `'trainer-type'`, `'trainer-staff-id'`, `'trainer-today-classes'`, `'trainer-announcements'` |
| `apps/trainer/pages/TrainerBadgesPage.tsx` | `'trainer-badge-earnings'`, `'all-badges-trainer'` |
| `apps/trainer/pages/TrainerWorkoutsPage.tsx` | `'trainer-workouts'` |
| `apps/trainer/pages/TrainerSchedulePage.tsx` | `'trainer-schedule-attendees'`, `'trainer-schedule'` |
| `apps/trainer/features/impact/CoachImpactCard.tsx` | `'coach-impact-profile'`, `'trainer-quests'` |
| `apps/trainer/features/impact/PartnerReputationCard.tsx` | `'partner-reputation-profile'`, `'trainer-quests'` |
| `apps/staff/pages/StaffHomePage.tsx` | `'staff-today-classes'`, `'staff-pending-slips'`, `'staff-hot-leads'`, `'staff-recent-checkins'` |
| `apps/staff/pages/StaffMembersPage.tsx` | `'staff-members'` |
| `apps/staff/pages/StaffPaymentsPage.tsx` | `'staff-transfer-slips'` |
| `apps/member/pages/MemberReferralPage.tsx` | `'referral-code'`, `'referral-stats'` |
| `apps/member/pages/MemberBookingsPage.tsx` | `'member-bookings'` |
| `apps/member/pages/MemberClassDetailPage.tsx` | `'schedule-detail'`, `'member-bookings'`, `'member-schedule'` |
| `apps/member/pages/MemberRewardsPage.tsx` | `'momentum-profile'`, `'points-history'`, `'gamification-rewards-member'`, `'my-redemptions'` |
| `apps/member/pages/MemberSchedulePage.tsx` | `'member-schedule'` |
| `apps/member/pages/MemberLeaderboardPage.tsx` | `'xp-leaderboard'`, `'around-me-leaderboard'`, `'squad-rankings'`, `'challenge-completion-stats'`, `'streak-leaderboard'`, `'streak-around-me'`, `'attendance-leaderboard'`, `'my-squad'` |
| `apps/member/pages/MemberPurchasePage.tsx` | `'available-packages'` |
| `apps/member/pages/MemberCouponsPage.tsx` | `'my-coupons'` |
| `apps/member/pages/MemberProfilePage.tsx` | `'momentum-profile'`, `'my-badges'`, `'member-status-tier'` |
| `apps/member/pages/MemberBookingDetailPage.tsx` | `'booking'`, `'class-rating'` |

### Admin Pages (pages/) — Violations

| File | Inline Key(s) |
|------|---------------|
| `pages/PackageDetails.tsx` | `'package-access-locations'` |
| `pages/PromotionDetails.tsx` | `'promotion-redemptions'` |
| `pages/gamification/GamificationOverview.tsx` | `'admin-economy-stats'` |
| `pages/gamification/GamificationPrestige.tsx` | `'prestige-criteria'` |
| `pages/gamification/GamificationStatusTiers.tsx` | `'status-tier-rules'`, `'status-tier-sp-rules'`, `'status-tier-benefits'`, `'status-tier-distribution'` |

### Hook Files — Partial Violations

Some hooks use `queryKeys.*` for their primary queries but revert to inline strings in `invalidateQueries`:

| Hook File | Inline Keys in `invalidateQueries` |
|-----------|-------------------------------------|
| `useAnnouncements.ts` | `['announcements']`, `['announcement-stats']` — not in `queryKeys.ts` |
| `useTransferSlips.ts` | `['transfer-slips']`, `['transfer-slip-stats']`, `['transfer-slip-detail']`, `['slip-activity-log']`, `['finance-transactions']` |
| `useSettings.ts` | `['settings', section]` |
| `useFeatureFlags.ts` | `['feature-flags']`, `['feature-flag']`, `['feature-enabled']` (mixes queryKeys.featureFlags() in query but inline strings in invalidateQueries) |
| `useNotifications.ts` | `['notifications']`, `['notifications-unread-count']`, `['notifications-recent']` |
| `useGamificationChallenges.ts` | `['gamification-challenges']` |
| `useGamificationBadges.ts` | `['gamification-badges']` |
| `useCheckinQR.ts` | `['active-qr-token']`, `['check-ins']`, `['token-info']` |
| `useGoals.ts` | `['goals']` |
| `usePackageUsage.ts` | `['package-usage']`, `['member-packages']` |
| `useLineUsers.ts` | `['line-user']`, `['member-line-link']`, `['line-users']` |
| `useLineIdentity.ts` | `['line-identity']` |

---

## P2 — Property Bug: `slip_image_url` vs `slip_file_url`

**File:** `src/apps/staff/pages/StaffPaymentsPage.tsx`  
**Lines:** 113–115

```tsx
// BROKEN — property does not exist on the fetched Slip type
{selectedSlip.slip_image_url ? (
  <img src={selectedSlip.slip_image_url} alt="Transfer slip" ... />
```

The query at line 43 selects `slip_file_url` (matching the database column), but the detail sheet renders `selectedSlip.slip_image_url` which is always `undefined`. **The slip image is never shown to staff reviewers** — they cannot see the uploaded payment proof before approving or rejecting.

**Fix:**
```tsx
// Change slip_image_url → slip_file_url in the Sheet
{selectedSlip.slip_file_url ? (
  <img src={selectedSlip.slip_file_url} alt="Transfer slip" ... />
```

---

## P3 — UX Improvements

### 1. Approve/Reject buttons lack loading state (Staff Payments)

**File:** `src/apps/staff/pages/StaffPaymentsPage.tsx` lines 148–160  
The `Reject` button has `disabled={rejectSlip.isPending}` but no spinner icon. The `Approve` button has `disabled={approveSlip.isPending}` but no visual loading indicator. Staff tap the button and see no feedback while the mutation runs.

```tsx
// Suggested fix — add Loader2 like IdentityLinkingCard does:
<Button onClick={handleReject} disabled={rejectSlip.isPending}>
  {rejectSlip.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <XCircle className="h-4 w-4 mr-1.5" />}
  {t('staff.reject')}
</Button>
```

### 2. Staff "View Schedule" button leads nowhere (navigation dead-end)

**File:** `src/apps/staff/pages/StaffHomePage.tsx` line 117  
The quick-action grid has 4 buttons: Check In (works), Members (works), Payments (works), View Schedule (stub). This creates an asymmetric UX — three real actions and one fake one. **Priority: create `/staff/schedule` page** showing today's schedule read-only, or route to the lobby/check-in kiosk screen that already displays schedule data.

### 3. TrainerWorkoutsPage: Workout items are tappable but do nothing

**File:** `src/apps/trainer/pages/TrainerWorkoutsPage.tsx` line 46  
Workouts render as `ListCard` items that show a chevron and are visually interactive, strongly implying navigation. Tapping shows "Coming Soon" toast. Either implement `/trainer/workouts/:id` or remove `onClick` and the chevron to make items non-interactive.

### 4. `MemberRunClubPage` wastes a nav slot

**File:** `src/apps/member/pages/MemberRunClubPage.tsx`  
The entire page is a placeholder with a construction icon. The Run Club appears in the member navigation quick strip. Members discover it, tap it, see a stub, and lose trust. **Recommendation:** Either implement the page or hide it behind a feature flag (`feature_flags` table already supports this pattern).

### 5. `MemberPurchasePage` — Purchase button shows no loading spinner

**File:** `src/apps/member/pages/MemberPurchasePage.tsx` line 191  
The Stripe checkout initiation button (`handlePurchase`) correctly disables on `checkoutLoading` but renders no loading indicator. Members tapping "Complete Purchase" see the button go grey with no spinner, and may tap again.

```tsx
// Line 191–194 currently:
<Button className="w-full" onClick={handlePurchase} disabled={checkoutLoading || !memberId}>
  {t('member.completeAndPay')}
</Button>

// Suggested fix:
<Button className="w-full" onClick={handlePurchase} disabled={checkoutLoading || !memberId}>
  {checkoutLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
  {t('member.completeAndPay')}
</Button>
```

### 6. `useGoals.ts` — `useDeleteGoal` has no `onError` handler

**File:** `src/hooks/useGoals.ts` lines 113–122  
The delete goal mutation has no `onError` callback. Silent failure on delete — the user sees no feedback if the mutation fails. Add `onError: () => toast.error('Failed to delete goal')`.

---

## Summary of Files Requiring Action

| File | Issues |
|------|--------|
| `src/apps/staff/pages/StaffHomePage.tsx` | P0 fake button, P2 inline keys |
| `src/apps/staff/pages/StaffMembersPage.tsx` | P0 fake tap, P2 inline key |
| `src/apps/staff/pages/StaffPaymentsPage.tsx` | P2 i18n, P2 `slip_image_url` bug, P3 no spinner |
| `src/apps/trainer/pages/TrainerProfilePage.tsx` | P0 ×2 fake buttons, P2 inline keys |
| `src/apps/trainer/pages/TrainerWorkoutsPage.tsx` | P0 fake tap, P2 inline key, P3 UX |
| `src/apps/member/pages/MemberRunClubPage.tsx` | P0 stub page |
| `src/apps/member/pages/MemberPurchasePage.tsx` | P2 inline key, P3 no spinner |
| `src/apps/member/features/auth/IdentityLinkingCard.tsx` | P2 i18n ×9+ hardcoded strings |
| `src/pages/Reports.tsx` | P0 ×4 disabled fake export buttons |
| `src/pages/Insights.tsx` | P0 ×2 disabled fake report buttons |
| `src/pages/settings/SettingsGeneral.tsx` | P0 ×3 coming-soon tooltips on real buttons |
| `src/pages/settings/SettingsClass.tsx` | P0 ×1 coming-soon tooltip |
| `src/hooks/useGoals.ts` | P1 missing logActivity ×2, P3 no onError on delete |
| `src/hooks/useCheckinQR.ts` | P1 missing logActivity ×2, P2 i18n ×2 |
| `src/hooks/useFeatureFlags.ts` | P1 missing logActivity ×5, P2 inline keys in invalidateQueries |
| `src/hooks/useNotifications.ts` | P1 missing logActivity ×2 |
| `src/hooks/useAiSuggestions.ts` | P1 missing logActivity ×3 |
| `src/hooks/usePackageUsage.ts` | P1 missing logActivity ×3 |
| `src/hooks/useLineIdentity.ts` | P1 missing logActivity ×2, P2 i18n ×2 |
| `src/hooks/useLineUsers.ts` | P1 missing logActivity ×4 |
| `src/hooks/usePromotionPackages.ts` | P1 missing logActivity ×3, missing onError ×3 |
| `src/hooks/useGamificationChallenges.ts` | P1 missing DELETE mutation, P2 i18n ×2 |
| `src/hooks/useGamificationRewards.ts` | P1 missing DELETE mutation, P2 i18n ×2 |
| `src/hooks/useGamificationBadges.ts` | P2 i18n ×2 |
| `src/hooks/useGamificationLevels.ts` | P2 i18n ×3 |
| `src/hooks/useGamificationShopRules.ts` | P2 i18n ×3 |
| `src/hooks/useGamificationRules.ts` | P2 i18n ×3 |
| `src/hooks/useGamificationQuests.ts` | P2 i18n (partial — uses raw strings) |
| `src/hooks/useGamificationCoupons.ts` | P2 i18n ×3 |
| `src/hooks/useRoles.ts` | P2 i18n ×3 |
| `src/hooks/useEconomyGuardrails.ts` | P2 i18n ×1, duplicate toast line at 57 |
| `src/apps/shared/components/QueryError.tsx` | P2 i18n ×1 "Failed to load" hardcoded |

---

*Report generated by NOVA Subagent — 2026-04-21*
