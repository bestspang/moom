

# UX/UI Comprehensive Audit — MOOM CLUB Admin

## Overall Assessment

The app has a solid foundation: good component architecture, consistent design system, bilingual support, and thoughtful features like AI briefing and engagement scoring. However, there are several areas where polish, consistency, flow optimization, and mobile experience can be significantly improved.

---

## FINDINGS BY CATEGORY

### A. COPY & LANGUAGE ISSUES

**A1. Hardcoded English strings in i18n app**
- `ResetPassword.tsx` lines 16-20: Validation messages hardcoded in English (`'Password must be at least 6 characters'`, `'Passwords do not match'`)
- `ForgotPassword.tsx` line 17: `'Please enter a valid email address'` hardcoded
- `Profile.tsx` line 79: `'Password must be at least 6 characters'` hardcoded English
- `Finance.tsx` lines 140-150: `formatPaymentMethod()` returns hardcoded English (`'Cash'`, `'Bank Transfer'`, etc.) — should use i18n keys
- `Finance.tsx` line 298: `'Failed'` and `'Refunded'` hardcoded
- `Packages.tsx` lines 96-103: `formatType()` returns hardcoded `'Unlimited'`, `'Sessions'`, `'PT'`
- `DataTable.tsx` line 162: pagination shows `"of"` hardcoded — should be `t('common.of')`

**A2. Inconsistent empty state messages**
- `Members.tsx` line 315: `emptyMessage={t('members.searchPlaceholder')}` — uses a **search placeholder** as empty state message. This is confusing; should be something like "No members found"
- `Leads.tsx` line 249: Same issue — uses search placeholder as empty state

**A3. Breadcrumb inconsistency**
- `Members.tsx`: breadcrumb says `t('nav.client')` → `t('members.title')` but sidebar group is "People", not "Client"
- `Leads.tsx`: same — `t('nav.client')` doesn't match sidebar "People" group
- `Schedule.tsx`: breadcrumb says `t('nav.class')` but schedule is under "Daily", not "Class"
- `Finance.tsx`: breadcrumb has `t('nav.finance')` → `t('finance.title')` which is redundant (same label twice)

### B. COLOR & VISUAL CONSISTENCY

**B1. StatusBadge variant mapping inconsistencies**
- `Lobby.tsx`: uses `'active'` for QR, `'new'` for LIFF, `'pending'` for manual — these color mappings don't communicate meaning intuitively
- `Leads.tsx`: `'interested'` and `'converted'` both map to `'active'` (same color) — user can't visually distinguish them
- `Finance.tsx`: `getStatusVariant` maps `'refunded'` to `'voided'` — semantically different but visually identical

**B2. Sidebar badge colors**
- Both `expiringCount` and `pendingSlips` use `bg-destructive` (red) — no priority differentiation between "needs review" (urgent) vs "expiring soon" (warning)

### C. FLOW & JOURNEY ISSUES

**C1. Dashboard → Action path is weak**
- Dashboard KPI cards show numbers but only "Classes Scheduled" has a clickable action link. "All Check-ins Today" and "Currently in Class" are dead-end — no way to click through to see details
- The FAB check-in button on desktop shows only an icon — could be missed by new users

**C2. Members table has too many columns (12 columns)**
- nickname, memberId, phone, email, location, status, engagement, joinedDate, recentPackage, lastAttended, contract, actions — this is overwhelming
- On mobile, horizontal scroll is required with 12+ columns — poor scannability
- Recommend: show 5-6 essential columns, hide rest behind a "View Details" or column toggle

**C3. Leads → Convert to Member flow**
- Dropdown menu with single action (Convert to Member) — overkill for 1 action. Could be a direct button
- No "Edit Lead" option in the dropdown — can't edit lead details inline
- No lead detail page — clicking a row does nothing (`onRowClick` not defined on DataTable)

**C4. Analytics vs Reports overlap**
- Analytics page shows charts (Revenue, Member Growth, Fill Rate, Lead Funnel)
- Reports page has "View Full Report" buttons that go to dedicated report pages
- User confusion: "Where do I go to see revenue trends?" — both pages. Consider merging or clearly differentiating purpose

**C5. Finance page is overloaded**
- 4 tabs (Overview, Transactions, Slips, Forecasting) in one page
- Each tab has its own search, filters, export — complex for mobile
- The "Manage" dropdown only appears contextually for certain tabs — inconsistent header actions

**C6. No onboarding for Check-in flow**
- CheckInDialog requires: 1) Select location, 2) Search member, 3) Select package, 4) Choose type
- If gym has only 1 location, user still has to manually select it — should auto-select

**C7. Notification page lacks actionability**
- Clicking a notification only marks it as read — doesn't navigate to the relevant page
- `package_expiring` should link to member detail, `payment_received` should link to transaction, etc.

