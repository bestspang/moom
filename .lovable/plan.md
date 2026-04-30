## 1. System analysis

- Current Phase 3/4 changes were mostly global tokens/shared components: `surface-admin`, `PageHeader`, `StatCard` `ds-chip`, and motion utilities.
- That is why many admin pages still look almost unchanged: most existing pages render their own layout using `DataTable`, filters, tabs, cards, and page-specific markup, so global typography/color tweaks are not enough to visibly match `MOOM Design System/MOOM Admin UI Kit.html`.
- The actual design kit has page-specific patterns in `MOOM Design System/ui_kits/admin/*.jsx`: sidebar/top header, KPI strips, toolbar cards, table/card shells, live indicators, tab/chip controls, and compact section cards.
- Existing admin pages must be updated in place. I will not replace a page with the mock UI or dummy data.

## 2. Problem list

1. Layout chrome still differs from DS
   - `MainLayout`, `Sidebar`, `Header` still keep older sizing/spacing behavior in key places.
   - DS expects 220px warm sidebar, compact 60px top header, orange icon emphasis, soft card shells, max-width admin canvas.

2. Shared table/card primitives are still old
   - `DataTable` still uses dark header rows (`bg-table-header`), while DS tables use white cards, light header background, 10px uppercase table labels, subtle row hover.
   - This affects Members, Lobby, Packages, Finance sub-tables, Staff, Roles, Locations, Activity Log, etc.

3. Page-specific visual parity is incomplete
   - Dashboard KPI got updated, but Lobby, Schedule, Packages, Finance, Leads, Analytics/Insights, Staff, Settings-like pages still need their DS wrappers/toolbars/KPI strips applied around existing data.

4. Motion exists but is barely visible
   - Admin motion utilities were added, but not applied to real live indicators, drawer/dialog entry shells, table rows, or page sections where DS uses restrained transitions.

5. Existing console warning should be handled carefully
   - There is a browser warning from `DailyBriefingCard`/`Skeleton` receiving refs. Because `src/components/ui/*` is protected, I will avoid editing shadcn primitives unless explicitly necessary; I can first try a local safe wrapper/markup fix in `DailyBriefingCard`.

## 3. Design

The next pass should make the app visibly match the Admin UI Kit by applying DS primitives to existing pages:

- Create or expand `src/components/admin-ds/*` as thin presentational wrappers only.
- Update current pages/components to use those wrappers while preserving:
  - existing hooks (`useCheckIns`, `useScheduleByDate`, `useFinanceTransactions`, etc.)
  - mutations and `logActivity()` behavior
  - permission gates (`can(...)`, `ProtectedRoute`)
  - routes and navigation
  - i18n strings
  - real data only, no mock datasets from the design kit
- Use DS motion only where it maps to real UI:
  - page/section fade-in
  - live status dots
  - hover transitions on rows/cards
  - dialog/drawer entry polish if wrapper-level safe

## 4. Plan

### Phase 5A — Make shared admin chrome visibly DS
Files likely touched:
- `src/components/layout/MainLayout.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Header.tsx`
- `src/index.css`
- `src/components/admin-ds/*`

Work:
- Align admin layout to DS canvas: 220px desktop sidebar, compact content container, 60px header behavior, tight spacing.
- Style Sidebar to match Admin UI Kit:
  - warm cream sidebar surface
  - orange icons for inactive/group rows
  - orange active row
  - compact 13px labels
  - preserve all permission filtering, badges, nav routes, group open/close state.
- Style Header to match DS top header:
  - white 60px header with subtle border
  - compact icon buttons
  - keep theme toggle, notifications, language selector, avatar dropdown, surface switcher, logout.
- Add reusable admin wrappers:
  - `AdminToolbarCard`
  - `AdminSegmentedControl`/chip style wrapper where safe
  - `AdminTableShell`/row hover classes
  - `AdminLiveDot`
  - optional `AdminMetricStrip` helper

### Phase 5B — Update high-impact pages in place
Files likely touched:
- `src/pages/Lobby.tsx`
- `src/pages/Schedule.tsx`
- `src/pages/Packages.tsx`
- `src/pages/Finance.tsx`
- selected `src/components/finance/*`
- `src/components/common/DataTable.tsx`

