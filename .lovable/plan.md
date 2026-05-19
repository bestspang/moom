## Goal
Bring `/branding` to 100% visual parity with `MOOM Design System/ui_kits/admin/Branding.jsx`, while keeping all working backend wiring (`useBrandKit`, `useSaveBrandKit`, `applyBrandFromKit`, i18n, activity log).

## Gap Analysis (current → reference)

| Area | Current | Reference | Action |
|---|---|---|---|
| Section card header | Plain `AdminCard` + h3/p | `BCard` with colored icon chip + title + subtitle in bordered header | Build `BrandSectionCard` wrapper |
| Color picker | Native `<input type=color>` swatch only | Popover with hue gradient bar, H/S/L sliders, HEX + copy | Rewrite `ColorField` as `ColorSwatch` popover |
| Mobile preview | ~260px simplified card list | 360×620 phone with status bar, header w/ eye btn, hero gradient card w/ pill CTAs + accent blob, filter chips, 3 class rows w/ progress bars, bottom tab bar | Rewrite `MobilePreview` |
| Web preview | Plain header + small photo + 2 buttons | Browser chrome (3 dots + URL), full nav (logo, name, links, CTA pill), 40px-padded hero w/ eyebrow pill, two-tone H1 (60% width), tagline, 2 CTAs, 2 decorative circles | Rewrite `WebPreview` |
| Card preview | Single membership card | 2-col grid: membership card (gradient + GOLD chip + ID/expiry) **and** email header (primary band + welcome body + CTA) | Rewrite `CardPreview` |
| Preview panel chrome | Tabs above plain bg | Eye icon + "ตัวอย่างสด" + tab pill on top; preview surface w/ gradient bg on mobile, white on others | Update `BrandPreviewPanel` |
| Brand summary | Missing | Card under preview listing name/font/radius/colors swatches | Add `BrandSummaryCard` |
| Sticky save bar | Missing | Bottom-fixed bar visible when `dirty`, Save + Cancel | Add `BrandStickyBar` |
| Title dirty badge | Amber `Badge` from shadcn | Pill w/ warn-soft bg matching DS | Keep but restyle |
| Section icons + accents | None | sparkle(orange), image(info-blue), palette(pink), type(success-green), image(purple), web(orange), biz(warn-amber) | Pass `icon`+`accent` to wrapper |

## New / Edited Files

**New**
- `src/components/branding/BrandSectionCard.tsx` — DS card chrome with `icon` (lucide) + `accent` (hsl string) chip in header
- `src/components/branding/BrandSummaryCard.tsx` — summary list (name, font, radius, color row)
- `src/components/branding/BrandStickyBar.tsx` — bottom-fixed Save/Cancel bar
- `src/components/branding/previews/MobilePreview.tsx` — full 360×620 mockup
- `src/components/branding/previews/WebPreview.tsx` — browser chrome + hero
- `src/components/branding/previews/CardPreview.tsx` — membership card + email header

**Edited**
- `src/components/branding/ColorField.tsx` → rename intent to `ColorSwatch`: popover w/ hue bar, 3 sliders, HEX+copy. Keep export name `ColorField` for callsite stability.
- `src/components/branding/BrandPreviewPanel.tsx` — use new preview components + DS header chrome
- `src/pages/settings/SettingsBranding.tsx` — swap `AdminCard` for `BrandSectionCard` with icons/accents; add summary + sticky bar; remove the "Save" duplicate from header (lives in sticky bar)
- `src/i18n/locales/{th,en}.ts` — add `settings.branding.livePreview`, `summary`, `saveBar.save`, `saveBar.cancel`, social/contact icon labels

## Mapping decisions (project-fit)

- Reference uses inline styles + `adminTokens`. We translate to Tailwind + semantic tokens (`bg-primary`, `text-primary`, `border-border`, `bg-muted`, `bg-amber-50/text-amber-700` for warn-soft equivalents). Direct brand colors (preview surfaces) keep inline `style` because they're user-driven brand values, not DS tokens.
- Reference stores in `localStorage`. We keep our Supabase `settings.branding.brand_kit` path via `useBrandKit`/`useSaveBrandKit`.
- Logo upload stays "coming soon" (DS shows it too as toast-only).
- All Thai strings go through i18n; no raw text added.

## Things explicitly preserved (no regression)

- `useBrandKit` query + `useSaveBrandKit` mutation + `logActivity` on save
- `applyBrandFromKit(brand)` live-token effect on every change, restore on unmount
- `DEFAULT_BRAND`, `COLOR_PRESETS`, `FONT_CHOICES`, `PHOTO_STYLES` schema unchanged
- Route `/branding` + sidebar entry untouched
- `useSettings('branding')` typing unchanged

## Regression checklist

1. `/branding` loads server data, hydrates editor.
2. Editing any field updates preview instantly (mobile/web/card all reflect).
3. Color popover: drag sliders → preview updates; HEX copy works.
4. Dirty badge appears; sticky bar shows; Save persists + toast + activity log.
5. Cancel reverts to last saved.
6. Export downloads JSON.
7. Reset confirms then loads `DEFAULT_BRAND`.
8. Unmounting page (navigate away) restores saved tokens app-wide.
9. Mobile (<lg) stacks editor over preview; preview no longer sticky.
10. No new TS errors; build passes.

## Out of scope
- Logo file upload (still placeholder).
- Applying brand tokens beyond `--primary/--accent/--radius/--font-admin`.
- Other admin pages.