

# Fix TierBadge Starter Color Contrast

## Problem
The `--tier-starter` CSS variable is `220 10% 60%` — a desaturated gray that, at 15% opacity background, is nearly invisible. The text is also hard to read.

## Fix
Increase saturation and adjust lightness for the starter tier so the badge is clearly visible while still feeling like the "base" tier.

### `src/index.css`
- Light mode: Change `--tier-starter: 220 10% 60%` → `--tier-starter: 220 30% 50%` (richer blue-gray)
- Dark mode: Change `--tier-starter: 220 10% 50%` → `--tier-starter: 220 30% 55%`

This gives a noticeably blue tint that reads well at both 15% bg opacity and full-strength text, while still being the most "neutral" tier compared to the vibrant Mover/Strong/Elite/Legend colors.

| File | Change |
|------|--------|
| `src/index.css` | Update `--tier-starter` in both light and dark mode |

