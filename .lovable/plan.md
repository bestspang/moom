
# Phase 5C-Chunk C — Sidebar uplift to match MOOM DS

## Why the sidebar still looks unchanged
The DS mockup (`MOOM Design System/ui_kits/admin/Modern.jsx` → `ModernSidebar`) is a **light** rail (white surface, orange `#F97316` accents, dark text, soft borders).
But our `src/index.css` defines:
```
--sidebar-background: 220 20% 8%;   /* dark navy */
--sidebar-foreground: 30 10% 95%;   /* near-white text */
```
So the sidebar reads as a dark navy slab. Until we flip those tokens AND add the missing structural pieces (brand block, branch switcher, search, pinned, groups, attention card, collapse), no `Sidebar.tsx` tweak will look like the mockup.

This chunk fixes both: **DS-aligned tokens** + **structural rebuild of `Sidebar.tsx`** that consumes those tokens (so the future "แบรนด์ยิม" page can re-skin everything from one place).

---

## What stays the same (zero regression contract)
- All existing nav items, paths, icons, badge data, permission gates (`hasAccess`, `can`, `accessLevelOrder`, `minLevel`, `resource`).
- All existing data hooks: `useExpiringPackages`, `useTransferSlipStats`, `useLanguage`, `useAuth`, `usePermissions`.
- All existing routes; nothing is renamed or moved.
- `MainLayout.tsx` shell (header at top, sidebar below, `lg:pl-[200px]`) — only the **width** widens to `220px` on `lg+` to match DS density.
- Mobile off-canvas behavior preserved (`isOpen` + overlay).
- Badges: keep `expiringCount` on `members` and `pendingSlips` on `finance`. Add new derived "urgent" badge on `lobby` from existing `useDashboardStats.currentlyInClass` (read-only consumer, no new query).

---

## Token changes (single source of truth → enables Branding page)

`src/index.css` — flip the `--sidebar-*` tokens to the DS light palette and add 3 new tokens our new sidebar reads. The `applyBrandTokens()` helper in `src/components/admin-ds/BrandTokens.ts` already exists; we extend its `BrandToken` union so the future Branding page can override these at runtime.

```
--sidebar-background: 0 0% 100%;            /* white surface */
--sidebar-foreground: 220 20% 14%;          /* near-black */
--sidebar-border: 30 10% 89%;               /* same as --border */
--sidebar-muted: 220 10% 46%;               /* token used by labels */
--sidebar-muted-light: 220 10% 62%;         /* group headers */
--sidebar-subtle: 30 10% 96%;               /* hover + search bg */
--sidebar-accent: 25 95% 95%;               /* orangeSoft (active row bg) */
--sidebar-accent-foreground: 25 95% 53%;    /* orange text on active */
--sidebar-primary: 25 95% 53%;              /* unchanged */
```

