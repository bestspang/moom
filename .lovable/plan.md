# Realistic Mobile Preview for Branding Page

## Scope
Replace the simplified phone frame in `src/components/branding/previews/MobilePreview.tsx` with a realistic iPhone-style mockup. Only the **mobile** preview is touched. WebPreview, CardPreview, editor, save logic, color picker, brand kit hooks, and tokens are untouched.

## What changes (visual only)

**Outer device frame (new)**
- iPhone 15-style chassis: ~`375×760` total, ~`8px` titanium bezel, outer radius `54px`, inner screen radius `46px`.
- Side hardware: silent switch + volume up/down on the left, power button on the right (thin rounded bars on the outer edge).
- Subtle dual-layer shadow + thin highlight border to suggest metal rim.
- Optional `scale-[0.92]` wrapper so it still fits the preview panel.

**Screen chrome**
- Dynamic Island: pill `120×34`, centered, `top: 10px`, pure black, with a tiny inner camera dot.
- Status bar (44px tall, content offset around the island):
  - Left: time `9:41`, SF-like weight.
  - Right: signal bars (4 bars SVG), wifi glyph, battery (rounded rect + nub + fill).
- Home indicator: bottom-centered `134×5` rounded bar over a `34px` safe area.

**Inner app content (kept, lightly adjusted)**
- Keep existing header, hero gradient card, filter chips, class list, and bottom tab bar — they already use brand tokens.
- Adjust top padding so content starts **below** the Dynamic Island (≈`56px` from screen top).
- Adjust bottom padding so the tab bar sits **above** the home indicator safe area.
- Tab bar gets a subtle `backdrop-blur` + translucent white to feel iOS-native.
- Hero card gets a very subtle inner highlight (`box-shadow: inset 0 1px 0 rgba(255,255,255,.25)`) to read as glass on gradient.

## What is preserved (regression guard)
- `BrandKit` prop shape and all token bindings (`brand.primary`, `secondary`, `accent`, `surface`, `radius`, `font`, `fontWeight`, `name`, `tagline`).
- `LogoMark` usage and sizing.
- Class list data, chip labels, tab icon set.
- No changes to `BrandPreviewPanel`, `WebPreview`, `CardPreview`, `SettingsBranding`, `useBrandKit`, `applyBrandFromKit`, i18n, or routes.

## Technical notes
- Pure Tailwind + inline styles; no new dependencies.
- All hardware/chrome rendered with `div` + SVG; no images.
- Colors for chassis/island/indicator are neutral hardware grays (not brand tokens) since they represent the physical device, not the app.

## Files touched
- `src/components/branding/previews/MobilePreview.tsx` — rewrite only this file.

## Out of scope
- Web/Card preview redesign.
- Editor, color picker, save bar, or any business logic.
- Other admin pages.

## Regression checklist
1. `/branding` loads without console errors.
2. Editing primary/accent/secondary/surface/radius/font still updates the phone in real time.
3. Logo style/shape changes still reflect in header.
4. Save, Cancel, Export, Reset still work.
5. Web and Card preview tabs unchanged.
