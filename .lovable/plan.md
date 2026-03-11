

# Momentum Page — Final Audit & Remaining Fixes

## Current State (After Previous Rounds)

The code already implements the target dashboard structure:
- Single-scroll layout (no tabs) with 5 sections: Hero, Daily Quests, Weekly Quests, Almost There, Rewards Preview
- Compact hero with TierBadge + XPProgressBar + Coin pill (Row 1) and StreakFlame + Freeze link (Row 2)
- XP shows "24 / 120 XP to Lv2" correctly
- Freeze is a small text link
- Quest data is seeded: 3 daily + 2 weekly instances for the test member
- Quest templates (8 daily, 8 weekly, 4 monthly, 2 seasonal) all exist in DB
- CompactEmptyState with "Check In" CTA replaces the old dead zone

## Remaining Issues to Fix

### 1. Quest templates need to be inserted for the user's full quest list
The user provided 20 quest templates (8 daily, 8 weekly, 4 monthly). All 22 already exist in DB (including 2 seasonal). **No DB changes needed.**

### 2. Hero XP bar visibility on orange background
The XP progress bar uses `bg-secondary` for the track, which may be hard to see on the orange hero. The parent overrides `[&_span]:text-primary-foreground/80` but the track itself needs `bg-white/20` instead of `bg-secondary`.

**File**: `XPProgressBar.tsx`
- Add an `onHeroBg` prop that switches the track to `bg-white/20` and the fill to white, matching the hero theme.

### 3. Streak label "1w" is still ambiguous
**File**: `StreakFlame.tsx`
- Change `{currentStreakWeeks}w` to `{currentStreakWeeks} wk` for clarity, or show the full word when space allows.

### 4. MemberHomePage still imports `DailyBonusCard`
The home page still renders a standalone `DailyBonusCard` which creates a redundant check-in CTA. This should be removed or simplified since the Momentum page now handles quest-based check-in CTAs.

**File**: `MemberHomePage.tsx` — no change needed here since it's a different page (Home vs Momentum). The DailyBonusCard on Home is appropriate as a quick action widget.

### 5. Quest RLS — members can read their own quests
RLS policy `Members read own quests` uses `get_my_member_id(auth.uid())`. This requires the member to be authenticated. If the member logs in via the member app, identity_map must link their `experience_user_id` to the `admin_entity_id` (member_id). **This is already set up correctly.**

## Plan Summary

Only minor polish changes remain:

| # | File | Change |
|---|------|--------|
| 1 | `XPProgressBar.tsx` | Add `onHeroBg` prop for white-on-orange track styling |
| 2 | `MemberMomentumPage.tsx` | Pass `onHeroBg` to XPProgressBar; remove the CSS override hacks `[&_span]` and `[&_.inline-flex]` |
| 3 | `StreakFlame.tsx` | Change label from `{n}w` to `{n} wk` for readability |

These are purely cosmetic refinements. The architecture, data model, quest seeding, and page structure are all complete and correct.

