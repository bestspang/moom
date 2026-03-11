

# Fix TierBadge to be Clickable at All Levels + Enrich LevelPerksCard

## Problem
Currently `TierBadge` only opens the perks dialog when `level > 1`, so Starter 1 users can't see level details. The user wants it clickable at **all** levels, and the dialog should show richer info: current level status, XP requirements to next level, and what each level unlocks.

## Changes

### 1. `TierBadge.tsx` — Remove `level > 1` restriction
- Line 77: Change `level > 1` to `level !== undefined` so all levels (including 1) are clickable.

### 2. `LevelPerksCard.tsx` — Enrich with XP requirements and current-level highlight
- Import `xpForLevel`, `tierFromLevel`, `TIER_CONFIG` from `./types`.
- Show **current level summary** at the top: tier badge, current XP threshold, XP needed for next level.
- For each level row, show the XP requirement (e.g. "120 XP") alongside the perks.
- Highlight the current level row visually (border or background accent).
- Show ALL levels (not just ones with perks), so users can see the full progression path even if some levels have no special perks configured yet.

### 3. i18n keys (`en.ts`, `th.ts`)
- `member.xpRequired` → "{{xp}} XP required" / "ต้องการ {{xp}} XP"
- `member.currentLevel` → "Your Level" / "เลเวลของคุณ"
- `member.nextLevelIn` → "{{xp}} XP to Level {{level}}" / "อีก {{xp}} XP ถึงเลเวล {{level}}"

### Files

| File | Change |
|------|--------|
| `TierBadge.tsx` | Change `level > 1` → `level !== undefined` |
| `LevelPerksCard.tsx` | Add current-level summary, XP thresholds per level, highlight current, show all 20 levels |
| `en.ts` / `th.ts` | Add 3 i18n keys |

