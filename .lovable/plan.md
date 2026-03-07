

# Mobile Responsiveness Audit — Findings & Plan

## Verified Working (No Changes Needed)
- MainLayout: sidebar overlay on mobile with fixed header ✅
- Header: hamburger menu on mobile, compact notification/profile dropdowns ✅
- PageHeader: `flex-col sm:flex-row` for title + actions ✅
- Settings page: dropdown selector on mobile instead of tabs ✅
- SettingsSidebar/SettingsLayout: dropdown on mobile ✅
- DataTable: horizontal scroll with indicator ✅
- CreateMemberDialog: uses Drawer on mobile ✅
- CreateLeadDialog: uses Drawer on mobile ✅
- CreateStaffDialog: uses Drawer on mobile ✅
- ScheduleClassDialog: uses Drawer on mobile ✅
- BookingManagementDialog: uses Drawer on mobile ✅
- Dashboard KPI cards: `grid-cols-1 sm:grid-cols-3` ✅
- CreatePackage form: `grid-cols-1 lg:grid-cols-3` ✅
- Profile page: `max-w-2xl`, `grid-cols-1 md:grid-cols-2` ✅
- RoleEditor: `grid-cols-2 md:grid-cols-4` for access level cards ✅
- Analytics charts: `ResponsiveContainer width="100%"` ✅

---

## Issues Found (5 real issues)

### Issue 1 — Console Warning: StatCard missing `forwardRef` (causes React ref warning)

**Root cause:** `StatCard` is a function component that receives a ref via `onClick` wrapping in Dashboard (Link/navigation). Console shows: "Function components cannot be given refs." This happens because Dashboard passes `onClick` which triggers cursor-pointer but the component itself doesn't use `forwardRef`.

**Impact:** Console warnings on every Dashboard render. Not a crash but clutters debugging and indicates a potential issue if tooltip/forwarding is added later.

**Fix:** Wrap `StatCard` with `React.forwardRef` in `src/components/common/StatCard.tsx`.

### Issue 2 — CheckInDialog does NOT use Drawer on mobile

**Root cause:** `CheckInDialog` (lobby/CheckInDialog.tsx) uses only `<Dialog>` without checking `useIsMobile()`. Unlike CreateMemberDialog, CreateLeadDialog, ScheduleClassDialog, and BookingManagementDialog which all have Drawer fallback, CheckInDialog does not.

**Impact:** On mobile, the check-in dialog appears as a centered modal that may be hard to interact with. The member search dropdown + package selector can overflow on small screens. This is a frequently used dialog (also FAB on Dashboard).

**Fix:** Add `useIsMobile()` and render as `<Drawer>` on mobile, matching the pattern used in other dialogs.

### Issue 3 — MemberDetails stat cards grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`

This is correctly responsive ✅ — no issue here.

### Issue 4 — Several dialogs missing Drawer on mobile

The following dialogs use only `<Dialog>` without Drawer mobile fallback:
- `CheckInDialog` (heavily used — check-in from Dashboard FAB & Lobby)
- `CheckInQRCodeDialog` (QR code display)
- `CreateRoomDialog` (max-w-2xl — very wide on mobile)
- `CreateClassCategoryDialog` (simple form — sm:max-w-md is OK)
- `CreateAnnouncementDialog` (max-w-md — OK but has date pickers that can overflow)
- `EditMemberDialog` (max-w-lg — long form)
- `EditLocationDialog` (max-w-lg)
- `CreateLocationDialog` (max-w-lg)
- `ImportCenterDialog` (max-w-2xl — complex multi-step)
- `EditWorkoutItemDialog` (max-w-md — simple)
- `EditTrainingNameDialog` (max-w-sm — simple)
- `EditPackagesDialog` (max-w-lg)
- `CreateTrainingDialog` (max-w-3xl — very wide)
- `SlipDetailDialog` (detail view)

**Priority assessment:** Not all need Drawer. Simple small dialogs (max-w-md, max-w-sm) work fine as Dialog on mobile. The critical ones are:
1. **CheckInDialog** — high-frequency, has member search dropdown
2. **ImportCenterDialog** — max-w-2xl, multi-step with file upload
3. **CreateRoomDialog** — max-w-2xl
4. **CreateTrainingDialog** — max-w-3xl
5. **EditMemberDialog** — long form

**Fix:** Convert the top 3 most impactful dialogs to use Drawer on mobile: CheckInDialog, ImportCenterDialog, CreateRoomDialog.

### Issue 5 — Header notification dropdown `formatDistanceToNow` not localized

**Root cause:** Header.tsx line 156 uses `formatDistanceToNow` without locale — same bug as was fixed in Notifications.tsx but missed in the Header notification dropdown.

**Impact:** Thai users see English timestamps ("2 hours ago") in the header notification preview dropdown.

**Fix:** Import `getDateLocale` and `useLanguage`, pass `{ addSuffix: true, locale: getDateLocale(language) }`.

---

## Implementation Plan

### Step 1 — Fix StatCard forwardRef warning
- File: `src/components/common/StatCard.tsx`
- Wrap component with `React.forwardRef`
- Zero regression — additive change

### Step 2 — Convert CheckInDialog to use Drawer on mobile
- File: `src/components/lobby/CheckInDialog.tsx`
- Import `useIsMobile`, `Drawer`, `DrawerContent`, `DrawerHeader`, `DrawerTitle`
- Extract form content into a shared variable
- Render Drawer when `isMobile`, Dialog otherwise
- Follow exact pattern from CreateMemberDialog

### Step 3 — Convert ImportCenterDialog to use Drawer on mobile
- File: `src/components/import/ImportCenterDialog.tsx`
- Same pattern: useIsMobile + Drawer fallback

### Step 4 — Convert CreateRoomDialog to use Drawer on mobile
- File: `src/components/rooms/CreateRoomDialog.tsx`
- Same pattern

### Step 5 — Fix Header notification timestamp locale
- File: `src/components/layout/Header.tsx`
- Import `getDateLocale` from `@/lib/formatters`
- Add `locale: getDateLocale(language)` to `formatDistanceToNow` on line 156

### Risk Assessment
- **StatCard forwardRef**: Zero regression — wrapping with forwardRef is backward compatible
- **Drawer conversions**: Same pattern already used in 5 other dialogs — proven safe. Form logic stays identical, only the wrapper changes.
- **Header locale**: String-only change — zero regression

