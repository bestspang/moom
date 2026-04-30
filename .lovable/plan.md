# Phase 2 — Unify Visual + Motion Language Across All Surfaces

## Problem

After Phase 1 (tokens + fonts), the surfaces still **don't look the same**:
- Each surface uses ad-hoc card paddings, radii, shadows, and border treatments.
- Headers (`MobilePageHeader`, `TrainerHeader`, admin page headers) have different paddings, type sizes, and eyebrow styles.
- Badges / status pills are inconsistent (`MobileStatusBadge`, `Badge` shadcn, hand-rolled spans).
- Motion is sporadic: only `MemberHomePage` uses `animate-in fade-in-0 slide-in-from-bottom-2`. Trainer/Staff/Admin pages enter with no transition. Hover states differ per file.

## Scope

In-scope (surgical, additive):
1. Add a small **DS primitive layer** in shared components — wrappers around existing patterns. No deletion.
2. Add **6 standard motion utilities** to `tailwind.config.ts` (DS-blessed: fade-in, slide-up, scale-in, shimmer already exists, flame-flicker exists, scan-line exists).
3. Apply page-enter animation **once at each layout root** so every page in every surface fades+slides on mount — no per-page edits.
4. Update **`ListCard`, `Section`, `SummaryCard`, `MobileStatusBadge`, `MobilePageHeader`** to the DS spec (radius 12px, shadow-sm, border `30 10% 89%`, eyebrow 10px/600/uppercase/tracking 0.08em, hover row = `bg-accent/50`).
5. Add **`.surface-staff`** scope (currently uses `.surface-member`, which is correct — just verify).

Out-of-scope (defer to later phases):
- Rewriting individual page layouts.
- Admin Modern shell (Phase 4).
- New gamification components.
- Replacing shadcn primitives.

## Affected Modules & Status

| Module | Status | Action |
|---|---|---|
| `src/index.css` motion keyframes | WORKING (shimmer/flame/scan exist) | Add `fade-in-up`, `scale-in` keyframes |
| `tailwind.config.ts` animation map | WORKING | Add 2 new animations + standard `ease-out` durations |
| `src/apps/shared/components/ListCard.tsx` | WORKING | Tighten to DS: `rounded-xl`, `border`, `shadow-sm`, hover `bg-accent/50`, `p-3` |
| `src/apps/shared/components/Section.tsx` | WORKING | Eyebrow title style (10px/600/uppercase/tracking) |
| `src/apps/shared/components/MobilePageHeader.tsx` | WORKING | Standardize padding `px-4 py-3`, title 18px/600, sticky border-b |
| `src/apps/shared/components/MobileStatusBadge.tsx` | WORKING | Pill `rounded-full`, 10px uppercase, DS color map |
| `src/apps/shared/components/SummaryCard.tsx` | WORKING | DS card spec + `border-l-4` accent for KPI variant |
| `MemberLayout.tsx`, `TrainerLayout.tsx`, `StaffLayout.tsx`, `MainLayout.tsx` | WORKING | Add `<div className="animate-page-enter">` wrapper around `<Outlet/>` |
| `MemberHomePage.tsx` per-page `animate-in` | WORKING | Remove (now redundant — handled at layout) |
| `TrainerHeader.tsx` | WORKING | Re-skin to share `MobilePageHeader` look (font, padding) |
| Admin `MainLayout.tsx` page-enter | NONE | Same wrapper applied — fade only, no slide (desktop) |

## What Must Be Preserved

- All existing component **APIs / props** (ListCard, Section, MobileStatusBadge, etc.) — only style attributes change.
- All routes, data fetching, query keys, hook contracts.
- Per-surface fonts: Anuphan (admin), LINE Seed Sans TH (member/trainer/staff). Already in place.
- `MobilePageHeader` `action` slot semantics (back-nav rule from Hard Invariants).
- Coming Soon `opacity-60 pointer-events-none` rule.
- All gamification keyframes (`shimmer`, `flame-flicker`, `pulse-glow`, `bounce-in`, `stamp-in`).