### D. MOBILE RESPONSIVENESS

**D1. Dashboard grid breaks on small screens**
- `grid grid-cols-3` for stat cards — on small phones (320px), 3 columns is too cramped. Should be `grid-cols-1 sm:grid-cols-3`

**D2. Lobby buttons layout**
- Desktop buttons are positioned with negative margin hack (`-mt-[52px]`) which is fragile and could overlap on certain screen sizes

**D3. Page headers with actions**
- Members/Packages pages: action buttons (Manage + Create) stack poorly on small screens — the `flex items-center gap-2` doesn't wrap gracefully

**D4. CheckInDialog should be a Drawer on mobile**
- Currently uses `Dialog` always — should switch to `Drawer` (vaul) on mobile for better thumb-reach UX, consistent with project design philosophy

### E. FUNCTIONAL GAPS

**E1. No loading feedback on Google sign-in redirect**
- `handleGoogleSignIn` sets loading state, but OAuth redirects the page — user sees loading briefly then page navigates away. The loading spinner may flash unnecessarily

**E2. Profile page doesn't sync with staff table**
- Profile updates `auth.users.user_metadata` but doesn't update the `staff` table's `first_name`/`last_name` — name change won't reflect in the sidebar user display or staff list

**E3. Command Palette search results are limited**
- Only searches `members` and `leads` tables — can't search for classes, packages, or staff by name
- No recent searches or keyboard navigation hint

**E4. Pagination text not localized**
- `DataTable.tsx` line 162: `"of"` is hardcoded English

---

## IMPLEMENTATION PLAN

### Priority 1 — High Impact, Quick Wins (copy & consistency)
1. **Fix hardcoded strings** — Replace all hardcoded English in ResetPassword, ForgotPassword, Profile, Finance, Packages with i18n keys. Add missing keys to `en.ts` and `th.ts`
2. **Fix empty state messages** — Members and Leads should use proper "no results" messages, not search placeholders
3. **Fix pagination "of" text** — Use `t('common.of')` in DataTable
4. **Fix breadcrumbs** — Align with actual sidebar group names (People, not Client)

### Priority 2 — Flow Improvements
5. **Dashboard stat cards clickable** — Add `onClick` navigation to stat cards (check-ins → Lobby, currently in class → Schedule)
6. **Auto-select single location** — In CheckInDialog, if only 1 location exists, auto-select it
7. **Notifications actionable** — Add navigation on notification click based on type (e.g., `package_expiring` → member detail)
8. **Members table column reduction** — Default to 6 essential columns (Name, ID, Phone, Status, Engagement, Actions). Show full columns via a column toggle button

### Priority 3 — Mobile Polish
9. **Dashboard stat grid responsive** — Change to `grid-cols-1 sm:grid-cols-3`
10. **CheckInDialog → Drawer on mobile** — Use `useIsMobile()` hook to switch between Dialog/Drawer
11. **Page header actions wrap** — Add `flex-wrap` to action containers

### Priority 4 — UX Refinements
12. **Leads row clickable** — Add a lead detail view or at minimum a slide-over panel
13. **StatusBadge for leads** — Differentiate "interested" (blue/teal) from "converted" (green) visually
14. **Profile ↔ Staff sync** — When profile name is updated, also update `staff` table

### Files to modify:
| File | Changes |
|---|---|
| `src/pages/Auth/ResetPassword.tsx` | i18n validation strings |
| `src/pages/Auth/ForgotPassword.tsx` | i18n validation string |
| `src/pages/Profile.tsx` | i18n string + staff table sync |
| `src/pages/Finance.tsx` | i18n payment method labels |
| `src/pages/Packages.tsx` | i18n type labels |
| `src/pages/Members.tsx` | Fix empty message, breadcrumbs, reduce columns |
| `src/pages/Leads.tsx` | Fix empty message, breadcrumbs, add row click |
| `src/pages/Schedule.tsx` | Fix breadcrumbs |
| `src/pages/Dashboard.tsx` | Responsive grid, clickable stat cards |
| `src/pages/Notifications.tsx` | Add navigation on click |
| `src/components/common/DataTable.tsx` | i18n "of" text |
| `src/components/lobby/CheckInDialog.tsx` | Auto-select single location, Drawer on mobile |
| `src/components/common/StatusBadge.tsx` | Add "converted" variant |
| `src/i18n/locales/en.ts` | Add missing i18n keys |
| `src/i18n/locales/th.ts` | Add missing i18n keys |

### Risk Assessment
- **Low risk**: All changes are additive UX polish — no DB/API contract changes
- **Copy fixes**: Pure string replacements, zero regression
- **Column reduction**: Needs careful handling to preserve data access (toggle, not remove)
- **Notification navigation**: New behavior on existing click handler — verify no side effects

