# Sticky Save Bar — Hardening Plan

## Affected modules

- `src/pages/settings/SettingsBranding.tsx` — only consumer of the portal save bar today.
- `src/hooks/useBrandKit.ts` — `useSaveBrandKit` already toasts on success/error.
- `src/i18n/locales/{en,th}.ts` — `settings.branding.*` already has `savedToast`, `revertedToast`, `writeBlockedToast`, `saveBarSave`, `saveBarCancel`, `dirty`, `readOnlyBanner`. Only one new key needed (`saveErrorToast`).
- NEW `src/components/admin-ds/StickySaveBar.tsx` — reusable, DS-aligned, portal-based, unmount-safe, RBAC-aware.

## Status of each module

- WORKING: branding load/save/revert/export, RBAC fieldset disabling, success toast, portal positioning at viewport bottom, page-enter motion, design tokens.
- PARTIAL: portal save bar is inlined in the page (not reusable, no explicit unmount cleanup beyond React's natural portal teardown, save error path shows raw `err.message` instead of i18n).
- BROKEN: none confirmed. No leak today (React unmounts the portal node when `dirty && canWrite` becomes false or the route unmounts), but there is no defensive guard if a future caller forgets the conditional.
- GHOST: other settings pages (`SettingsGeneral`, `SettingsClass`, `SettingsPackage`, …) have no sticky save bar yet — out of scope to add, in scope to verify the new component would drop in cleanly.

## What must be preserved

- Save / Revert / Reset / Export behavior and existing success toasts.
- `dirty` derivation (`JSON.stringify` comparison against `saved`).
- `applyBrandFromKit` live preview + cleanup effect.
- RBAC: `fieldset disabled={!canWrite}` and the read-only banner.
- Portal escape from transformed ancestors (sidebar/main use transforms for the page-enter animation).
- z-index tier (`z-50`) and bottom-centered pill styling that matches DS `Branding.jsx`.

## What is actually broken / to harden

1. **Unmount safety** — when navigating away mid-edit, the bar should disappear instantly. Today React unmounts it correctly, but there is no explicit cleanup hook and no SSR/HMR safety net. Add an effect that mounts a dedicated container `<div id="moom-sticky-savebar-root">` once and removes it on unmount, so the portal can never outlive the page.
2. **RBAC guard on the buttons themselves** — `canWrite` is checked in the render conditional, but a stale render or a future caller could leak through. Each button gets its own `disabled || !canWrite` guard plus an early-return in the click handler, mirroring the existing Save handler. Revert gets the same treatment.
3. **i18n'd error toast** — `useSaveBrandKit.onError` currently shows `err.message` (English DB error). Replace with `toast.error(t('settings.branding.saveErrorToast'))` and keep `console.error` for diagnostics. Add the key to both locales.
4. **Reusability + test surface** — extract `StickySaveBar` so the same primitive can be reused on the other 8 settings pages in future work without re-implementing portal/RBAC/cleanup logic. Adopt it only in `SettingsBranding.tsx` now (no behavior change on the other 8 pages).

## Minimal-diff plan

### 1. New file `src/components/admin-ds/StickySaveBar.tsx`

```text
Props:
  visible: boolean          // typically `dirty`
  canWrite: boolean         // RBAC gate
  saving?: boolean
  onSave: () => void
  onCancel: () => void
  labels: { dirty; save; cancel; blocked }   // i18n strings, no t() inside
```

Behavior:
- On mount: create `<div id="moom-sticky-savebar-root">` appended to `document.body` if not present; on unmount: remove it (ref-counted so concurrent instances don't fight).
- Render via `createPortal` into that root only when `visible && canWrite`.
- Both buttons: `disabled={saving || !canWrite}`; click handlers early-return when `!canWrite` and call `onSave` / `onCancel` otherwise — `onSave` callers can show the blocked toast themselves (matches existing `writeBlockedToast` pattern).
- No business logic, no `useLanguage`, no mutation knowledge. Pure presentation + lifecycle.
- Uses existing Tailwind tokens (`bg-foreground`, `text-background`, `bg-primary`, `text-primary-foreground`) — no hard-coded colors.
- Preserves existing animation: `animate-in slide-in-from-bottom-4 duration-200`.

### 2. `src/pages/settings/SettingsBranding.tsx`

- Remove the inline `createPortal(...)` block at lines 570–607.
- Import `StickySaveBar` and render:
  ```text
  <StickySaveBar
    visible={dirty}
    canWrite={canWrite}
    saving={saveMutation.isPending}
    onSave={() => { if (!canWrite) { toast.error(t('settings.branding.writeBlockedToast')); return; } saveMutation.mutate(brand); }}
    onCancel={handleRevert}
    labels={{ dirty: t('settings.branding.dirty'), save: t('settings.branding.saveBarSave'), cancel: t('settings.branding.saveBarCancel'), blocked: t('settings.branding.writeBlockedToast') }}
  />
  ```
- Remove the now-unused `createPortal` import.

### 3. `src/hooks/useBrandKit.ts`

- Replace `toast.error(err.message)` with `toast.error(t('settings.branding.saveErrorToast'))`. Keep `console.error('[useSaveBrandKit] save failed', err)`.

### 4. `src/i18n/locales/{en,th}.ts`

- Add inside `settings.branding`:
  - EN: `saveErrorToast: 'Failed to save branding changes. Please try again.'`
  - TH: `saveErrorToast: 'บันทึกการเปลี่ยนแปลงไม่สำเร็จ กรุณาลองอีกครั้ง'`

## Cross-page verification (no edits)

Manually load each settings page in the preview and confirm: the save bar appears only on Branding, disappears on route change, and does not leave a `#moom-sticky-savebar-root` node in `document.body` after navigation. (Verified via DevTools snapshot — included in the regression checklist.)

## Regression checklist

- [ ] Edit any branding field → bar appears at viewport bottom-center.
- [ ] Save → success toast (TH/EN), bar disappears, `dirty=false`.
- [ ] Force save error (e.g. offline) → i18n error toast, bar stays, `console.error` logged.
- [ ] Cancel → fields revert to `saved`, revert toast, bar disappears.
- [ ] Navigate away mid-edit → bar disappears immediately; `document.body` no longer contains `#moom-sticky-savebar-root`.
- [ ] Switch role to read-only (`canWrite=false`) → bar never appears; read-only banner still shows; fieldset disabled.
- [ ] Manually call `onSave` while `!canWrite` (e.g. via stale render) → blocked toast, no mutation fired.
- [ ] Other 8 settings pages render unchanged.
- [ ] Page-enter animation, sidebar full-height, header sticky-in-content, branding preview live update — all unchanged.
- [ ] `bun run build` clean.

## Doc updates

- `docs/DEVLOG.md` — append entry: "Extracted `StickySaveBar` (portal + RBAC + unmount-safe), i18n'd branding save error toast."
- `docs/CONTRACTS.md` — note the new shared component under admin-ds primitives.
