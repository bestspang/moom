

# Sync & Consistency Audit — Round 3

## Verified Working (No Changes)
- Auth: Google OAuth + inactive gate ✅
- AuthContext: staffStatus fetch + auto-signout ✅  
- MemberDetails breadcrumbs: `nav.people` ✅
- Rooms/Classes/ClassCategories/RoomDetails/ClassDetails breadcrumbs: `nav.yourGym` ✅
- TransferSlips breadcrumb: `nav.business` ✅
- Staff status options: i18n inside component ✅
- Notifications timestamp: `getDateLocale(language)` ✅
- Packages `formatType`: uses `t()` ✅
- Finance `formatPaymentMethod`: uses `t()` ✅
- Finance status labels in transaction table: uses `t()` ✅
- DataTable pagination: `t('common.of')` ✅
- Dashboard stat cards: clickable ✅
- CheckInDialog: auto-select single location ✅
- Profile: syncs to staff table ✅
- ResetPassword/ForgotPassword: uses i18n ✅

---

## Issues Found (3 real issues)

### Issue 1 — `CreateClass.tsx` breadcrumb still uses `t('nav.class')` 
**Root cause:** Was missed during the breadcrumb alignment pass. All other class/room pages were fixed but CreateClass was not.
**Fix:** Change line 78 from `t('nav.class')` to `t('nav.yourGym')`.

### Issue 2 — Login.tsx has hardcoded English error string
**Root cause:** Line 59 — `'Google sign-in failed'` is hardcoded, not using i18n.
**Fix:** Replace with `t('auth.googleSignInFailed')` and add the key to both `en.ts` and `th.ts`.

### Issue 3 — Finance CSV export headers are all hardcoded English
**Root cause:** Lines 155-169 in `Finance.tsx` — CSV column headers like `'Date & Time'`, `'Transaction no.'`, `'Payment method'` are hardcoded strings. This is acceptable for CSV exports (standard practice — CSV headers are typically kept in English for data interoperability), so this is **low priority** and NOT a bug. Mentioning for awareness only — no action needed.

---

## Implementation Plan

### Step 1 — Fix CreateClass breadcrumb
- File: `src/pages/CreateClass.tsx` line 78
- Change `t('nav.class')` → `t('nav.yourGym')`

### Step 2 — Fix Login Google error string
- File: `src/pages/Auth/Login.tsx` line 59
- Change `'Google sign-in failed'` → `t('auth.googleSignInFailed')`
- Add i18n keys:
  - `en.ts`: `googleSignInFailed: 'Google sign-in failed'`
  - `th.ts`: `googleSignInFailed: 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้'`

### Risk: Zero — string replacements only, no logic changes.

---

## Feature Suggestions (verified safe to add)

These are additive features that won't break existing functionality:

1. **Lead detail slide-over panel** — Currently clicking a lead row does nothing. Adding a sheet/drawer that shows lead details + edit form would improve the Leads journey without changing any existing components.

2. **Member search in Command Palette** — Currently only searches members + leads. Could add classes, packages, and staff to `CommandPalette.tsx` search results for faster navigation. Purely additive — extends the existing `results` array.

3. **Sidebar "expiring" badge color differentiation** — Both `expiringCount` and `pendingSlips` use `bg-destructive` (red). Changing expiring packages to `bg-amber-500` (warning) would visually differentiate urgency levels. CSS-only change in `Sidebar.tsx`.

