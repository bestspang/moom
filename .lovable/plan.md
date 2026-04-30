
# Phase 1 — Foundation: Tokens & Typography

Adopt the MOOM Design System token layer (`MOOM Design System/colors_and_type.css`) into the live app. Foundation only — no widget redesigns yet.

## Decisions (locked from prior turn)

- **Scope:** All surfaces (admin + member + trainer + staff) — single token layer, surface fonts switched via root scope class.
- **Base font 13px:** Member/Trainer/Staff only. Admin keeps Tailwind default (14–16px) to avoid breaking dense desktop tables/forms in this phase.
- **Orange shift:** Approved. `32 100% 50%` → `25 95% 53%` (warmer).
- **Admin Modern shell (sidebar v2 / ⌘K):** Deferred to Phase 4. This phase only swaps fonts/colors on the existing admin shell.

## What changes

### A. `src/index.css` — token rewrite

1. **Replace `@import` line** to load the three DS fonts:
   - `Anuphan` (300–800)
   - `LINE Seed Sans TH` (400, 500, 700, 800)
   - `IBM Plex Sans Thai` (kept as fallback for glyph coverage)
   - Must remain strictly above `@tailwind` (per Core memory rule).
2. **Update `:root` light tokens** to DS values:
   - `--primary: 25 95% 53%`, `--primary-hover: 25 95% 48%`
   - `--background: 30 10% 98%` (warm off-white)
   - `--foreground: 220 20% 8%` (deep blue-black)
   - `--card-foreground / popover-foreground: 220 20% 8%`
   - `--muted: 30 8% 95%`, `--muted-foreground: 220 10% 46%`
   - `--secondary: 30 12% 93%`, `--secondary-foreground: 220 20% 8%`
   - `--accent: 25 40% 95%`, `--accent-foreground: 25 80% 35%`
   - `--border / --input: 30 10% 89%`, `--ring: 25 95% 53%`
   - `--radius: 0.75rem`
   - **Sidebar (admin):** switch to DS dark sidebar — `--sidebar-background: 220 20% 8%`, `--sidebar-foreground: 30 10% 95%`, `--sidebar-border: 220 15% 16%`, `--sidebar-accent: 25 40% 16%`, `--sidebar-accent-foreground: 25 80% 65%`. (Big visual change — see Risks.)
   - **Momentum/tier ladder:** add 6-tier ladder `starter / regular / dedicated / elite / champion / legend` alongside the **existing** `--tier-mover/strong/elite/legend` keys. **Keep legacy keys in place** so no consumer breaks; new code can use the new keys.
   - Add `--reward-xp`, `--reward-xp-soft`, `--reward-rp`, `--reward-rp-soft`.
   - Add radius scale: `--radius-sm/md/lg/xl/2xl/badge/full`.
3. **Add font tokens + scope classes:**
   ```css
   --font-admin:  'Anuphan', 'IBM Plex Sans Thai', system-ui, sans-serif;
   --font-member: 'LINE Seed Sans TH', 'IBM Plex Sans Thai', system-ui, sans-serif;
   ```
   Plus utility classes:
   ```css
   .surface-admin  { font-family: var(--font-admin); }
   .surface-member { font-family: var(--font-member); font-size: 13px; }
   ```
   The `13px` is applied **only inside `.surface-member`** so admin keeps current sizing.
4. **`body` rule:** keep current Tailwind base, but drop the hard-coded `'IBM Plex Sans Thai', 'Inter'` fallback since per-surface fonts now win via the scope classes. Keep `text-[13px]` removed from `body` (move into `.surface-member`).
5. **`.dark` block:** keep all current dark tokens (no shift this phase).

### B. `tailwind.config.ts`

- `fontFamily.sans` → `['Anuphan', 'IBM Plex Sans Thai', 'system-ui', 'sans-serif']` (admin default; member/trainer/staff override via `.surface-member` CSS).
- Add `fontFamily.member: ['LINE Seed Sans TH', 'IBM Plex Sans Thai', 'system-ui', 'sans-serif']` for explicit `font-member` utility when needed.
- No color/radius changes here — those flow through the existing `hsl(var(--*))` mappings already in place.

