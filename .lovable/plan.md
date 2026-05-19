# Fix: Sidebar full-height + remove duplicate logo from header

## Problem (real, verified against DS)

Current admin chrome diverges from `MOOM Design System/ui_kits/admin/Components.jsx`:

- **Sidebar starts at `top: 14`** (below the header) — DS sidebar is full-height starting at viewport `top: 0`.
- **Header is full-width** spanning over where the sidebar should be, and renders its own MoomMark — DS header is content-area only (right of sidebar) with no logo (logo lives once, in the sidebar).
- Result: logo appears twice, sidebar is shorter than the screen, brand identity feels off.

Reference markup (DS `Components.jsx`):
- `Sidebar`: full-height column, cream bg, `MoomMark` at top, then groups/items.
- `TopHeader`: 60px white bar, right-aligned actions only (theme · bell · lang · avatar). **No logo, no menu button on desktop.**

## Scope (UI/layout only — zero functional change)

Touching only three files. No hooks, contexts, routing, RBAC, i18n, or data changes. Every existing action in the header (notifications dropdown, lang dropdown, avatar dropdown, surface switcher, logout, theme toggle, mobile menu button) is preserved verbatim.

### 1. `src/components/layout/MainLayout.tsx`

Switch from "header-on-top + sidebar-below" to "sidebar-on-left + header-in-content-area":

```text
BEFORE                          AFTER
┌──────── Header ────────┐      ┌──Side──┬──── Header ────┐
│                        │      │  bar   ├────────────────┤
├Sidebar │   Content     │      │        │   Content      │
│        │               │      │        │                │
```

- Move `<Header>` **inside** the `<main>` wrapper (still `sticky top-0`, but only over the content column).
- `<main>` keeps the same `lg:pl-[252px] / lg:pl-[68px]` padding driven by `useSidebarCollapse`, but drop the `pt-14` (header now lives inside main, not above it).
- Keep the page-enter animation wrapper, skip-to-content link, ErrorBoundary, CommandPalette, `useRealtimeSync` — untouched.

### 2. `src/components/layout/Sidebar.tsx`

- Change `<aside>` positioning from `fixed top-14 left-0 bottom-0` → `fixed top-0 left-0 bottom-0`.
- Everything else (brand block, branch switcher, search, scroll area, attention card, footer, collapse toggle, RBAC, badges, group memory) stays as-is.

### 3. `src/components/layout/Header.tsx`

- Remove the left-side logo block (lines 89–94: the orange `M` tile + "MOOM CLUB" wordmark) — it's now exclusively in the sidebar (DS rule).
- Keep the **mobile** menu toggle (`lg:hidden`) so the off-canvas sidebar still opens on small screens.
- Change root from `fixed top-0 left-0 right-0 z-50` → `sticky top-0 z-30` so it sits inside `<main>` and only spans the content column. `h-14`, `bg-card`, `border-b` unchanged.
- All right-side actions (Theme, Notifications, Language, Avatar dropdown with Member/Trainer surface switcher + Logout) untouched.

## Regression checklist

- Desktop ≥ lg: sidebar full-height; header sits to its right and scrolls-sticky at top of content; no double logo.
- Collapse toggle still shifts content padding (252 ↔ 68).
- Mobile < lg: menu icon in header opens off-canvas sidebar; backdrop click closes it; page padding has no left offset.
- All header dropdowns (notifications, lang, avatar/profile/surface-switch/logout) still open and act identically.
- CommandPalette ⌘K still mounts (lives in MainLayout, unchanged).
- Skip-to-content link still focuses `#main-content`.
- Page-enter animation still plays per route.
- Branding save-bar portal (recent fix) still floats — it portals to `body`, so unaffected.
- No changes to z-index of toasts/modals/dropdowns (header drops from z-50 → z-30; modals/toasts use higher tiers).
