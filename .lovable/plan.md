# Fix: Moomu mascot doesn't match the Design System

## Problem (verified)

The on-screen "lion" (`MascotIllustration` next to the greeting on the member home) is drawn as a **lion with mane + ears** — 12 orange bumps around the head, two small ears, a fur face, muzzle, etc.

But in the MOOM Design System reference (`MOOM Design System/screenshots/member-fun.png`), **Moomu is not a lion at all** — it is a **soft orange blob / teardrop** mascot:

- Round body, slight pointed crown at the top (droplet shape).
- Solid warm orange with a top-left highlight.
- Two small round eyes with sparkle dots.
- A tiny smile.
- Rosy cheek blush.
- **No mane. No ears. No muzzle.**

That is why the user says รูปสิงโตไม่เหมือน — the current drawing is a lion, the brand mascot is a blob.

## What I will change

**Single file edit:** `src/apps/member/components/MascotIllustration.tsx` — full rewrite of the SVG only. The component's **public API stays identical** (`size`, `mood`, `className`).

New SVG spec:
- Body: a single `<path>` forming a rounded teardrop / blob, filled with a warm orange radial gradient (`hsl(32 100% 68%)` → `hsl(22 90% 48%)`).
- Top-left soft white highlight.
- Eyes:
  - `cheer` (default): two filled dots with a tiny white sparkle.
  - `fire`: determined `^ ^` eyes (Moomu in motivated state).
  - `sleep`: closed `~ ~` arcs.
  - `chill`: same as cheer but a smaller, softer mouth.
- Two rosy cheek blush circles.
- Mouth: small upward arc smile (open 'o' on `fire`).
- Optional fire aura ring on `fire` mood (kept from current behavior — used on home when member has progressed).

Removed entirely: mane bumps, ears, muzzle, lion face shape.

## Affected modules

| File | Status | Action |
|---|---|---|
| `src/apps/member/components/MascotIllustration.tsx` | WORKING but visually wrong | **Rewrite SVG body**, keep props & exports |

## What is preserved

- Component API (`MascotIllustrationProps`: `size`, `mood`, `className`).
- All callers (`MemberHomePage.tsx` and any other) — no edit needed.
- `mood` semantics: `cheer` default, `fire` shown when member has XP progress.
- Decorative-only (`aria-hidden="true"`).
- No new dependencies, no asset files added.

## What is NOT touched

- No layout changes.
- No header / greeting copy changes.
- No other surfaces.
- No tokens, no Tailwind config.

## Regression checklist

- [ ] Moomu renders at the same size next to the greeting on `/member`.
- [ ] All 4 moods (`cheer` / `fire` / `chill` / `sleep`) render without errors.
- [ ] Fire aura still appears when `mood="fire"`.
- [ ] No console warnings about invalid SVG.
- [ ] No layout shift on `MemberHomePage`.

## Doc updates

- Append a one-line entry to `docs/DEVLOG.md`: "Fix Moomu mascot to match DS (orange blob, not lion)."
- Update memory `mem://design/visual-language-phase-2` with a note: "Moomu = orange blob mascot per `member-fun.png`, never a lion."

Ready to implement on approval.
