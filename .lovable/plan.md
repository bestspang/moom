

# Sync & Consistency Audit — Remaining Issues

## Verified Working (No Changes Needed)
- Auth flow (Google OAuth inactive gate, email invite) ✅
- Edge function access level checks (approve-slip, stripe-create-checkout, daily-briefing) ✅
- Transaction number sequence (atomic, no race condition) ✅
- Pagination i18n (`t('common.of')`) ✅
- Members/Leads breadcrumbs use `t('nav.people')` ✅
- Members/Leads empty state uses `t('common.noResults')` ✅
- Finance `formatPaymentMethod` uses i18n ✅
- Finance status labels use i18n ✅
- Dashboard stat cards clickable ✅
- Notification click navigation ✅
- Staff inactive status tab ✅
- Profile ↔ staff table sync ✅
- ResetPassword page exists and routes correctly ✅

---

## ACTUAL ISSUES FOUND

### Issue 1 — MemberDetails breadcrumb still uses `t('nav.client')` instead of `t('nav.people')`

**Root cause:** Members.tsx and Leads.tsx breadcrumbs were fixed to `t('nav.people')` but MemberDetails.tsx was missed — it still uses `t('nav.client')` in 3 places (lines 309, 333, 350).

**Impact:** Breadcrumb says "Client" on member detail page but "People" on members list — inconsistent navigation trail.

**Fix:** Replace `t('nav.client')` with `t('nav.people')` in MemberDetails.tsx (3 occurrences).

### Issue 2 — Packages.tsx `formatType()` still uses hardcoded English

**Root cause:** The UX audit identified this but the fix was not applied. Lines 96-103 return hardcoded `'Unlimited'`, `'Sessions'`, `'PT'`.

**Impact:** Thai users see English type labels in the Packages table and CSV exports.

**Fix:** Use existing i18n keys: `t('packages.unlimited')`, `t('packages.session')`, `t('packages.pt')`.

### Issue 3 — Rooms/Classes/ClassCategories breadcrumbs use `t('nav.class')` but sidebar groups them under "Your Gym"

**Root cause:** These pages were built before the sidebar was restructured into Daily/People/Business/Your Gym groups. Breadcrumbs still reference the old "Class" group.

**Impact:** Breadcrumb shows "Class > Room layouts" but sidebar puts Rooms under "Your Gym" — confusing navigation context.

**Fix:** Change breadcrumbs to `t('nav.yourGym')` for:
- `Rooms.tsx` (line 57)
- `RoomDetails.tsx` (line 130)
- `Classes.tsx` (line 124)
- `ClassDetails.tsx` (line 104)
- `ClassCategories.tsx` (line 35)
- `ClassCategoryDetails.tsx` (check and fix)

### Issue 4 — TransferSlips breadcrumb uses `t('nav.finance')` → `t('transferSlips.title')` which is redundant since Transfer Slips is under Business group in sidebar, not under Finance

**Root cause:** Transfer Slips is rendered under `nav.business` (sidebar) but breadcrumb says "Finance > Transfer slips".

**Impact:** Minor mismatch — manageable but inconsistent.

**Fix:** Change to `t('nav.business')` → `t('transferSlips.title')`.

### Issue 5 — Staff page status labels not using i18n for `STAFF_STATUS_OPTIONS`

**Root cause:** Lines 19-24 in Staff.tsx use hardcoded English labels: `'Active'`, `'Pending'`, `'Inactive'`, `'Terminated'`. These are used in the BulkActionBar status change dropdown.

**Impact:** Thai users see English status options in the bulk status change dropdown.

**Fix:** Use `t()` calls for labels. Since `STAFF_STATUS_OPTIONS` is defined outside the component (no access to `t`), move it inside or make it a function.

### Issue 6 — Notification `formatDistanceToNow` not localized

**Root cause:** `Notifications.tsx` line 206 uses `formatDistanceToNow` without locale — always shows English relative times ("2 hours ago") even for Thai users.

**Impact:** Thai UI shows English relative timestamps.

**Fix:** Import `getDateLocale` from `@/lib/formatters` and pass `{ addSuffix: true, locale: getDateLocale(language) }`.

---

## Implementation Plan

### Step 1 — Fix MemberDetails breadcrumb (Issue 1)
- File: `src/pages/MemberDetails.tsx`
- Replace 3 occurrences of `t('nav.client')` with `t('nav.people')`

### Step 2 — Fix Packages formatType i18n (Issue 2)
- File: `src/pages/Packages.tsx`
- Change `formatType` to use `t('packages.unlimited')`, `t('packages.session')`, `t('packages.pt')`

### Step 3 — Fix breadcrumbs for Class/Room pages (Issue 3)
- Files: `Rooms.tsx`, `RoomDetails.tsx`, `Classes.tsx`, `ClassDetails.tsx`, `ClassCategories.tsx`, `ClassCategoryDetails.tsx`
- Replace `t('nav.class')` with `t('nav.yourGym')` in breadcrumbs

### Step 4 — Fix TransferSlips breadcrumb (Issue 4)
- File: `src/pages/TransferSlips.tsx`
- Replace `t('nav.finance')` with `t('nav.business')` in breadcrumb

### Step 5 — Fix Staff status options i18n (Issue 5)
- File: `src/pages/Staff.tsx`
- Move `STAFF_STATUS_OPTIONS` inside component or use `useMemo` with `t()` 

### Step 6 — Fix Notification timestamp locale (Issue 6)
- File: `src/pages/Notifications.tsx`
- Add `locale: getDateLocale(language)` to `formatDistanceToNow`

### Risk Assessment
- **Zero regression risk**: All changes are string/label replacements — no logic, state, or data contract changes
- **No DB/API changes**
- **No component structure changes**

