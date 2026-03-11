

# Redesign Momentum Page — Premium Daily Dashboard

## Summary of Issues
The current page has 7 major UX problems: oversized hero, cramped card stacking, broken XP display ("24/0 XP"), unclear streak visualization, overly prominent Freeze button, dead "No quests" zone, and duplicated navigation (tabs + bottom nav both have Rewards).

## Architecture Decision
- **Remove the 3-tab layout** (Level/Quests/Rewards). Instead, present a single scrollable dashboard with clear sections. Bottom nav already provides access to Rewards page.
- **Quest templates already exist in DB** (8 daily, 8 weekly, 4 monthly, 2 seasonal) — no DB changes needed.
- **XP bug**: `xpForLevel(0)=0` and `xpForLevel(1)=0`, so for level 1 user: `xpNeeded = 0-0 = 0` → division by zero → "24/0". Fix: ensure minimum denominator or show absolute progress to level 2.

## Files to Change

### 1. `src/apps/member/features/momentum/XPProgressBar.tsx`
**Fix the 0/0 XP bug**
- When `xpNeeded <= 0` (level 1 edge case), use `xpForLevel(level+1)` as fallback
- Show label: "24 / 120 XP to Level 2"

### 2. `src/apps/member/pages/MemberMomentumPage.tsx` — **Full Redesign**
Replace the entire page with a single-scroll dashboard:

```text
┌─────────────────────────┐
│ COMPACT HERO            │  ~120px instead of ~250px
│ [Tier] Lv1 Starter      │
│ ████████░░ 24/120 XP    │
│ 🔥 1w  M·T·W·T·F·S·S   │
│ 3 Coin    [Freeze ❄ 50] │  ← freeze is small text link
└─────────────────────────┘
          ↕ 16px gap
┌─────────────────────────┐
│ ☀️ TODAY'S QUESTS        │
│ ┌─────────────────────┐ │
│ │ Check In Today  +12XP│ │
│ │ ████░░░░  0/1       │ │
│ └─────────────────────┘ │
│ (2 more quest cards)    │
│ ─── or fallback ───     │
│ "Quests refreshing soon"│
│ [Check In Now]          │
└─────────────────────────┘
          ↕ 16px gap
┌─────────────────────────┐
│ 📅 WEEKLY PROGRESS      │
│ Two-Day Momentum  0/2   │
│ Mix It Up         0/2   │
└─────────────────────────┘
          ↕ 16px gap
┌─────────────────────────┐
│ ⚡ ALMOST THERE          │
│ • 96 XP to Level 2      │
│ • 1 check-in → +12 XP   │
└─────────────────────────┘
          ↕ 16px gap
┌─────────────────────────┐
│ 🎁 REWARDS              │
│ [horizontal scroll]     │
│ [View All →]            │
└─────────────────────────┘
```

**Key changes:**
- Hero: remove giant XP number, use compact horizontal layout with tier badge + XP bar + coin + streak all in ~120px
- Remove `DailyBonusCard` as a separate block — merge check-in CTA into quest area
- Remove `<Tabs>` entirely — single scroll
- Add "Almost There" motivational section (computed from profile data)
- Add compact reward preview (horizontal scroll, top 4 rewards)
- Streak: keep `StreakFlame` but in the hero, make Freeze a small text button not a full `<Button>`
- More `gap-4` / `gap-5` spacing between sections

### 3. `src/apps/member/features/momentum/StreakFlame.tsx`
- Make day dots use today-aware highlighting (filled = checked, ring = today, empty = future)
- Show "day" streak label if `streak_type=daily` instead of always "w"

### 4. `src/apps/member/features/momentum/QuestHub.tsx`
- Improve empty state: instead of big dead zone, show compact "Quests refreshing..." with actionable CTA
- Add monthly quests section
- Tighter card design with less vertical space per quest

### 5. New component: `src/apps/member/features/momentum/AlmostThereCard.tsx`
- Compute motivational nudges from profile data:
  - XP remaining to next level
  - Active quest closest to completion
  - Coin balance vs cheapest reward

### 6. New component: `src/apps/member/features/momentum/RewardPreview.tsx`
- Horizontal scroll of top 3-4 affordable/near-affordable rewards
- "View All →" link to `/member/rewards`

## Spacing & Design Tokens
- Section gap: `space-y-5` (20px)
- Hero padding: `px-5 pt-12 pb-4` (reduced from `pt-14 pb-5`)
- Card padding: `p-4` consistent
- Section headers: `text-xs font-bold uppercase tracking-wider text-muted-foreground`
- All cards: `rounded-xl border bg-card`

## No Database Changes Required
Quest templates are already seeded. The page just needs UI restructuring.

