---
name: moom-design
description: Use this skill to generate well-branded interfaces and assets for MOOM (MOOM Wellness Club) — an all-in-one fitness management platform for gyms, studios, and trainers with a gamified member experience. Works for production code or throwaway prototypes/mocks/decks/slides. Contains essential design guidelines, color tokens, type, fonts, assets, and UI kit components for prototyping both the admin dashboard (desktop) and the LINE LIFF member app (mobile).
user-invocable: true
---

Read the `README.md` file within this skill for the full brand context, voice, visual foundations, and iconography rules. Then explore the other available files:

- `colors_and_type.css` — drop-in CSS variables for colors (including tier + gamification tokens), typography scale, radii, shadows, and semantic vars like `--fg1`, `--h1`, `--card-pad`.
- `assets/logos/` — the MOOM wordmark in orange (primary), black, and white-reversed.
- `preview/` — reference cards showing colors, type, spacing, components, brand marks.
- `ui_kits/admin/` — desktop admin dashboard: sidebar, KPI tiles, schedule, members table, AI briefing.
- `ui_kits/member/` — LINE LIFF mobile member app: momentum card, tier badges, XP bar, QR check-in, class cards, bottom nav with centered FAB.

### Core brand rules (must respect)

- **One brand color:** MOOM Orange `hsl(32 100% 50%)` / `#FF8800`. Don't invent a second.
- **The quiet signature is cream** `hsl(36 33% 94%)` as the desktop sidebar — MOOM is a cream-and-orange product, not a white-and-orange one.
- **Typography — per surface:**
  - **Admin:** Anuphan (Cadson Demak), `var(--font-admin)`, weights 400/500/600/700.
  - **Member LIFF:** LINE Seed Sans TH, `var(--font-member)`, weights 400/500/700/800 — makes the mini-app platform-native inside LINE.
  - Fallback ends in IBM Plex Sans Thai for glyph coverage. Base 13px, bilingual TH/EN, info-dense.
- **Iconography:** Lucide only, 1.5–2px stroke, never filled. Active nav bumps stroke to 2.5.
- **Emoji:** only tier medals (🥉🥈🥇💠💎🖤) and member-app celebrations (🔥✨🎉). Never in admin.
- **Motion:** restrained — 200–400ms fades + `ease-out`. The member app adds `flame-flicker`, `shimmer`, and `scan` for gamified moments only.
- **Cards:** 1px border + `rounded-lg` (8px) + soft shadow-md + `p-3` (12px). KPI tiles get a 4px colored left border accent to categorize.
- **Bilingual:** every user-facing string ships TH + EN. Thai is primary on member, EN/TH user-choice on admin.

### How to use this skill

If creating visual artifacts (slides, mocks, throwaway prototypes), copy assets out of `assets/logos/` and any relevant JSX from `ui_kits/` into a static HTML file for the user to view. Reuse component code directly — it's already on-brand.

If working on production code, copy the assets you need, import `colors_and_type.css` for tokens, and follow the rules in `README.md` to become an expert in designing with this brand. The real codebase is Tailwind + shadcn/ui on top of HSL custom properties — the token names in `colors_and_type.css` mirror those in `src/index.css`.

If the user invokes this skill without any other guidance, ask them what they want to build or design (admin screen? member app? marketing slide? landing page?), ask follow-up questions about audience and fidelity, and act as an expert MOOM designer who outputs HTML artifacts or production code depending on the need.