Dark-mode block in `index.css` keeps a dark sidebar (don't touch `.dark` users). Default = light, matching DS.

`BrandTokens.ts` — extend `BrandToken` union with `--sidebar-background | --sidebar-accent | --sidebar-accent-foreground | --sidebar-subtle`. No runtime mutation here — wiring stays for the future Branding page.

---

## Sidebar.tsx structural rebuild (token-driven, no hard-coded colors)

New top-to-bottom structure, mirroring `ModernSidebar`:

```
┌─────────────────────────────┐
│  [M] MOOM Gym       [⮜]    │  Brand block + collapse btn
│      ADMIN                  │
├─────────────────────────────┤
│  [📍] สาขาอโศก       [v]   │  Branch switcher (uses useLocations)
│       ผู้จัดการ · 06–23      │  → dropdown lists locations
├─────────────────────────────┤
│  🔍  ค้นหา…          ⌘K    │  Search input (filters nav items)
├─────────────────────────────┤
│  Daily (flat, no header)    │
│   • Dashboard               │
│   • Lobby            [3] 🔴 │  urgent badge (currentlyInClass)
│   • Schedule          5     │
│  ─────────                  │
│  PEOPLE          v          │  Collapsible group header
│   • Members          [12]   │
│   • Leads                   │
│  BUSINESS        v          │
│   • Packages                │
│   • Promotions              │
│   • Finance          [3] 🔴 │  pendingSlips
│   • Insights                │
│   • Gamification            │
│  YOUR GYM        >          │  collapsed by default
│   …                         │
├─────────────────────────────┤
│  ⚠ ต้องการความสนใจ          │  Attention card (sticky-ish)
│  • 8 สมาชิกค้างชำระ →       │
│  • 3 ลีดยังไม่ตอบ   →       │
│  • คลาส 19:00 เต็ม  →       │
├─────────────────────────────┤
│  © 2026 MOOM CLUB · v1.0    │
└─────────────────────────────┘
```

### Collapsed mode (icon-rail, 68px)
Hides labels/branch-text/search/attention; keeps icons + a dot badge for urgent items. Persisted to `localStorage('moom-sb-collapsed')`. Group open-state persisted to `localStorage('moom-sb-groups')` (matches DS keys).

### NavItem styling (DS-faithful, token-driven)
- Default: `text-sidebar-foreground`, transparent bg
- Hover: `bg-sidebar-subtle`
- Active: `bg-sidebar-accent text-sidebar-accent-foreground font-bold` + 3px orange left bar (absolute) + bold icon
- Badge: pill, urgent → `bg-destructive text-white` with halo ring; normal → `bg-muted text-muted-foreground`; on active → `bg-sidebar-primary text-white`
- Icon stroke ramps `1.9 → 2.3` on active (matches DS)

All colors come from CSS vars. **No hex anywhere in the component.**

### Branch switcher (real data, not mock)
Use existing `useLocations()`. Selected branch persisted to `localStorage('moom-active-location')`. We do **not** wire it to filter queries in this chunk (out of scope, would touch every hook). It renders + persists; a follow-up chunk threads `activeLocationId` into `useDashboardStats` etc. Mark with TODO comment + DEVLOG note.

### Search (⌘K)
Fuzzy filter over the visible nav items by label + group label. `Cmd/Ctrl+K` focuses input (uses existing `CommandPalette` shortcut? — check first; if conflict, use `Cmd+/`). Result list reuses `NavItem`.

### Attention card
Reads from existing hooks only:
- `useTransferSlipStats().needs_review` → "X สมาชิกค้างชำระ" → `/finance`
- `useExpiringPackages()` filtered `daysLeft <= 7` → "X แพ็กเกจใกล้หมดอายุ" → `/members`
- (Lead followups: skip in this chunk — no existing hook returning "no-reply >24h"; leave the slot for a future chunk so it stays 2 items, not faked.)

No fake data. Each item is hidden if its count is 0.

---

## Animation / motion (matches DS)
- Width transition: `transition-[width] duration-200 ease-out` (collapse)
- Branch dropdown chevron: `transition-transform duration-150` + `rotate-180` when open
- Group chevron: same
- Hover bg: `transition-colors duration-100`
- Active orange bar: appears with `animate-fade-in` (already in tailwind config)
- Reduced-motion respected via Tailwind's `motion-reduce:transition-none`

---

## Files (surgical)

**Edit**
1. `src/index.css` — flip `--sidebar-*` defaults to DS light palette + add `--sidebar-muted`, `--sidebar-muted-light`, `--sidebar-subtle`. Keep `.dark` block intact.
2. `tailwind.config.ts` — add the new sidebar token aliases under `colors.sidebar.*` so utilities like `bg-sidebar-subtle` work.
3. `src/components/layout/Sidebar.tsx` — full rebuild (still ~280 lines, same export). Width changes from `200px` → `220px` expanded, `68px` collapsed.
4. `src/components/layout/MainLayout.tsx` — `lg:pl-[200px]` → `lg:pl-[220px]` (or `lg:pl-[68px]` when collapsed, via context).
5. `src/components/admin-ds/BrandTokens.ts` — extend `BrandToken` union with the 4 new sidebar-overridable tokens. (No runtime change.)

**Create**
6. `src/components/layout/sidebar/SidebarBranchSwitcher.tsx` — uses `useLocations`, persists to `localStorage`.
7. `src/components/layout/sidebar/SidebarSearch.tsx` — input + `⌘K` focus.
8. `src/components/layout/sidebar/SidebarAttentionCard.tsx` — reads `useTransferSlipStats` + `useExpiringPackages`.
9. `src/components/layout/sidebar/useSidebarCollapse.ts` — small hook exposing `{ collapsed, toggle }` + `localStorage` sync, plus a Context so `MainLayout` can read width.

**Do not touch**
- Routes, `App.tsx`, any page, any data hook, any RLS, any migration.
- `src/components/ui/sidebar.tsx` (shadcn primitive — unused by our custom one anyway).
- `Header.tsx` (Chunk D handles topbar).

---

## Regression checklist (manual smoke)

1. Logged in as Owner → all 3 daily + all groups visible, badges render.
2. Logged in as Manager → `/roles`, `/locations`, `/setting/general` hidden (gate intact).
3. Logged in as Trainer (`level_2_operator`) → `/admin`, `/roles`, settings hidden.
4. Click any nav item → navigates, becomes active (orange bar + bg).
5. Collapse → labels disappear, icons remain, dot-badges appear; refresh → still collapsed.
6. Branch switcher → opens, selecting persists to localStorage; re-render keeps selection.
7. Type "fin" in search → filters to "การเงิน"; click → navigates and clears search.
8. `Cmd+K` → focuses search input (no conflict with CommandPalette — if conflict found, fall back to `/`).
9. Mobile (<lg) → hamburger opens overlay sidebar; click overlay → closes.
10. Dark mode (if any user has it) → sidebar still readable (separate `.dark` token set untouched).
11. `MainLayout` content padding matches sidebar width in both states (no horizontal scroll).
12. Activity log not affected (no mutations in this chunk).

---

## Out of scope (next chunks)
- **Chunk D — Topbar** (centered ⌘K, date pill, global "Check-in" CTA).
- Threading `activeLocationId` from branch switcher into queries.
- Lead-followup attention slot (needs a new lightweight hook).
- Pinned-items drag/reorder (DS shows it; defer until users ask).

---

## DEVLOG entry to append
```
- Sidebar uplift to MOOM DS light theme. Token-driven (--sidebar-* in index.css);
  Branding page will override via applyBrandTokens(). Added branch switcher
  (real useLocations, persisted), ⌘K search, attention card (real slip + expiring
  package counts), collapse with persistence. No route/perm/data-flow change.
  Width 200→220 expanded, 68 collapsed. Dark-mode tokens preserved.
```

Awaiting approval to implement.
