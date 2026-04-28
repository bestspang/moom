# MOOM Design System

**Brand:** MOOM (MOOM Wellness Club / MOOM CLUB)
**Tagline TH:** ฟิตเนสที่จัดการได้ในมือเดียว
**Tagline EN:** Your gym, gamified.

## What is MOOM?

MOOM is an **all-in-one fitness management platform** for gyms, studios, and independent trainers in Thailand — plus a gamified member experience layered on top. Owners run schedules, payments, member CRM, staff, and analytics from one dashboard; members book classes, check in via QR / LINE, and level up through XP, streaks, status tiers, badges, squads, and rewards.

The product is bilingual (Thai / English) and LINE-native — deeply integrated with LINE LIFF mini-apps, LINE Login, and LINE messaging, which is how most Thai consumers reach their businesses.

## Products (surfaces)

The codebase contains **three distinct product surfaces**:

1. **Admin Web App** — desktop dashboard for gym owners, managers, trainers, front desk. Dense data tables, KPI tiles, schedule timelines, finance, AI briefings, reports. This is the "operator" surface.
2. **Member App** — mobile-first LINE LIFF mini-app. Home (greeting + momentum card), schedule, check-in (QR scanner), packages, rewards, profile. Heavy gamification: XP bar, status tiers (Bronze → Black), streak flame, squad feed, quest hub, badge grid, daily bonus, leaderboards.
3. **Trainer App** — mobile LIFF for coaches. Schedule, attendance, impact dashboard (coach tier / partner tier), roster, badges.

A **Staff** surface (mobile "front desk" on LIFF) also exists for minimum-access staff running check-in + payments.

## Sources of truth

| Resource | Location |
|---|---|
| Codebase | GitHub: `bestspang/moom` (main) |
| Design tokens | `src/index.css` (HSL custom properties — 100+ tokens) |
| Tailwind config | `tailwind.config.ts` |
| Feature analysis | `APP_ANALYSIS.md` in the repo |
| Primary components | `src/components/ui/*` (shadcn/ui, customised) |
| Member app | `src/apps/member/*` |
| Admin dashboard | `src/pages/*`, `src/components/dashboard/*` |
| Logos | `assets/logos/` (black / orange / white PNG) |

Nothing from the repo is pre-loaded beyond what's copied into `assets/`. Anything else must be fetched via GitHub again.

## Tech stack the design mirrors

React 18 + TypeScript + Vite · Tailwind CSS + shadcn/ui · lucide-react icons · react-hook-form + Zod · TanStack Query · Supabase · Recharts · i18next (EN/TH) · LINE LIFF SDK.

---

## Index — files in this system

- `colors_and_type.css` — full CSS variable token layer (colors, type scale, radii, shadows, gamification tokens)
- `assets/logos/` — MOOM logos (orange / black / white PNG)
- `preview/` — small Design System cards (each registered as an asset)
- `ui_kits/admin/` — admin dashboard UI kit (desktop, 1280+)
- `ui_kits/member/` — LINE LIFF member app UI kit (mobile, 390)
- `SKILL.md` — Claude Code skill manifest (`moom-design`)

---

## Content fundamentals

### Voice

Friendly operator + encouraging coach. Never corporate, never hypey. Two audiences, two registers:

- **Admin copy** — direct, data-forward, operational. Short nouns and verbs. "Revenue today", "Needs attention", "Check in", "Approve slip". Metrics are stated plainly; never dressed up.
- **Member copy** — warm, motivating, second person. Time-of-day greetings ("Good morning, {firstName}"), a light gamified cheer when it's earned ("Almost there!", "You're on a 12-day streak 🔥"). Never saccharine.

### Bilingual rule

Every string ships in **Thai and English**. Thai is the primary market; English is the secondary. UI never mixes them in the same sentence, but labels can sit next to each other (e.g. `name_en` + `name_th` fields). The app defaults to Thai on the member surface, Thai or English on admin depending on user setting.

### Case + punctuation

- Sentence case for everything — headings, buttons, menu items. Never ALL CAPS except micro eyebrows and the 10px badge labels (where uppercase + 0.08em tracking is used).
- No trailing periods on buttons, menu items, stat card titles.
- Numbers are tabular — `font-variant-numeric: tabular-nums` on KPIs.
- Thai Baht: `฿1,200` or `1,200 บาท` (admin uses the symbol; member copy often uses the word).

### Tone examples pulled from the code

