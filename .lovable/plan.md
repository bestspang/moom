

# Momentum Page — Full UI Redesign + Quest Seeding

## Current State After Last Round
The previous changes created the right structure (single-scroll, no tabs) but several issues persist:

1. **Hero still too tall** — `pt-12 pb-4` with 3 rows of content takes ~180px; needs to be ~120px
2. **DailyBonusCard is a separate block** below the hero — should be merged into the quest section
3. **Streak shows "1w"** — unclear if daily or weekly; day dots lack clear today marker on the orange background
4. **Freeze button** is a raw `<button>` that does nothing (comment says "Trigger freeze via the StreakFreezeButton logic" but no actual freeze call)
5. **No quest instances exist** — the edge function auto-assign silently fails, so users always see "No quests yet" empty state
6. **Quest cards are dense** — each card is ~120px tall with progress bar, period badge, rewards, and action
7. **Spacing** — `space-y-5` (20px) between sections is okay but cards within sections use `space-y-3` (12px) which feels tight

## Plan

### Part 1: Seed Quest Instances (Data Insert)
Insert 3 daily + 2 weekly quest instances for member `1509a8c5-4268-4e12-9c22-caf81f6d611c` so the page has real content:
- Daily: "Come In Today", "One Class, Done", "Quiet Hour Hero"  
- Weekly: "Two-Day Momentum", "Mix It Up"
- Set `start_at`/`end_at` for today (daily) and this week (weekly), status = `active`, progress = 0

### Part 2: Hero Compaction (`MemberMomentumPage.tsx`)
- Reduce padding: `pt-12 pb-4` → `pt-10 pb-3`
- Merge Tier + Coin + Streak into 2 rows instead of 3:
  - Row 1: TierBadge (sm) + XP progress bar + Coin pill
  - Row 2: StreakFlame + Freeze text link
- Remove the decorative circle background element

### Part 3: XP Progress Bar Label
- Change display from `{totalXP} / {nextLevelXP} XP` to `{totalXP} / {nextLevelXP} XP to Lv{level+1}`
- Already showing correct numbers (24/120), just needs the "to Lv2" suffix

### Part 4: Streak Clarity (`StreakFlame.tsx`)
- On the orange hero background, day dots use `hsl(var(--primary))` which is invisible — switch to white-based colors
- Change "1w" label to show the actual streak count with clearer unit
- Make today's dot more prominent (larger ring, white ring on orange bg)

### Part 5: Remove DailyBonusCard from Dashboard
- Remove the standalone `<DailyBonusCard />` — check-in CTA is already implied by the "Come In Today" quest card
- If no daily quests exist, show a compact CTA to check in instead

### Part 6: Quest Card Density (`QuestHub.tsx`)
- Reduce card padding from `p-4` to `p-3`
- Make progress bar `h-1.5` instead of `h-2`
- Remove the period badge (daily/weekly) since quests are already grouped by section headers
- Tighter vertical spacing

### Part 7: Empty State Improvement (`QuestHub.tsx`)
- Replace dead "No quests yet" with actionable fallback:
  - "Quests are refreshing..." with a check-in CTA button
  - Smaller, less prominent design

### Part 8: Section Spacing
- Increase section gap from `space-y-5` to `space-y-6` for more breathing room
- Add subtle section dividers or more padding between hero and content

### Files to Change
| File | Changes |
|------|---------|
| DB (data insert) | Seed 5 quest_instances for the test member |
| `MemberMomentumPage.tsx` | Compact hero (2 rows), remove DailyBonusCard, increase section spacing |
| `XPProgressBar.tsx` | Add "to Lv{N}" suffix |
| `StreakFlame.tsx` | Fix colors for orange background, clearer today marker |
| `QuestHub.tsx` | Tighter quest cards, better empty state with CTA |

