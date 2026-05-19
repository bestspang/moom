# Admin Header — DS Match Plan

Bring the admin top header to 1:1 parity with the reference screenshot, using the existing design system tokens and the existing CommandPalette / notifications / auth wiring. Zero regressions to dropdowns, surface switcher, theme toggle, and mobile menu.

## Reference vs. current

Reference (screenshot):
```text
[ ☰ ]   [ 🔍 ค้นหาสมาชิก, คลาส, แพ็คเกจ…   ⌘K ]   [ 📅 วันนี้, 19 เม.ย. ]  [ 🟧 เช็คอิน ]  [ 🔔 ]  [ KS  Kongphop S. / Owner  ⌄ ]
```

Current (`src/components/layout/Header.tsx`):
```text
[ ☰ ]                                                                                          [ 🌓 ] [ 🔔 ] [ TH ⌄ ] [ Avatar ]
```

Gap to close (additive, no removals of working behavior):
1. Centered search pill (opens existing CommandPalette).
2. "Today" date pill (read-only display, localized).
3. Orange "เช็คอิน" primary CTA → existing `/checkin` route.
4. Avatar trigger shows name + role on desktop (matches screenshot's KS · Kongphop S. · Owner).
5. Theme toggle stays but moves into the avatar dropdown to declutter the bar (DS reference has no theme button in topbar).

## Affected modules

- `src/components/layout/Header.tsx` — layout refactor (3-zone flex), add search trigger + date pill + check-in CTA + avatar-with-name. Status: PARTIAL (works, missing DS elements).
- `src/components/command-palette/CommandPalette.tsx` — add a `window` event listener (`moom:open-command-palette`) so the new search button can open it. Keep Cmd/Ctrl+K shortcut. Status: WORKING, additive change only.
- `src/i18n/locales/{en,th}.ts` — add `header.searchPlaceholder`, `header.checkin`, `header.today` (or reuse existing keys if present). Status: WORKING.

No changes to: `Sidebar.tsx`, `MainLayout.tsx`, AuthContext, surface routing, notifications hook, ThemeToggle component, CommandPalette search logic, hostname helpers.

## What must be preserved

- Notifications dropdown (unread badge, mark-as-read, "view all" → `/notifications`).
- Language dropdown (desktop) + language toggle inside avatar menu (mobile).
- Avatar dropdown: profile link, surface switcher (Member/Trainer with `buildSessionTransferUrl`), logout.
- Mobile menu toggle (`onMenuToggle` prop, `lg:hidden`).
- `sticky top-0 z-30` so it stays at top of the content column (sidebar full-height to its left).
- ThemeToggle remains accessible (relocated into avatar menu — not removed).

## Design

Layout zones (flexbox):
- Left (shrink-0): mobile menu button (`lg:hidden`).
- Center (flex-1, `max-w-xl mx-auto`): search trigger pill — button styled as input, left icon, placeholder text, right `⌘K` kbd chip; on click dispatches `window.dispatchEvent(new CustomEvent('moom:open-command-palette'))`. Hidden on `sm` and below to keep mobile clean.
- Right (shrink-0, `gap-2`): date pill → check-in CTA → bell → avatar.

DS tokens only — no hex literals:
- Search pill: `bg-muted/60 hover:bg-muted text-muted-foreground border border-border rounded-full h-9 px-3`.
- Kbd chip: `bg-background border border-border rounded text-[11px] px-1.5 py-0.5`.
- Date pill: `inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-border bg-card text-sm`.
- Check-in CTA: `Button` with `bg-primary text-primary-foreground rounded-lg h-9 px-3.5 font-semibold` + `LayoutGrid` (or `QrCode`) icon, click → `navigate('/checkin')`.
- Avatar trigger: same `Button` dropdown trigger, but on `lg+` includes a 2-line text block (`Kongphop S.` / `Owner`) next to the circle; on `<lg` icon-only as today.

Date pill content: `format(new Date(), language === 'th' ? 'EEEE, d MMM' : 'EEE, d MMM', { locale: getDateLocale(language) })` truncated as the reference shows ("วันนี้, 19 เม.ย." → render as `วันนี้, 19 เม.ย.` using a small helper that prepends the i18n word for "today").

## Implementation steps

1. **CommandPalette listener** — in `CommandPalette.tsx`, alongside the existing keydown effect, add:
   ```text
   useEffect(() => {
     const open = () => setOpen(true);
     window.addEventListener('moom:open-command-palette', open);
     return () => window.removeEventListener('moom:open-command-palette', open);
   }, []);
   ```
   No other change.

2. **i18n** — add to `settings`-sibling `header` section (create if missing):
   - TH: `searchPlaceholder: 'ค้นหาสมาชิก, คลาส, แพ็คเกจ…'`, `checkin: 'เช็คอิน'`, `today: 'วันนี้'`.
   - EN: `searchPlaceholder: 'Search members, classes, packages…'`, `checkin: 'Check-in'`, `today: 'Today'`.

3. **Header.tsx rewrite (single file, ~80 LOC net)** — preserve the entire right-side dropdown blocks verbatim; only reshape the outer flex and insert the three new elements. Move `<ThemeToggle />` to a `<DropdownMenuItem>` inside the avatar menu (above the language item) wrapped in a `<div>` that renders the toggle inline.

4. **Verify**: build clean, click search → CommandPalette opens, ⌘K still works, click "เช็คอิน" → routes to `/checkin`, date pill updates per language switch, avatar dropdown still has Profile / Member App / Trainer App / Language (mobile) / Theme / Logout, notifications badge unchanged, mobile (`<sm`) hides search + date pill but keeps CTA + bell + avatar.

## Regression checklist

- [ ] `bun run build` clean.
- [ ] Cmd/Ctrl+K still opens palette.
- [ ] Search pill click opens palette; ESC closes; query works.
- [ ] "เช็คอิน" navigates to `/checkin` (existing route).
- [ ] Date pill shows TH locale when TH active, EN when EN active.
- [ ] Notifications badge + dropdown + "view all" unchanged.
- [ ] Avatar dropdown: profile, surface switcher (Member/Trainer transfer URL), language (mobile), theme toggle (relocated), logout.
- [ ] Mobile (`<sm`): menu button + CTA + bell + avatar visible; search and date pill hidden.
- [ ] Desktop (`lg+`): avatar trigger shows name + role text.
- [ ] Header still `sticky top-0 z-30` inside `<main>`; sidebar still full-height to its left.
- [ ] No new hardcoded colors — all via tokens.

## Doc updates

- `docs/DEVLOG.md` — "Admin Header: DS-match (search pill, date pill, check-in CTA, name+role avatar); ThemeToggle relocated into avatar menu; CommandPalette opened via `moom:open-command-palette` event."
