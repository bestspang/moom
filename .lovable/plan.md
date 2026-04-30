# Plan: Port "Leo" Lion Mascot from Design System

## Affected modules
- `src/apps/member/components/MascotIllustration.tsx` (rewrite SVG body)
- `docs/DEVLOG.md` (append note)

## Status
- **MascotIllustration.tsx** — WORKING but visually wrong (current lion is generic round). API (`size`, `mood`, `className`) and 4 moods (`cheer | fire | chill | sleep`) are correct.
- **All callers** (`MemberHomePage.tsx` uses `mood={hasProgressed ? 'fire' : 'cheer'}`) — must keep working unchanged.

## What must be preserved
- Component name, props (`size`, `mood`, `className`), default `size=80`, all 4 mood values
- Decorative-only behavior (`aria-hidden="true"`)
- Backward usage from `MemberHomePage.tsx` (no caller changes)

## What is actually wrong
- Current SVG = round face + ears, no body, no whiskers, no tail. Not the DS "Leo" lion.
- No animation. DS version has a **continuous gentle bob** via `requestAnimationFrame`.

## Source (Design System reference)
`MOOM Design System/ui_kits/member/Gamify.jsx` lines 4–172 — flat-palette lion "Leo":
- Sitting body (haunches + paws + tail with tuft)
- Two-layer scalloped mane (11 outer + 10 inner circles + central mass)
- Cream forehead/muzzle stripe, cheek blush, whiskers (3 per side)
- Big rounded black nose triangle
- Mood-driven eyes/mouth: `cheer/chill` = soft curves + lashes, `fire` = `^^` eyes + open smile + flame above head, `sleep` = closed eyes + Zzz
- viewBox `0 0 120 140`, ground shadow ellipse
- Bob animation: `translateY(sin(t/700)*1.2)` via rAF

## Adaptations for our codebase
1. **Convert JSX → TSX**: keep prop interface as-is (don't add new props).
2. **Replace `useStateF/useEffectF` aliases** with React's `useState` / `useEffect` (already imported pattern in the file).
3. **Cleanup rAF on unmount** (already in DS source — preserve).
4. **Mood mapping**: DS supports `chill | cheer | sleep | fire` — same as ours. `chill` falls through to default branch (same as `cheer`), matching DS behavior.
5. **Colors**: keep DS hex values (`#F5A55C`, `#E8823B`, `#F6C98A`, `#FBE4BD`, `#1F1A17`, `#3B2A1F`, `#E88A7A`) inline — they're decorative and outside our token system, identical to what DS ships.
6. **Reduced motion**: respect `prefers-reduced-motion` — skip the bob rAF loop (set bob to 0). Small additional safety not in DS source; zero visual impact when user has no preference set.
7. **No new dependencies.** Pure React + inline SVG.

## Implementation plan (single file rewrite)
Rewrite `MascotIllustration.tsx`:
```tsx
- import { useEffect, useState } from 'react';
- Add bob state + rAF effect (guarded by prefers-reduced-motion)
- viewBox "0 0 120 140", style={{overflow:'visible'}}
- <g transform={`translate(0 ${bob})`}> wrapping body+mane+face
- Body group, ears, two-tone mane (Array.from loops as in DS),
  face base + cream stripe, blush, mood-aware eyes, nose, whiskers,
  mood-aware mouth, fire-flame group, sleep Zzz text
- Keep aria-hidden, className, size, mood props
```

## Regression checklist
- [ ] `MemberHomePage.tsx` still renders mascot at top-right at 80×80 with no layout shift (viewBox is taller now: 120×140 vs 96×96 — SVG scales to `size` so no overflow because `style.overflow:visible` only enlarges shadow/flame slightly outside box; visual area still ~80px).
- [ ] `mood='fire'` shows flame above head + `^^` eyes + open smile.
- [ ] `mood='cheer'` (and `chill`) shows soft curved eyes + gentle smile.
- [ ] `mood='sleep'` shows closed eyes + Zzz.
- [ ] Bob animation visible (~1.2px sine, ~700ms period); stops on unmount; disabled under `prefers-reduced-motion`.
- [ ] No console errors, no new TS errors, no caller changes required.
- [ ] Other mascot consumers (none found beyond `MemberHomePage`) unaffected.

## Doc updates
- Append DEVLOG entry: "Ported Leo lion mascot SVG + bob animation from Design System (Gamify.jsx) into MascotIllustration. Zero API change."
- Update `mem://design/visual-language-phase-2` note if it mentioned mascot shape (mascot is now confirmed as flat lion "Leo", not blob).
