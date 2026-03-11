

# Add Level Perks Dialog to All TierBadge Instances

## Problem
The Level Perks dialog (showing benefits per level) only works on the MomentumCard on the home page. The TierBadge on the Momentum page, Profile page, Rewards page, and CheckInCelebration are not clickable.

## Approach
Instead of duplicating the dialog logic in every page, make TierBadge itself handle the perks dialog internally when `level > 1`. This keeps all pages consistent with zero extra work per page.

## Changes

| File | Change |
|------|--------|
| `TierBadge.tsx` | Add optional `interactive` prop (default `true`). When `level > 1` and interactive, wrap in a clickable button that opens a Dialog with `LevelPerksCard`. |
| `MomentumCard.tsx` | Remove the manual perks dialog logic (state, button wrapper, Dialog) — TierBadge now handles it internally. |

### TierBadge changes
- Add `useState` for dialog open/close
- Import `Dialog, DialogContent, DialogHeader, DialogTitle` and `LevelPerksCard`
- When `level > 1`, render the badge inside a `<button>` that opens the dialog on click
- The dialog contains `<LevelPerksCard currentLevel={level} />`
- `onClick` calls `e.stopPropagation()` to prevent parent navigation

### MomentumCard cleanup
- Remove `perksOpen` state, the conditional button wrapper around TierBadge, and the Dialog at the bottom of the component