- "Good morning, Ploy" / "สวัสดีตอนเช้า พลอย"
- "Ready to train?" / "พร้อมออกกำลังกายแล้วหรือยัง?"
- "Almost there — {xp} XP to Level {n}"
- "Needs attention" (never "Alerts!" or "⚠ Warnings")
- "Your gym, gamified." (tagline — declarative, punchy, no fluff)

### Emoji

**Used sparingly and with intention.** Emoji appear only in:
- Tier medals: 🥉 🥈 🥇 💠 💎 🖤 (Bronze → Black) — these are the official tier icons
- Member-app celebrations: 🔥 for streaks, ✨ for level-ups, 🎉 for rewards
- Never in admin surfaces. Never in body copy. Never as decoration.

### No-go's

- No marketing exclamation points in UI chrome.
- No "!" / "!!" / "????" in loading states or errors.
- No emoji in admin.
- No "please" in button labels.
- No "click here".

---

## Visual foundations

### The orange

MOOM has one brand color that matters: **MOOM Orange `hsl(32 100% 50%)` / `#FF8800`**. It is the primary CTA, the active nav item, the XP bar fill, the streak flame, the focus ring. Everything else is a neutral or a utility color. Don't invent second brand colors.

- **Black `hsl(0 0% 15%)` / `#262626`** — logo mark, body text, the "black tier" badge.
- **Cream `hsl(36 33% 94%)`** — sidebar background on desktop. Warm, not grey. This is the quiet signature — MOOM isn't a white-and-orange product, it's a cream-and-orange product.
- **Teal `hsl(168 75% 43%)`** — success, healthy, paid, active. The only other saturated color in the system.
- Neutrals sit at `hsl(0 0% {20,40,60,88,96,100}%)` — standard 5-step grey.

### Type

- **Per-surface split.** MOOM runs two sibling typefaces:
  - **Admin (desktop):** **Anuphan** (Cadson Demak) — dashboard-calm, 8 weights, matched TH/Latin metrics. `var(--font-admin)`.
  - **Member (LINE LIFF):** **LINE Seed Sans TH** — designed by LINE for LINE; makes the mini-app feel platform-native. Weights 400/500/700/800. `var(--font-member)`.
  - **Fallback:** IBM Plex Sans Thai (glyph-coverage safety net) → `system-ui`.
- Body is **13px**, not 16px — MOOM runs noticeably tight. Desktop admin is information-dense; mobile member app uses the same 13-ish base.
- Weights in use: 400 / 500 / 600 / 700 (admin) · 400 / 500 / 700 / 800 (member). No 300, no 900.
- KPI numerals use `font-variant-numeric: tabular-nums` and `font-weight: 700` (admin) or `800` (member hero).
- Eyebrow micro-labels: 10px, 600, uppercase, 0.08em tracking.
- **Loading:** `preconnect` to `fonts.gstatic.com`, `&display=swap` on the Google Fonts URL, only load the weights listed above — no 800 on admin, no 300/600 on member.

### Corners, borders, shadows

- Radii: `8px` standard card/input, `6px` small buttons, `4px` micro, `20px` pill/badge, full circle for FAB + avatars.
- Borders are **1px solid `hsl(0 0% 88%)`** — a light grey. Never dashed. Borders define cards more than shadows do.
- Shadows are **soft and shallow**:
  - `--shadow-sm`: `0 1px 2px rgba(0,0,0,.05)`
  - `--shadow-md`: `0 2px 8px rgba(0,0,0,.08)` ← the card default
  - `--shadow-lg`: `0 4px 16px rgba(0,0,0,.10)` ← modals / floating
- In dark mode, shadows darken (opacity .3 / .4 / .5) to stay visible.

### Cards

A card = `1px border + rounded-lg (8px) + shadow-sm/md + white bg + 12px padding` (`p-3` in Tailwind — tight). On the dashboard, KPI cards get a **4px colored left border accent** (`border-l-4`) in orange, teal, blue, or pink to categorize them at a glance. This is one of the few places MOOM uses the colored-left-border pattern — it's intentional, not decorative.

### Backgrounds

- White on admin content, cream on the sidebar, white/card on mobile. No full-bleed photos, no hero gradients, no illustrations as backgrounds.
- The only "texture" in the system is the orange logo at rest, and the occasional subtle glow on status-tier badges (`box-shadow: 0 0 8px {tier-color}/.1`).

### Gradients

Used only in two places:
- **XP / tier accents** — subtle `/0.15` background behind tier badges.
- **Momentum card hero** — an orange-to-warm-orange wash, only on the top hero element of the member home.