## What Is Actually Broken (to fix)

1. Cards across surfaces use different radii (`rounded-lg` vs `rounded-xl` vs `rounded-2xl`) → standardize on `rounded-xl` (12px) per DS.
2. Section titles use mixed weights → standardize to eyebrow 10px/600/uppercase.
3. Pages snap in without animation → add layout-level `animate-page-enter`.
4. Trainer/Staff headers don't visually match Member header → unify to `MobilePageHeader`.
5. Hover states inconsistent (some rows have no hover) → add `.row-hover` utility.

## Technical Plan

### A. New keyframes (`src/index.css`)
```css
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes scale-in {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}
.animate-page-enter        { animation: fade-in-up 0.28s ease-out both; }
.animate-page-enter-desktop{ animation: fade-in-up 0.2s ease-out both; }

/* Unified row hover */
.row-hover { transition: background-color 0.15s ease-out; }
.row-hover:hover { background-color: hsl(var(--accent) / 0.5); }
```

### B. `tailwind.config.ts` additions
```ts
animation: {
  ...,
  "fade-in":   "fade-in-up 0.28s ease-out both",
  "scale-in":  "scale-in 0.2s ease-out both",
  "page-enter":"fade-in-up 0.28s ease-out both",
}
```

### C. Layout-level page-enter
In each layout, wrap the content area:
```tsx
<main className="animate-page-enter" key={location.pathname}>
  <Outlet />
</main>
```
`key` on pathname makes the animation re-fire on route change.

### D. Shared component refresh — DS spec

`ListCard`:
- `rounded-xl border bg-card shadow-sm p-3 row-hover`
- Title: `text-sm font-semibold`
- Subtitle: `text-xs text-muted-foreground`

`Section`:
- Title becomes `text-eyebrow` (10px/600/uppercase/tracking-[0.08em] text-muted-foreground)
- Action: `text-xs font-medium text-primary`

`MobilePageHeader`:
- `sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3`
- Title: `text-lg font-semibold` (18px)
- Action slot: right-aligned, icon-only `size-9`

`MobileStatusBadge`:
- `inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]`
- Color map → DS `--status-*` tokens

`SummaryCard`:
- Default card spec; KPI variant adds `border-l-4 border-l-primary`

### E. Trainer header alignment
Replace `TrainerHeader` body with `MobilePageHeader` (or reskin to inherit identical paddings/fonts). Keep its props/API.

### F. Remove redundant per-page `animate-in`
Remove the `animate-in fade-in-0 slide-in-from-bottom-2 duration-300` wrapper at the top of `MemberHomePage.tsx` (now handled by layout). No other pages currently have it.

## Regression Checklist

- [ ] Member home/schedule/check-in/profile all enter with fade-up.
- [ ] Trainer home/schedule/impact identical motion + header look as Member.
- [ ] Staff home/checkin/payments same.
- [ ] Admin pages fade in (no slide).
- [ ] All existing badges still render with correct colors.
- [ ] `MobilePageHeader` `action` slot unchanged (no inline back buttons added).
- [ ] Coming Soon items still show `opacity-60 pointer-events-none`.
- [ ] No new console errors; build passes.
- [ ] Gamification animations (flame, shimmer, scan-line, bounce-in) still fire.
- [ ] Dark mode unaffected.

## Doc Updates

- `docs/DEVLOG.md` — append "Phase 2: visual + motion unification".
- Memory: add `[Visual Language Unified](mem://design/visual-language-phase-2)` describing the page-enter rule + DS card/header/badge spec.

## Out for Approval

One open question before I implement:
- **Keep** the gamification fun-motion (flame-flicker on streak, bounce-in on XP toast) untouched, OR also unify those down to the standard fade? Default in this plan = **keep them** (they're DS-blessed for member surface only).