Work:
- `DataTable`: switch admin tables from dark header to DS light header/table-card look, add row hover. Keep columns, selection, sorting, pagination, empty states intact.
- `Lobby`: add DS live/operator hero or compact stats strip based on current real `checkInData`; add live dot only for current-day view; move filters/actions into DS toolbar card; preserve check-in and QR dialogs.
- `Schedule`: apply DS toolbar card for date/search/view controls; apply `variant="ds-chip"` to schedule stats; improve availability cells with DS capacity bar; preserve list/timeline toggle and booking dialog.
- `Packages`: add DS KPI strip from real `usePackageStats` + package list counts; move search/status/actions into DS toolbar card; keep bulk selection/import/export/create/details routes.
- `Finance`: align top tabs/toolbar and overview cards with DS shells; update Finance subcomponents visually where they have matching DS screens; keep export/import/slip approval/expense flows unchanged.

### Phase 5C — Second batch pages that have direct DS matches
Files likely touched after 5B:
- `src/pages/Leads.tsx`
- `src/pages/Analytics.tsx` or `src/pages/Insights.tsx` depending current routing/data
- `src/pages/Staff.tsx`
- `src/pages/Classes.tsx`
- `src/pages/ClassCategories.tsx`
- `src/pages/Rooms.tsx`
- `src/pages/Promotions.tsx`
- `src/pages/Announcements.tsx`
- `src/pages/Settings.tsx`, `Roles.tsx`, `Locations.tsx`, `ActivityLog.tsx` only where DS has equivalent patterns

Work:
- Update only pages that have a matching UI kit file.
- Use existing data/table/dialog logic; do not paste mock datasets.
- For DS pages without current product equivalents (`Branding`, `Programs`, alternate `GamificationB`), do not add live fake pages. If a placeholder is required, it will be inert/disabled per project rule, but no route will be added unless explicitly approved because `src/App.tsx` is protected.

### Phase 5D — Motion and warning cleanup
Files likely touched:
- `src/index.css`
- page files/components where live indicators exist
- `src/components/dashboard/DailyBriefingCard.tsx`

Work:
- Apply `animate-admin-pulse` to real live/status dots only.
- Apply restrained section/page entrance motion (`animate-page-enter-desktop`) consistently.
- Add `prefers-reduced-motion` coverage for any new admin animations.
- Fix the `DailyBriefingCard` ref warning without touching `src/components/ui/skeleton.tsx` if possible.

### Phase 5E — Documentation and verification
Files likely touched:
- `docs/DEVLOG.md`
- possibly `docs/SMOKE_TEST.md` only if checklist needs an Admin DS visual smoke section

Verification:
- Build/typecheck via project harness.
- Smoke through:
  1. Admin dashboard loads
  2. Sidebar links still route correctly
  3. Header notifications/avatar/language/theme still work
  4. Lobby search/date/check-in/QR dialog still work
  5. Schedule date/filter/list/timeline/booking dialog still work
  6. Packages search/status/bulk/import/export/create/detail still work
  7. Finance tabs/export/import/slip detail still work
  8. Permission-gated buttons remain hidden for unauthorized roles
  9. No fake buttons/routes introduced
  10. Member/Trainer/Staff surfaces unaffected

## 5. Code changes

After approval I will implement in small chunks:

1. Shared DS admin wrappers and chrome.
2. Shared table/card visible update.
3. Lobby + Schedule page parity.
4. Packages + Finance page parity.
5. Matched remaining pages, one group at a time.
6. Motion application + warning cleanup.
7. DEVLOG update.

No database, auth, RLS, route-table, realtime, or generated integration files will be changed in this pass.

## 6. Regression checklist

Must preserve:
- Existing business logic and all data hooks.
- Existing mutations and audit logging.
- Existing role/permission checks.
- Existing i18n usage.
- Existing routes and navigation.
- Existing dialogs/drawers/forms.
- Existing Member/Trainer/Staff UI.
- No mock data copied from the UI kit into live pages.

## 7. Doc updates

- Append a new `docs/DEVLOG.md` entry for Phase 5 with:
  - files touched
  - DS screens matched
  - functions deliberately preserved
  - deferred screens without current equivalents
  - verification checklist result

If you approve, I’ll start with Phase 5A/5B first so the changes are immediately visible across admin pages instead of only subtle token changes.