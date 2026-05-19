## Sidebar polish — Chunk F (final sidebar pass before moving on)

### Why the sidebar still feels noisy in your screenshot
The 4 visible items "โปรโมชั่น / การเงิน / วิเคราะห์ธุรกิจ / Gamification" you see are the **bottom of the Business group, scrolled past** the pins (Home/Lobby/Calendar/Members) + the Home group + People group + top of Business. The sidebar is duplicating those four pinned items right above the same items inside their groups, which makes the scroll long and the layout repetitive — even though the DS spec is technically satisfied.

### Two surgical fixes

**1. Default pins to empty (`[]`).** Keep all the pin-rendering code in place so the future Branding page can populate it from user config, but stop pre-filling it with rows that are already in the main nav. Result: today the sidebar renders Home → People → Business → Gym → Comms → Org → Settings with no duplicates and roughly **one viewport less scrolling** (~120 px shorter). When Branding ships, users opt-in pins explicitly.

**2. Remove the "ลากจัด" / "drag to arrange" hint** until real DnD is wired. Per `mem://index.md` Core: *No fake interactive elements*. The pins header row keeps the "ปักหมุด" label but drops the right-side hint span. When DnD lands later, the hint comes back at the same time as the handler.

### Files touched (1 file)
```
src/components/layout/Sidebar.tsx
  - DEFAULT_PINS: ['/', '/lobby', '/calendar', '/members']  →  []
  - Pins header: remove the {t('nav.pinsHint')} span
```

i18n keys (`nav.pins`, `nav.pinsHint`) **stay** in both locales — `nav.pinsHint` becomes unused for now but is kept for the Branding page work. No locale edits.

### Out of scope
- No new DnD library, no Branding page work in this chunk.
- No RBAC, route, hook, query, or badge changes.
- Pin rendering infrastructure (header row, divider, `allItemsByPath` resolver, RBAC filtering) stays exactly as is.
- No changes to groups, branch switcher, search, attention card, footer.

### Regression checklist
- Sidebar renders all 7 groups in correct order, none duplicated.
- Group auto-open for current route still works (you're on `/` → Home group opens).
- Collapsed mode still shows group dividers + flat items + urgent dot.
- Branch switcher, search ⌘K, attention card, footer unchanged.
- Manager (level_3) still sees Settings + Branding; Operator (level_2) doesn't.
- Active route still shows orange left bar + bg-sidebar-accent.

### After this chunk
Sidebar is **done**. Next chunks (page-by-page, in the same surgical style) per your earlier approval: continuing with the rest of the admin pages mapped to `MOOM Design System/ui_kits/admin/*.jsx`. We already shipped Packages. Next candidates in order of DS-delta size: **Members → Leads → Finance → Classes → Schedule → Lobby → Promotions → Insights → Gamification → Rooms → Categories → Announcements → Locations → Staff → Roles → Activity Log → Settings → Branding**.
