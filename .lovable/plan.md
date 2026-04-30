# Sidebar — DS Modern Alignment (Phase 5C-Chunk D)

The light theme + tokens + interactive parts (collapse, branch switcher, search, attention card, RBAC) are already in place. What still differs from `MOOM Design System/ui_kits/admin/Modern.jsx` is **information architecture** (group taxonomy + width). This pass is structure-only — no route, no permission, no hook changes.

## Changes (single file: `src/components/layout/Sidebar.tsx`)

### 1. Width: 220 → 252px (DS spec)
- `widthClass = collapsed ? 'w-[68px]' : 'w-[252px]'`
- Update `MainLayout.tsx` `paddingLeft` to match (`lg:pl-[252px]` when expanded).

### 2. Re-group nav into DS's 6 groups (was 3)

```text
Before                          After (matches DS Modern.jsx)
──────                          ─────────────────────────────
[ungrouped daily]              home     → dashboard, lobby, schedule
people    → members, leads     people   → members, leads, trainers*
business  → 5 items            business → packages, promos, finance,
yourgym   → 10 items                       insights, gamification
                               gym      → classes, categories,
                                          rooms, workouts
                               comms    → announcements
                               org      → locations, staff, roles,
                                          activity-log
                               settings → branding*, settings
```

*New items:
- **trainers** — points to `/admin?tab=trainers` (or `/admin` — same page filtered). Resource: `staff`, minLevel `level_3_manager`. If route doesn't exist yet, link to `/admin` as placeholder.
- **branding** (แบรนด์ยิม) — points to `/setting/branding`. Resource: `settings`, minLevel `level_3_manager`. Page itself isn't built yet → user said "ส่วนหน้าไหนที่อันเก่าไม่มีให้เอาไปใส่ไว้เพื่อรอพัฒนาระบบต่อไป", so we add the nav entry only; route can render existing Settings page or a placeholder later. I'll verify the route table before linking.

### 3. Auto-open the group containing the active route
Add a `useEffect` watching `location.pathname` that flips `openGroups[groupId] = true` when a route inside that group is active. Mirrors DS lines 148-151. Persists alongside existing state.

### 4. Wrap "home" items in a group (instead of free-floating + divider)
Removes the manual `<div className="h-px bg-sidebar-border my-3" />` divider; replaces with a proper `home` group whose label is "หน้าหลัก". Default `openGroups.home = true`.

### 5. i18n keys to add (EN + TH)
- `nav.home` → "หน้าหลัก" / "Home"
- `nav.gym` → "ยิม" / "Gym" (rename group; existing `nav.yourGym` stays for back-compat)
- `nav.comms` → "สื่อสาร" / "Comms"
- `nav.org` → "องค์กร" / "Organization"
- `nav.settingsGroup` → "ตั้งค่า" / "Settings"
- `nav.trainers` → "เทรนเนอร์" / "Trainers"
- `nav.branding` → "แบรนด์ยิม" / "Gym Branding"

## Out of scope (do NOT touch this pass)
- `usePermissions.ts`, RBAC logic, `hasAccess()` — unchanged.
- Route table in `src/App.tsx` — unchanged. (If `/setting/branding` doesn't exist, the link will 404 until that page is built — that matches the user's "wait for development" instruction, but I'll confirm and either point at an existing route or add a minimal placeholder route render in Settings.)
- Hooks (`useDashboardStats`, `useTransferSlips`, `useExpiringPackages`) — unchanged.
- Visual tokens / colors / index.css — unchanged.
- TopBar, Dashboard, other pages — separate chunk.

## Verification gate
1. All 4 RBAC roles still see correct items (re-test after group reshuffle):
   - L1: dashboard, lobby, members, announcements (only items with no `minLevel` gate or read access)
   - L2: + schedule, packages, promos, finance, insights, classes/categories/rooms/workouts, activity-log
   - L3: + gamification, trainers, staff, locations, settings, branding
   - L4: + roles
2. Active route highlights correctly across all 24 nav items.
3. Auto-open: navigating to `/finance` opens "business" group if collapsed.
4. Collapse → expand preserves group state.
5. No console errors; no layout shift in main content (252px confirmed in MainLayout).

## Files touched
- `src/components/layout/Sidebar.tsx` (re-group, width, auto-open effect)
- `src/components/layout/MainLayout.tsx` (padding 220 → 252)
- `src/i18n/locales/en.ts`, `src/i18n/locales/th.ts` (7 new keys)

No new components, no new hooks, no DB, no edge functions. ~80 LOC delta.
