## Why the sidebar still "feels เหมือนเดิม"

The 7-group taxonomy, NavItemRow visuals, branch switcher and attention card are already DS-aligned from Chunk D. But four pieces from `MOOM Design System/ui_kits/admin/Modern.jsx` are still missing — and they're the most "DS-ish" elements you actually see:

1. **Pins row** ("ปักหมุด" — Dashboard / Lobby / Schedule / Members) above the divider
2. **Collapsed mode**: DS replaces the group header with a 1px divider; we currently render items flat with no divider
3. **Urgent red dot** on a collapsed group header when it contains an urgent item but is closed
4. Micro token nits: active bar offset (`-left-2.5` to match DS `left: -10` against `pl-3`), branch switcher height (48 expanded / 44 collapsed), and the `⌘K` kbd hint inside the search input

## Plan (sidebar only — no routes, no data hooks, RBAC untouched)

### Step 1 — Add Pins section to `Sidebar.tsx`
- New constant `DEFAULT_PINS: string[] = ['/', '/lobby', '/calendar', '/members']` (paths, not ids — matches our routing model).
- Resolve pin items by flattening `navGroups` and matching by `path`. Filter through the existing `hasAccess()` so RBAC still hides items a user can't see.
- Render above the group list with the DS header row (`ปักหมุด` left, `ลากจัด` right, both `text-[10px] uppercase tracking-wider text-sidebar-muted-light`). No drag wiring yet (TODO comment — Branding page will own pin config later).
- Add a 1px `bg-sidebar-border` divider with `my-3 mx-1` between Pins and Groups (matches DS line 370).
- i18n keys: `nav.pins` = "ปักหมุด"/"Pinned", `nav.pinsHint` = "ลากจัด"/"Drag to arrange".

### Step 2 — Collapsed-mode group dividers
In `renderGroup`, when `collapsed === true`:
- Render a 1px divider (`h-px bg-sidebar-border mx-1.5 my-2`) before the group's items (skip for the first visible group).
- Keep flat items below it. This mirrors DS lines 399–401.

### Step 3 — Urgent dot on collapsed group headers
- Compute `groupHasUrgent = visible.some(i => i.urgent && (i.badge ?? 0) > 0)`.
- In expanded mode, when the group is closed AND `groupHasUrgent`, render a 6px destructive dot at the right of the header button (DS lines 395–397).

### Step 4 — DS micro-token alignment
- Active left bar: change `-left-2` → `-left-2.5` (10px) inside `NavItemRow` so the bar sits exactly between the rail and the row, matching DS `left: -10` against `padding-left: 12px`.
- Inside `SidebarSearch`: confirm the placeholder is "ค้นหา หรือกด ⌘K…" / "Search or press ⌘K…" and the trailing `<kbd>⌘K</kbd>` chip is present (only when input is empty). If missing, add it. No new shortcut logic — `CommandPalette` already owns ⌘K globally.
- `SidebarBranchSwitcher`: verify expanded height = 48px, collapsed = 44px, icon tile uses `bg-sidebar-teal/14 text-sidebar-teal`. If tokens for `--sidebar-teal` aren't defined, fall back to existing `--accent` (no new tokens this round — Branding page will introduce token overrides later).

### Step 5 — Verify (no regressions)
- Build passes.
- Smoke matrix (manual, 1107×756 desktop preview + mobile drawer):
  - level_4_master: all 7 groups + Pins visible; Settings group visible
  - level_3_manager: Pins visible, Roles hidden, Settings group visible
  - level_2_operator: Settings group fully hidden, Branding hidden
  - level_1_minimum: Business/Gym/Settings groups fully hidden; Pins filters to only `/` + `/lobby` + `/calendar` items they can read
- Collapse/expand persists in `localStorage`.
- Auto-open behaviour for the group hosting the active route still fires.

## Files to touch (4)

```
src/components/layout/Sidebar.tsx                    — pins row, divider, urgent dot, active-bar offset
src/components/layout/sidebar/SidebarSearch.tsx      — ⌘K kbd + placeholder parity (if missing)
src/i18n/locales/th.ts                               — nav.pins, nav.pinsHint
src/i18n/locales/en.ts                               — nav.pins, nav.pinsHint
```

## Out of scope (intentionally)
- No changes to routes, `usePermissions`, `useDashboardStats`, `useExpiringPackages`, `useTransferSlips`.
- No drag-and-drop for pins (Branding page will own the persisted config).
- No new CSS tokens — only consuming existing `--sidebar-*` tokens so the future Branding page can override them.
- Other admin pages (Dashboard, Members, Finance, …) stay untouched in this chunk — sidebar first, as you asked.

## Risks & rollback
- Risk: Pins duplicating an item that is also visible inside its group is *intentional* per DS (it's a shortcut, not a move). Both rows are independent React nodes with stable keys, no state collision.
- Rollback: revert `Sidebar.tsx` + the two i18n diffs; pure presentational change.
