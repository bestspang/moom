# Admin UI Alignment with MOOM Design System

## Goal
Update **existing admin pages** so their visual language (header, KPI strip, cards, tables, spacing, typography, accents) matches `MOOM Design System/ui_kits/admin/*`. Keep **all data hooks, mutations, permissions, RLS, routes, realtime, activity logging, and i18n intact**. No new routes, no fake data, no removal of working features.

## Scope — Page Mapping (DS → existing admin page)

Mapped (will visually update, behavior unchanged):

| Design System | Existing admin page | Action |
|---|---|---|
| Dashboard (Modern.jsx hero+KPI+chart+attention) | `src/pages/Dashboard.tsx` | Restyle hero/KPI strip/section headers; keep all 5 KPIs, Goal/Health/Forecast/Schedule/Activity/Briefing rows |
| Lobby.jsx | `src/pages/Lobby.tsx` | Restyle header + cards |
| Schedule.jsx | `src/pages/Schedule.tsx` | Restyle list/roster shell |
| Members (Modern.jsx MembersTableV2) | `src/pages/Members.tsx` | Restyle KPI strip + table chrome |
| Leads.jsx | `src/pages/Leads.tsx` | Restyle header + table |
| Packages.jsx | `src/pages/Packages.tsx` | Restyle list/cards |
| Promos.jsx | `src/pages/Promotions.tsx` | Restyle list/cards |
| Finance.jsx | `src/pages/Finance.tsx` | Restyle KPI + transactions |
| Analytics.jsx | `src/pages/Insights.tsx` (+ `Analytics.tsx`, `Reports.tsx` if same shell) | Restyle KPI + chart cards |
| Gamification.jsx / GamificationB.jsx | `src/pages/gamification/*` (existing pages only) | Restyle headers/cards |
| Trainers.jsx | `src/pages/Staff.tsx` (trainer staff list) | Restyle header + table |
| Classes.jsx + ClassesMain.jsx | `src/pages/Classes.tsx` | Restyle list/cards |
| Categories.jsx | `src/pages/ClassCategories.tsx` | Restyle |
| Rooms.jsx | `src/pages/Rooms.tsx` | Restyle |
| Programs.jsx | `src/pages/WorkoutList.tsx` | Restyle (closest equivalent) |
| Announcements.jsx | `src/pages/Announcements.tsx` | Restyle |
| Branding.jsx | `src/pages/settings/*` branding section if exists | Restyle only if a current section maps; otherwise skip |
| Settings.jsx | `src/pages/Settings.tsx` + `src/pages/settings/*` | Restyle layout shell only |

Not in DS — leave untouched (style only via shared primitives if they pick up token changes):
`ActivityLog`, `Locations`, `Roles`, `RoleEditor`, `MemberDetails`, `StaffDetails`, `ClassDetails`, `ClassCategoryDetails`, `PackageDetails`, `PromotionDetails`, `RoomDetails`, `CreateClass`, `CreatePackage`, `CreatePromotion`, `TransferSlips`, `Notifications`, `Profile`, `CheckinDisplay`, `CheckinRedeem`, `MemberAppPreview`, `TrainerAppPreview`, `DiagnosticsDataAudit`, `ComingSoon`, `NotFound`, `Index`, `Auth/*`, `liff/*`, `reports/*`.

DS-only screens with **no current page** (e.g. dedicated Branding page, standalone Programs/Promos shell): per user instruction, add a **placeholder route entry** under a new "Coming Soon" section that links to `/coming-soon` (existing). I will **not create new functional pages** — only ensure DS screens that have no home are noted in `docs/DEVLOG.md` as "to-be-developed" with a checklist. No new sidebar items unless a navigation slot already exists.

## Approach

Phase 1 — Shared visual primitives (foundation, reused by all pages):
1. Inspect DS tokens in `Theme.jsx` + `Components.jsx` (colors, radius, shadows, accents: orange/teal/info/pink).
2. Map DS tokens onto existing CSS variables in `src/index.css` **without changing semantic names**. Only adjust hue/lightness if needed, and only inside `.surface-admin { ... }` so member/trainer/staff are unaffected.
3. Create thin admin-only presentational wrappers (no logic) under `src/components/admin-ds/`:
   - `AdminPageHeader` (title + subtitle + right-side action slot)
   - `AdminKpiCard` (label, value, delta, accent, icon) — wraps existing `StatCard`/Card; same props surface where possible
   - `AdminSectionHeader` (title + subtitle + optional action)
   - `AdminCard` (Card variant with DS spacing/border/shadow)
   These wrap shadcn `Card` — they do **not** replace it.

Phase 2 — Page-by-page restyle (one page per commit-sized chunk):
For each mapped page:
- Open DS source, capture layout grid + visual tokens.
- Replace **only** outer header / KPI grid / section dividers / card chrome with DS wrappers.
- Keep every existing `useQuery`, `useMutation`, permission gate, dialog, table column, row action, badge, empty state, loading skeleton, route link, realtime subscription, i18n key, and activity log call **byte-for-byte**.
- Preserve dark mode (DS is light-only — derive dark variants from existing tokens).
- Preserve responsive breakpoints (DS targets 1280+; on `<lg` keep current responsive behavior).

Phase 3 — Verification per page:
- Build passes (TS errors surface in build).
- Compare rendered page vs DS screen at 1280px.
- Smoke: page loads, primary CTA works, table sort/search works, dialog opens, mutation fires toast + activity log.
- No removed buttons/columns/badges; diff each page against pre-change file.

## Order of execution (chunked, stops are safe)

1. Foundation: tokens + `src/components/admin-ds/*` wrappers.
2. Dashboard.
3. Members + Leads.
4. Schedule + Lobby.
5. Packages + Promotions.
6. Finance + Insights/Analytics/Reports.
7. Classes + ClassCategories + Rooms + WorkoutList.
8. Staff (Trainers) + Announcements.
9. Settings shell + Gamification pages.
10. DEVLOG entry + smoke checklist update.

After each step I'll re-check the page renders without console errors before moving to the next.

## Hard rules I'll follow

- No edits to `src/components/ui/*` (shadcn primitives).
- No edits to `AuthContext`, `hostname.ts`, `App.tsx` route table, or `useRealtimeSync`.
- No DB / RLS / edge-function changes.
- No removal of existing chips/cards/columns/actions.
- No new dependencies.
- Member / Trainer / Staff surfaces untouched — all DS changes are scoped under `.surface-admin` or admin-only components.
- Every i18n string already present stays; no raw English added.
- DS screens without a current admin home → documented in DEVLOG as "future work", **not** built as empty new pages.

## Risks & mitigations

- Token shifts could leak to other surfaces → scope under `.surface-admin`.
- DS uses inline styles + custom fonts (Anuphan) → I'll map to existing Tailwind tokens + IBM Plex Sans Thai/Inter (per Core memory). I will **not** add Anuphan unless approved.
- Large surface area → executed in small chunks with verification gates between each page.

## Deliverables

- Updated admin pages (visual only).
- New `src/components/admin-ds/*` wrappers.
- Scoped token additions in `src/index.css` under `.surface-admin`.
- `docs/DEVLOG.md` entry listing every page touched + DS screens deferred.

Approve and I'll start with Phase 1 (tokens + wrappers) and Dashboard.
