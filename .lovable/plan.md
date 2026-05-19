## Chunk G — Split Branding from Settings + adopt DS Settings shell

Per the screenshots, Settings should use a single **left vertical icon nav** (no top pill bar), and Branding should be its own top-level page — not a Settings sub-tab.

### 1. Split Branding into its own route

| Before | After |
|---|---|
| `/setting/branding` (nested under `<Settings>` outlet, appears in Settings tabs) | `/branding` (top-level route, own page) |

Changes:
- `src/App.tsx` — register `<Route path="branding" element={<ProtectedRoute minAccessLevel="level_3_manager"><SettingsBranding /></ProtectedRoute>} />` directly under `<MainLayout>`. Keep `/setting/branding` as `<Route path="branding" element={<Navigate to="/branding" replace />} />` for backward compatibility.
- `src/pages/Settings.tsx` — remove the `branding` entry from `tabs[]`.
- `src/components/layout/Sidebar.tsx` — change `nav.branding` item path from `/setting/branding` → `/branding`.
- `src/pages/settings/SettingsBranding.tsx` — **unchanged** (the page already renders standalone; it doesn't depend on the Settings shell).

### 2. Rework Settings shell to DS pattern (per screenshot 2)

Replace the current top horizontal pill bar with a single 2-column layout:

```text
┌───────────────────────────────────────────────────────┐
│ ตั้งค่า                                                │
│ ตั้งค่าระบบ · การแจ้งเตือน · การชำระเงิน · ความปลอดภัย │
├───────────────────────────────────────────────────────┤
│ ╔═════════╗  ┌─────────────────────────────────────┐  │
│ ║ ⚙ ทั่วไป ║  │ <Outlet />                          │  │
│ ║ 🔔 แจ้ง   ║  │ (subpage content unchanged)         │  │
│ ║ 💳 จ่าย   ║  │                                     │  │
│ ║ 🔌 เชื่อม ║  │                                     │  │
│ ║ 🔒 ปลอด.  ║  │                                     │  │
│ ╚═════════╝  └─────────────────────────────────────┘  │
└───────────────────────────────────────────────────────┘
```

Details:
- Use `AdminPageHeader` for the title + subtitle line (subtitle = bullet-separated tab labels, matches screenshot).
- Left nav: vertical list of `NavLink`s, each with a lucide icon, ~220px wide, rounded item rows. Active row uses `bg-sidebar-accent` token + bold orange icon (same active pattern as the main sidebar so look stays consistent and theming flows through the future Branding tokens).
- Items get icons from lucide: `Settings` (general), `BookOpen` (class-management), `Users` (client-management), `Package` (setting-package), `FileSignature` (member-contracts), `Flag` (feature-flags), `Upload` (import-export), `Plug` (integrations).
- Mobile: keep the existing `Select` dropdown fallback. No behavior change.
- Subpages render via `<Outlet />` — **no changes to subpage files**. Each subpage currently wraps itself in its own `SettingsLayout` with an internal sub-nav. Those nested sub-navs stay because they navigate within-page sections (e.g., Theme / Timezone / Payment inside General), which is a different axis than the shell tabs. Out of scope to refactor today.

### Files touched (3)
```
src/App.tsx                            — add /branding route, redirect old path
src/pages/Settings.tsx                 — replace pill bar with left vertical icon nav, remove branding tab
src/components/layout/Sidebar.tsx      — nav.branding path → /branding
```

### Out of scope
- No DB, RLS, hook, query, or RBAC changes (Branding's `minAccessLevel="level_3_manager"` preserved on the new route).
- No edits to `SettingsBranding.tsx` or any other subpage.
- No removal of `settings.tabs.branding` i18n key (kept harmless for now).
- Other admin pages (Members, Leads, Finance, etc.) — next chunks.

### Motion
- Outlet wrapper keeps existing `animate-in fade-in-0 slide-in-from-bottom-2 duration-200`.
- Left nav row active-bar uses `animate-fade-in` (already in project) — matches main sidebar pattern.

### Regression checklist
- `/branding` works directly (manager+ only).
- `/setting/branding` redirects to `/branding` (no broken bookmarks).
- Sidebar "แบรนด์ยิม" still highlights when on `/branding`.
- Sidebar "ตั้งค่าระบบ" still navigates to `/setting/general` and highlights on any `/setting/*` route.
- Settings left nav highlights the active subpage; clicking each row navigates without page reload.
- All 8 remaining Settings subpages load (General, Class, Client, Package, Contracts, FeatureFlags, ImportExport, Integrations).
- Mobile dropdown still works.
- No console errors.
