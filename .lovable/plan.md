

# Change XP Bar Color to Black

## Change
In `XPProgressBar.tsx`, update the fill color of the XP bar from orange (`hsl(var(--xp-bar))`) to black when **not** on the hero background. On the hero background, keep the white fill as-is.

### File: `src/apps/member/features/momentum/XPProgressBar.tsx`
- Line 42: Change `'hsl(var(--xp-bar))'` → `'#000'` (or `'hsl(0 0% 15%)')` for a softer black)
- Line 50: Change glow color to match — dark gray glow instead of orange glow
- Line 38: Update the glow shadow to use a dark color

Single-line changes, no structural modifications needed.