### C. Layout root scope classes (one-line each)

- `src/apps/member/layouts/MemberLayout.tsx` — add `surface-member` to root `<div>`.
- `src/apps/trainer/layouts/TrainerLayout.tsx` — add `surface-member`.
- `src/apps/staff/layouts/StaffLayout.tsx` — add `surface-member`.
- `src/components/layout/MainLayout.tsx` (admin) — add `surface-admin` to its root.

That's the full surface-aware font + density switch — no per-component edits.

## Files touched

```
src/index.css                                  (token rewrite + font import)
tailwind.config.ts                             (fontFamily.sans + .member)
src/apps/member/layouts/MemberLayout.tsx       (+ surface-member)
src/apps/trainer/layouts/TrainerLayout.tsx     (+ surface-member)
src/apps/staff/layouts/StaffLayout.tsx         (+ surface-member)
src/components/layout/MainLayout.tsx           (+ surface-admin)
.lovable/plan.md                               (mark Phase 1 done)
docs/DEVLOG.md                                 (entry)
```

## What is preserved (zero regression contract)

- All semantic token **names** (`--primary`, `--secondary`, `--card`, `--accent-teal`, `--success`, `--warning`, `--destructive`, `--status-*`, `--tier-mover/strong/elite/legend`, `--coach-*`, `--partner-*`, `--status-tier-*`, `--rarity-*`, `--xp-bar`, `--momentum-flame`, etc.) remain — only HSL values move. No consumer needs to change a className.
- `.dark` block untouched (light-mode shift only).
- Radius alias `--radius` change `0.5rem → 0.75rem` flows through Tailwind's `rounded-lg/md/sm` automatically — visual only, no API break.
- Animations (`shimmer`, `flame-flicker`, `pulse-glow`, `bounce-in`, `stamp-in`, `scan-line`) untouched.
- Shadcn UI primitives in `src/components/ui/*` not edited (PROTECTED).
- AuthContext / hostname.ts / App.tsx routing untouched.
- DB / RPC / edge functions untouched.

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| **Admin sidebar flips from cream → near-black.** Big visual jump. | This is the DS spec; if you'd rather keep the current cream sidebar this phase, say so and we keep `--sidebar-background: 36 33% 94%` until Phase 4. **Default in this plan = adopt dark sidebar** since you approved Phase 1 wholesale. |
| Orange hue shift may affect screenshots/marketing. | Only a small warm-up; no naming change. |
| Member/Trainer/Staff base font drops to 13px. | Scoped via `.surface-member` only. Admin desktop stays current size. Smoke test mobile pages for line-height regressions. |
| LINE Seed Sans TH rendering on Thai text. | IBM Plex Sans Thai stays as fallback so glyphs never go missing. |
| Radius bump may visually clip content in tightly-padded cards. | Going from 8 → 12px is small; risk low. Will eyeball top member/admin pages. |

## Regression checklist (post-build)

1. Admin `/dashboard` renders, sidebar nav clickable, KPI cards readable.
2. Member home renders, NextUpCard / QuickTilesGrid / quests visible — text in LINE Seed.
3. Trainer home renders — text in LINE Seed.
4. Staff check-in renders.
5. Login/Signup pages render with new orange.
6. Dark mode toggles cleanly (no broken contrast).
7. Tier badges, XP bar, momentum flame still color-correct (legacy tokens kept).
8. No console warnings about missing CSS variables.

## Open question (one)

**Admin sidebar:** flip to DS dark sidebar (`220 20% 8%`) **now**, or keep current cream sidebar until Phase 4 (Modern shell)? Default in this plan = flip now per your "Phase 1 wholesale" approval. Reply "keep cream" if you want to defer that piece.
