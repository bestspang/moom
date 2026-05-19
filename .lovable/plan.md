## Chunk H — Real working "แบรนด์ยิม" (Branding) page

Replace the placeholder `SettingsBranding.tsx` with a real editor matching `MOOM Design System/ui_kits/admin/Branding.jsx`. **Live preview + persist to DB + apply tokens at runtime.** No new tables — reuse the existing `settings` kv store.

### Data model (no migration)

Store the whole brand kit as one JSON row in `settings`:
```
section = 'branding'
key     = 'brand_kit'
value   = { name, tagline, about, logoLetter, logoStyle, primary, secondary,
            accent, surface, font, fontWeight, radius, photoStyle,
            social: { ig, fb, line, tt, yt, web },
            contact: { phone, mail, addr } }
```
Why one row: matches DS shape verbatim; one upsert per Save; easy export/import as JSON.

### Files

**New**
```
src/components/branding/brandDefaults.ts      — DEFAULT_BRAND, COLOR_PRESETS, FONT_CHOICES, PHOTO_STYLES, BrandKit type
src/components/branding/LogoMark.tsx          — renders square/circle/wordmark from kit
src/components/branding/PhotoSwatch.tsx       — small photo block with filter, used in Photography picker
src/components/branding/ColorField.tsx        — labeled hex/HSL field + native color input + live swatch
src/components/branding/BrandPreviewPanel.tsx — sticky right column: device switcher + 3 preview surfaces
src/hooks/useBrandKit.ts                      — load/save kit via existing useSettings hooks
```

**Edited**
```
src/pages/settings/SettingsBranding.tsx       — full rewrite (DS-aligned editor)
src/hooks/useSettings.ts                      — add 'branding' to SettingsSection union
src/components/admin-ds/BrandTokens.ts        — add applyBrandFromKit(kit) helper
src/i18n/locales/th.ts                        — add settings.branding.* keys (sections, fields, hints, photo styles, social labels, toasts)
src/i18n/locales/en.ts                        — same keys
```

**Untouched**: `src/App.tsx` (route already at `/branding`), Sidebar, Settings shell.

### Page structure

```text
AdminPageHeader: "แบรนด์ยิม" + subtitle + actions[ Export Kit | Reset ]
                                  + dirty-badge "• มีการเปลี่ยนแปลงที่ยังไม่บันทึก"
┌──────────────────────────────────────────────┬─────────────────────┐
│ LEFT — editor (lg: 1fr)                      │ RIGHT — preview     │
│                                              │ (lg: 420px, sticky) │
│ AdminCard ตัวตน        name, letter, tagline,│ Device switcher:    │
│                        about                 │  Mobile | Web | Card│
│ AdminCard โลโก้         style (3-up), radius │                     │
│                        slider, size triplet, │ Live render reading │
│                        upload button         │ from brand kit:     │
│ AdminCard สีของแบรนด์  8 presets + 4 color  │  - Mobile: member    │
│                        swatches              │    home card + class │
│ AdminCard ตัวอักษร      5 font choices,      │    list (uses        │
│                        weight 500-800        │    primary/font)     │
│ AdminCard รูปภาพ       4 photo style chips  │  - Web: hero + button│
│ AdminCard โซเชียล      6 inputs (IG/FB/    │  - Card: membership  │
│                        LINE/TT/YT/Web)       │    card             │
│ AdminCard ติดต่อ       phone/mail/address   │                     │
│                                              │                     │
│ Sticky bottom action bar (when dirty):       │                     │
│   [ ยกเลิก ]    [ บันทึก ]                   │                     │
└──────────────────────────────────────────────┴─────────────────────┘
```

### Behavior

- **Load**: `useBrandKit()` reads `settings.branding.brand_kit`. If absent → `DEFAULT_BRAND`.
- **Edit**: All edits update local `brand` state. `dirty = JSON.stringify(saved) !== JSON.stringify(brand)`.
- **Live preview**: every change immediately re-renders `BrandPreviewPanel`. `applyBrandFromKit(brand)` is also called on every change so the editor cards themselves theme-shift (per user requirement: tokens drive the system). Tokens are restored to `saved` values on unmount.
- **Save**: upsert one row → `useUpdateSetting({ section:'branding', key:'brand_kit', value: brand })` → `logActivity({ event_type:'branding_updated' })` → toast + `setSaved(brand)`.
- **Cancel** (Revert): `setBrand(saved)` + re-apply tokens from saved.
- **Reset**: confirm → `setBrand(DEFAULT_BRAND)` (still requires Save to persist).
- **Export Brand Kit**: download `${slug}-brand-kit.json` (client-only, no DB).

### Token mapping (BrandTokens helper)

`applyBrandFromKit(kit)` converts kit values to CSS vars on `<html>`:
| Kit field | CSS var | Transform |
|---|---|---|
| `primary` `hsl(22 95% 55%)` | `--primary` | strip `hsl(` and `)` → `22 95% 55%` |
| `accent` | `--accent` | same |
| `secondary` | `--sidebar-accent-foreground` | same |
| `surface` | (preview only, not applied globally) | n/a |
| `radius` (px) | `--radius` | `${px/16}rem` |
| `font` | `--font-admin` | quote-wrap |

Scope: **only the Branding page** applies these tokens at runtime in this chunk. Persisting them globally to every surface is intentionally deferred — would need an app-shell loader and is out of scope for one page.

### Out of scope (explicit)

- Logo file upload (button shows toast "เร็วๆ นี้" — uses `roadmap.comingSoon` badge, `opacity-60 pointer-events-none` per Core rule).
- Applying brand tokens app-wide on boot (only this page previews them).
- New DB table or migration.
- RLS changes (existing `settings` policies cover it; manager+ already gates the route).
- Touching other admin pages.

### Motion

- Card enter: existing `animate-in fade-in-0 slide-in-from-bottom-2 duration-200` (already in Settings shell).
- Dirty badge: `animate-fade-in`.
- Sticky save bar slides in via `animate-in slide-in-from-bottom-4` when `dirty` flips true.
- Preview cross-fades on device switch with `transition-opacity duration-200`.

### Regression checklist

- `/branding` loads without console errors when `settings.branding.brand_kit` row doesn't exist (uses defaults).
- Editing → preview updates instantly; navigating away without Save reverts tokens.
- Save persists; full reload shows persisted values.
- Cancel reverts both UI and tokens to last saved.
- Export downloads valid JSON.
- Existing `/setting/branding` redirect still works.
- Mobile (<768px): preview panel stacks under editor; sticky save bar remains accessible.
- `useSettings('branding')` works (added to type union, no other call sites change).
- No raw English status text — all toasts/labels via i18n.
- `logActivity` fires on save.