No blue→purple gradients. No rainbow anything.

### Hover + press states

- **Hover on buttons:** opacity drops to `/0.9` on primary (`bg-primary hover:bg-primary/90`) or `/0.8` on secondary. Never scale, never shadow-bump.
- **Hover on rows:** subtle `bg-accent/50` fill (a very soft grey wash).
- **Hover on links:** underline appears (`hover:underline`), color stays.
- **Press / active:** in the member app, the checkin FAB uses `active:scale-95`. Other press states are rare — MOOM is not a bouncy/springy product.
- **Focus:** 2px ring in orange `hsl(var(--ring))` with 2px offset. Keyboard-visible only.

### Motion

MOOM is **restrained** — this is a business tool, not a game app, despite the gamification. Animations are used sparingly:

- **Fade + slide-in on page enter:** `animate-in fade-in-0 slide-in-from-bottom-2 duration-300` on member pages.
- **Accordion expand/collapse:** 0.2s ease-out.
- **Scan line** (check-in QR): 2.5s ease-in-out infinite (the signature moving line).
- **Momentum-only animations** (gated to member app): `shimmer` 2s linear (XP bar shimmer on level-up), `pulse-glow` 2s, `flame-flicker` 0.8s for the streak flame, `bounce-in` 0.4s on XP toasts, `stamp-in` for badges. These are the **only** "fun" motion; everywhere else is a simple fade or a color transition.
- **Easing:** `ease-out` for entrances, `ease-in-out` for loops. Durations cluster at 200–400ms.

### Transparency + blur

Rare. The member check-in overlay uses `bg-black/50` for modal backdrops. Sidebar overlay on mobile is `bg-black/50`. No frosted-glass chrome, no backdrop-filter usage.

### Layout rules

- Desktop admin uses a **200px fixed left sidebar** (cream bg, icon + label), a **56px top header**, and a fluid content area. Container maxes at `1400px` (2xl).
- Mobile member app has a **56px sticky top header** and a **bottom nav with a floating centered FAB** (the check-in button sits -mt-4 above the nav baseline — the signature mobile layout).
- Vertical rhythm is tight: `space-y-6` (24px) between major sections on admin; `mb-4` (16px) between cards on member.

### Imagery tone (when it exists)

MOOM currently ships almost no photography or illustration in the product — the brand is mark + type + color. When photography is added, it should be **warm, natural, un-stylized** — real gym floors, real sweat, no stock-photo smiles. Warm white balance, not cool. Never b&w, never high-contrast fashion. Never AI-gradient backgrounds.

---

## Iconography

**Primary system:** [`lucide-react`](https://lucide.dev) — the entire codebase uses Lucide. Stroke-based, 1.5px stroke default, 16–20px sizes. Consistent, crisp, and matches the Plex type weight well.

- Admin sidebar: `h-4 w-4` (16px).
- Bottom nav / FAB: `h-5 w-5` (20px), active state gets `stroke-[2.5px]`.
- KPI card icons: `h-5 w-5`, always `text-muted-foreground` (grey), never colored.
- Dialog / form labels: `h-4 w-4`.

**Usage patterns:**
- Icons appear to the **left of labels** in nav and buttons, with a 8–10px gap (`gap-2` / `gap-2.5`).
- Icon-only buttons use `size-icon` (32×32) and must have an aria-label.
- Icons are never filled — always line/stroke.
- No emoji as icons in admin. In the member app, **tier medals** (🥉🥈🥇💠💎🖤) are emoji by design — they're the only sanctioned emoji-as-icon usage.

**CDN fallback:** The design system previews load Lucide from `https://unpkg.com/lucide@latest/dist/umd/lucide.js` so static HTML mocks match the codebase look 1:1.

**No other icon systems** — no Heroicons, no Feather, no Font Awesome, no custom SVG sprite. A single Lucide import covers everything.

---

## Next steps

See `ui_kits/admin/` and `ui_kits/member/` for interactive kits, and the Design System tab for the full card gallery.

## Caveats + substitutions

- **Fonts:** `IBM Plex Sans Thai` is loaded from Google Fonts (same source the codebase uses) — no local TTF files provided or needed.
- **Logos:** the white logo file exists but appears to be a blank transparent PNG (it is intentionally white-on-nothing; use on dark backgrounds).
- **MOOM interior tone PDF:** was listed as an uploaded file but is not present in the project filesystem — if you have it, please re-attach.
