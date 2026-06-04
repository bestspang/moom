## Problem
`BulkActionBar` already uses `fixed bottom-6 left-1/2`, but in the screenshot it renders next to the selected row instead of pinned to the bottom of the viewport.

Root cause: the bar is rendered inside `<Members>` page content, and an ancestor in the admin shell applies a CSS `transform` / `filter` / `will-change` (animate-in / slide / motion wrapper). When any ancestor has a transform, `position: fixed` is contained by that ancestor instead of the viewport — so `bottom-6` becomes "6 from the bottom of the row's animated container", which matches what we see.

## Fix (surgical, 1 file)
`src/components/common/BulkActionBar.tsx`
- Wrap the floating bar in a React `createPortal` to `document.body` so it escapes any transformed ancestor and is truly viewport-fixed.
- Keep classes: `fixed bottom-6 left-1/2 -translate-x-1/2 z-50` and add `pb-[env(safe-area-inset-bottom)]` wrapper for safety on devices with home indicator.
- Leave AlertDialog where it is (Radix already portals it).
- No prop/API change → no caller updates needed (Members, Classes, Staff, Packages, Promotions, WorkoutList all continue to work).

## Verification
1. `/members` → select 1 row → bar appears pinned to bottom-center of viewport, not over the row.
2. Scroll the table → bar stays at the bottom of the viewport.
3. Repeat on `/classes`, `/staff`, `/packages`, `/promotions`, `/workouts`.
4. Open delete confirm → AlertDialog still centers correctly.
5. Collapse/expand sidebar → bar stays centered to viewport (not offset by sidebar — current behavior preserved; if user wants it centered to content area only, that's a follow-up).

## Out of scope
- No redesign of the bar.
- No change to selection logic or i18n.
- No change to other floating elements.