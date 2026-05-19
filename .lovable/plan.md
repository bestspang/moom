# Fix: Save bar must float locked to viewport (not page bottom)

## Root cause

The save bar uses `position: fixed`, but its ancestor `<main>` in `MainLayout.tsx` wraps every page in:

```tsx
<div className="animate-page-enter-desktop">
```

That class runs `fade-in-up` with `animation-fill-mode: both`, whose `to` keyframe is `transform: translateY(0)`. A non-`none` `transform` on an ancestor **creates a containing block**, so `position: fixed` is resolved against that ancestor instead of the viewport. Result: the pill sticks to the bottom of the page's content area, not to the screen — exactly the bug reported.

This affects only the Branding page right now because it's the only page rendering a `fixed` floating bar inside the animated wrapper. We should not remove the page-enter animation (used by every admin page).

## Fix

Render the save bar through a React **portal** to `document.body` so it escapes the transformed ancestor and resolves `fixed` against the viewport.

### File: `src/pages/settings/SettingsBranding.tsx`

1. Add `import { createPortal } from 'react-dom';`.
2. Wrap the existing save-bar JSX (lines 569–604) in `createPortal(..., document.body)`.
3. Guard with `typeof document !== 'undefined'` for SSR safety (cheap, harmless in Vite).
4. Keep all existing behavior: only render when `dirty && canWrite`, same pill markup, same `handleRevert` / `saveMutation.mutate` / `writeBlockedToast` logic, same i18n keys, same `Save` icon, same shadow + pulse dot, same `animate-in slide-in-from-bottom-4` entrance.

No other files change. No CSS, no layout, no animation tokens touched.

## Regression checklist

- Pill appears centered at `bottom: 20px` of the **viewport** while scrolling on Branding.
- Pill hides when `dirty === false` and for read-only users (`canWrite === false`).
- Cancel reverts to last saved brand and clears dirty.
- Save calls `saveMutation.mutate(brand)`; pill disappears on success.
- Page-enter animation on Branding still plays on mount.
- Other admin pages unaffected (no portal added to them).
- Mobile width (360px): pill stays centered, doesn't overflow.
