## Sidebar status: ✅ DS-aligned

Sidebar now has: 7-group taxonomy, Pins shortcut row, group dividers in collapsed mode, urgent dot on closed groups, branch switcher, search w/ ⌘K kbd, attention card, footer. RBAC AND-gate intact. Done.

## Why "ทุกหน้ายังเหมือนเดิม"

Because beyond the sidebar, the admin pages haven't been migrated yet. The DS primitives (`AdminPageHeader`, `AdminKpiCard`, `AdminCard`, `AdminSectionHeader`, `AdminToolbar`) exist in `src/components/admin-ds/` but the pages still use the legacy `PageHeader` + raw `Card` patterns. Plan rolls them out page-by-page, starting with the page you're on (**Packages**, `/package`), since it has the biggest visible delta vs `MOOM Design System/ui_kits/admin/Packages.jsx`.

## Plan — Chunk E: Packages page DS migration

### Scope (this chunk only)
File: `src/pages/Packages.tsx` (the list view at `/package`). Nothing else.

### Visual gap vs DS `Packages.jsx`
| DS element | Current | Action |
|---|---|---|
| 4-up **KPI strip** above the table (Active packages / Active subscriptions / 30-day revenue / ARPU) | None | Add using `AdminKpiCard` × 4, fed by existing `usePackageStats()` + `usePackages()` data — **no new hooks, no new queries** |
| `AdminPageHeader` (DS title block) | `PageHeader` (legacy with breadcrumbs) | Swap to `AdminPageHeader`; keep the same actions slot (Manage dropdown + Create button + RBAC gate) |
| **Toolbar card** (search + status select + sort + view toggle) wrapped as a single DS card | Loose `SearchBar` in a div + `StatusTabs` below | Wrap search + the existing `StatusTabs` in one `AdminCard` toolbar; keep status tabs as-is (they already drive `usePackages(activeTab, search)`) |
| **Grid view** (`PackageCard` masonry) + **view toggle** (grid/table) | Table only | Add a `view` local state (`'grid' \| 'table'`, default `'table'` to keep current UX), persisted in `localStorage` under `moom-pkg-view`. Grid renders `AdminCard` tiles using existing package fields (`name`, `type`, `price`, `term_days`, `sessions`, `is_popular`). Click → existing `navigate('/package/:id')`. No new data, no new actions. |
| Detail drawer | Already a separate route (`/package/:id`) | **Skip** — DS drawer is page-replaced by the existing detail route. Leave it alone. |
| Sort dropdown | None | **Skip this chunk** — sort would require touching `usePackages()` hook signature. Out of scope per "ห้าม function ที่ทำงานอยู่แล้วขาด". Add TODO comment. |

### Data wiring (zero new queries, zero hook changes)
- `usePackages(activeTab, search)` → table rows AND grid tiles (same data, two presentations).
- `usePackageStats()` → KPI 1 ("Active packages") = `stats.on_sale`.
- KPI 2/3/4 (Active subscriptions / Revenue / ARPU): values that aren't in current hooks → render the KPI tile with `value="—"` and a "Coming soon" subtitle following the project's Coming Soon pattern (`opacity-60 pointer-events-none`). **Do not invent fake numbers.** When the hooks gain those fields later, swap `—` → real value, no layout change.
- All existing handlers (`handleExport`, `handleSelectRow`, `handleSelectAll`, `clearSelection`, `BulkActionBar`, `ImportCenterDialog`, RBAC via `can('packages', 'write')`) are **preserved verbatim**.

### Motion / animation
- KPI cards: rely on existing `MainLayout` `animate-page-enter-desktop` (already wraps every route). No new keyframes.
- Grid card hover: matches `AdminKpiCard`'s built-in `hover:-translate-y-px hover:shadow-md`.
- View-toggle switch: pure CSS `transition-colors`, no JS animation.

### i18n
- New keys: `packages.kpi.activePackages`, `packages.kpi.ofTotal`, `packages.kpi.activeSubs`, `packages.kpi.revenue30d`, `packages.kpi.arpu`, `packages.view.grid`, `packages.view.table`. Add to both `th.ts` and `en.ts`.

### Files to touch (1 page + 2 locales)
```
src/pages/Packages.tsx     — KPI strip, AdminPageHeader, view toggle, grid renderer
src/i18n/locales/th.ts     — new packages.kpi.* + packages.view.* keys
src/i18n/locales/en.ts     — same
```

### Out of scope (intentionally — keeping the diff surgical)
- No changes to `usePackages`, `usePackageStats`, `useBulkUpdatePackageStatus`, `useBulkDeletePackages`, `useBulkDuplicatePackages`, `useLocations`.
- No changes to routes, `/package/create`, `/package/:id` detail page, `ImportCenterDialog`.
- No new sort logic, no detail drawer, no promo rules section (those are separate pages already).
- Other pages (Members, Leads, Finance, Classes, etc.) — **next chunks**, page by page, same approach.

### Verification (smoke matrix)
- Build passes.
- `/package` renders KPI strip with 1 real value + 3 "—" tiles.
- Status tabs still filter (`on_sale`/`scheduled`/`drafts`/`archive`) — counts match.
- Search still filters.
- Bulk select → bulk delete/duplicate/status change still works.
- Row click → still navigates to `/package/:id`.
- `localStorage` persists view toggle.
- Manager (level_3) sees Create + Manage dropdown; Operator (level_2) sees neither.

### Risk / rollback
- Risk: layout change only — no behavior, no data, no permissions touched.
- Rollback: revert `Packages.tsx` and the two i18n diffs.

### After this chunk
Confirm with you, then proceed in the same surgical style to **Members → Leads → Finance → Classes → Schedule → Lobby → Promotions → Rooms → Categories → Announcements → Insights → Gamification → Locations → Staff → Roles → Activity Log → Settings → Branding**, mapped 1:1 against the DS `ui_kits/admin/*.jsx` files. Pages that exist in the app but not in DS are left untouched, as instructed.
