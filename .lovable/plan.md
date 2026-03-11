

# TierBadge Background → White

## Problem
The badge background uses a tinted color (`hsl(var(--tier-*) / 0.15)`) which blends into the card. User wants a clean white background.

## Change

### `TierBadge.tsx` (line 50)
- Change `backgroundColor` from `hsl(var(${config.colorVar}) / 0.15)` → `white`
- Keep the text color and box-shadow as-is so the tier color is still visible via text and emblem

| File | Change |
|------|--------|
| `TierBadge.tsx` | Set `backgroundColor: 'white'` on the badge span (line 50) |

