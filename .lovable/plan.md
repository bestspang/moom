

# Gamification UI — Diagnosis + Enhancement Plan

## Why You Don't See Gamification UI

The screenshots you uploaded (gear icon in header, "Buy Package" button, "Your Stats" section, old bottom nav without centered Check-In) are from **old cached code**. The current codebase already has:

- MomentumCard with XP/RP/Streak/Badges/Quests on home page ✅
- Centered Check-In button in bottom nav ✅
- No gear icon in header ✅
- Full Momentum Hub page at `/member/momentum` with Level/Quests/Rewards tabs ✅

**Your preview needs a hard refresh** (Cmd+Shift+R) to see the latest code. The session replay confirms you're on a 404 page, not `/member`.

## Additional Gamification Enhancements (Beyond Current)

To push the UI closer to the reference screenshots, I'll add:

### 1. Daily Check-in Bonus Card (on Home + Momentum Hub)
- "Check in today to earn +50 XP!" motivational nudge
- Shows whether today's check-in reward has been claimed
- Pulses gently to draw attention

### 2. Level-Up Requirements Section (Momentum Hub → Level tab)
- Shows what the user needs to reach the next level
- Progress breakdown: "X of Y check-ins", "X of Y classes attended"
- Visual progress bars per requirement (like the reference "10 of 10", "7 of 10")

### 3. Active Perks Section with Rarity Labels
- Horizontal scroll of earned badges with **rarity labels** (Common/Rare/Epic/Legendary)
- Color-coded borders matching tier
- Badge name underneath each icon

### 4. XP as Hero Number on Momentum Page
- Large "1,500 XP" as the main hero stat (like reference screenshot 3)
- "Hold: 0 XP" subtitle for pending XP

### 5. "Earn More" Quick Action
- Prominent button linking to available quests
- Shows count of joinable challenges

## Files to Modify
- `MemberHomePage.tsx` — Add daily bonus nudge card above MomentumCard
- `MemberMomentumPage.tsx` — Hero XP display, level requirements section, active perks with rarity, "Earn More" button
- `MomentumCard.tsx` — Add daily bonus indicator dot
- `BadgeGrid.tsx` — Add rarity label underneath each badge

## Risk: Zero
- All additive cosmetic/UX changes
- No DB or edge function changes needed
- Existing functionality preserved

