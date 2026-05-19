# Branding RBAC, i18n, and Upload Validation

Three small, independent hardening tasks on the existing `/branding` editor. No design changes — strictly access control, language coverage, and safe uploads.

## 1. RBAC — gate the Branding editor

Use the existing `usePermissions()` hook against the `settings` resource (already in `ALL_RESOURCES`).

- `can('settings', 'read')` → required to see the page. If false, render a DS-aligned "no access" empty state in place of the editor (uses `AdminPageHeader` + an `AdminCard` with a lock icon + i18n message). No redirect.
- `can('settings', 'write')` → required to edit, save, revert, reset, upload, and use the sticky save bar. When false:
  - All inputs/buttons inside the editor get `disabled` + `aria-disabled`. Color pickers, preset buttons, font/logo/photo selectors render in read-only mode (clicking is a no-op).
  - Export stays enabled (it's a read-only download).
  - Header actions: Reset hidden, Export visible.
  - Sticky save bar never appears (no dirty state can occur).
  - A small inline DS banner at the top of the editor says "Read-only — your role does not allow editing branding."
- Defense in depth: `useSaveBrandKit` mutation guards with a pre-flight `can('settings','write')` check and aborts with a localized toast if false (server-side RLS on `settings` table is the real boundary; this is a UX guard so blocked users don't see save spinners).

No schema changes — `settings` RLS already restricts writes to managers; we just mirror it in the UI.

## 2. i18n — full EN/TH coverage for Branding

Audit `SettingsBranding.tsx`, `BrandPreviewPanel`, `BrandSectionCard`, `BrandSummaryCard`, `ColorField`, `LogoMark`, the three preview components, and `useBrandKit` for any raw strings, then add the missing keys to both `src/i18n/locales/th.ts` and `src/i18n/locales/en.ts`.

Known gaps to add:
- RBAC: `settings.branding.noAccessTitle`, `noAccessBody`, `readOnlyBanner`, `writeBlockedToast`.
- Upload validation toasts: `uploadInvalidType`, `uploadTooLarge`, `uploadDimensionsTooSmall`, `uploadDimensionsTooLarge`, `uploadFailed`, `uploadSuccess`, `uploadProgress`, `uploadRemove`, `uploadHint`.
- Upload UI labels: `uploadLogo` (exists — verify), `uploadPhoto`, `dragDropHint`, `maxSize`, `acceptedFormats`.
- Any preview placeholder text currently hardcoded in Thai/English inside the preview components stays as-is (it's mock content, not chrome).

Audit step: grep each file for string literals not wrapped in `t(...)`; for legitimate mock copy (e.g. "HIIT กับโค้ชพิม · 18:00" inside the phone preview) leave untouched and document the exception in a code comment.

## 3. Upload validation for logo + photography

Currently logo upload is a disabled placeholder; photography upload doesn't exist. This task adds real upload paths gated by the RBAC above.

**Storage**
- New migration adds bucket `brand-assets` (public read, authenticated write), with RLS policies:
  - SELECT: public.
  - INSERT/UPDATE/DELETE: `has_min_access_level(auth.uid(), 'level_3_manager')`.
- File path convention: `logo/<timestamp>.<ext>` and `photo/<timestamp>.<ext>`.

**Validation helper** — new `src/lib/uploadValidation.ts`:
```ts
validateImageUpload(file, {
  kind: 'logo' | 'photo',
  maxBytes,         // logo 2 MB, photo 5 MB
  minDim,           // logo 256x256, photo 800x600
  maxDim,           // 4096x4096
  acceptMime,       // ['image/png','image/jpeg','image/webp','image/svg+xml'] for logo; no svg for photo
}) → { ok: true } | { ok: false, code, key, extras }
```
Reads dimensions via `createImageBitmap` (fallback `<img>` onload). Returns i18n key for caller; never throws.

**New shared component** — `src/components/branding/ImageUploadField.tsx`:
- DS-aligned dropzone (uses existing `AdminCard` border style + `border-dashed`).
- Drag-and-drop, click-to-browse, file-type accept hint, max-size hint, current-image preview thumbnail with Remove.
- On invalid file: shows inline DS error chip (red `text-destructive` with `AlertCircle` icon) AND a sonner `toast.error` using the localized message; no upload is attempted.
- On valid file: uploads to `brand-assets`, writes public URL into the kit field via `onChange(url)`, shows success toast.
- All labels, hints, and errors via `t(...)`.

**Wiring**
- `BrandKit` already has shape; extend `brandDefaults.ts` with optional `logoUrl?: string` and `photoUrl?: string` (additive, defaults `undefined`). `LogoMark` falls back to letter if `logoUrl` absent (preserves existing behavior).
- Logo section: replace the disabled placeholder button with `<ImageUploadField kind="logo" value={brand.logoUrl} onChange={(url) => set({ logoUrl: url })} />`. When a URL is set, `LogoMark` renders the image inside the chosen shape (square/circle/wordmark) instead of the letter; clearing reverts to the letter.
- Photography section: add `<ImageUploadField kind="photo" value={brand.photoUrl} onChange={...} />` below the style chips. When set, `PhotoBlock` uses the uploaded image with the chosen `photoStyle` filter applied via CSS.
- Both fields respect the RBAC gate from task 1 (disabled in read-only mode with a tooltip).

**Preserved**
- Existing brand kit shape (additive only), color/font/preset logic, preview panel, mobile/web/card previews, `applyBrandFromKit`, save/export/reset flow.
- LogoMark letter fallback when no `logoUrl`.

## Files touched

- New: `supabase/migrations/<ts>_brand_assets_bucket.sql`
- New: `src/lib/uploadValidation.ts`
- New: `src/components/branding/ImageUploadField.tsx`
- Edited: `src/pages/settings/SettingsBranding.tsx` (RBAC gate, replace disabled upload button, add photo upload field)
- Edited: `src/components/branding/brandDefaults.ts` (add optional `logoUrl`, `photoUrl`)
- Edited: `src/components/branding/LogoMark.tsx` (render `logoUrl` when present)
- Edited: `src/hooks/useBrandKit.ts` (preflight write check, localized error)
- Edited: `src/i18n/locales/th.ts` and `en.ts` (full key coverage)

## Out of scope

- Visual redesign, preview component changes, AI image generation, image cropping/editing, other admin pages, brand-token expansion beyond logoUrl/photoUrl.

## Regression checklist

1. `/branding` loads for managers (level 3+) and owners — full editor, save works, activity log entry written.
2. `/branding` for `level_2_operator` / `level_1_minimum` — page renders read-only banner, Save bar never appears, Export still works, inputs visibly disabled.
3. Uploading a 10 MB JPG to logo → toast error "file too large", no upload attempted, no console error.
4. Uploading a 100×100 PNG to logo → toast error "min 256×256".
5. Uploading an SVG to photography → toast error "format not supported".
6. Uploading a valid 500 KB PNG to logo → success toast, preview updates, save persists URL, refresh restores image.
7. Removing uploaded logo reverts to letter fallback; existing letter/font/color logic untouched.
8. EN locale: switch language, no `settings.branding.*` keys appear as raw paths.
9. Existing color/font/preset/reset/export flows unchanged.
