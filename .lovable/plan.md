

# Add Info Button for Quest & Reward Details

## Overview
Add a small `ⓘ` button on quest cards and reward cards that opens a popover/sheet showing the full description, goal details, and reward breakdown.

## Changes

### 1. QuestInstanceCard — add info popover (`QuestHub.tsx`)
- Import `Popover, PopoverTrigger, PopoverContent` from `@/components/ui/popover` and `Info` from lucide.
- Add a small `Info` icon button (h-4 w-4, muted) next to the quest name.
- Popover content shows: full `descriptionEn` (no truncation), goal type/value, XP reward, coin reward, and period label.

### 2. RewardDropCard — add info popover (`RewardDropCard.tsx`)
- Same pattern: `Info` icon next to `reward.nameEn`.
- Popover shows: full `descriptionEn`, points cost, cash price, level required, stock info, reward type, and badge requirement if any.

### 3. RewardPreview cards — add info popover (`RewardPreview.tsx`)
- Add small `Info` icon on each compact reward card.
- Popover shows full name + description + cost details.

### 4. i18n keys (`en.ts`, `th.ts`)
- `member.questDetails` → "Quest Details" / "รายละเอียดเควส"
- `member.rewardDetails` → "Reward Details" / "รายละเอียดรางวัล"
- `member.goal` → "Goal" / "เป้าหมาย"
- `member.period` → "Period" / "ระยะเวลา"

### Files
| File | Change |
|------|--------|
| `QuestHub.tsx` | Add `Info` icon + `Popover` to `QuestInstanceCard` |
| `RewardDropCard.tsx` | Add `Info` icon + `Popover` next to reward name |
| `RewardPreview.tsx` | Add `Info` icon + `Popover` on compact cards |
| `en.ts` / `th.ts` | Add 4 i18n keys |

