

# Fix: MomentumCard invisible + add missing gamification elements

## Root Cause

`MomentumCard` returns `null` on line 40 when `fetchMomentumProfile` returns null (no `member_gamification_profiles` row for this member). Since new/unlinked users won't have a gamification profile row yet, the entire gamification section disappears.

Additionally, the card is missing:
- Badge gallery (horizontal scroll)
- Quick links to Leaderboard and Squad

## Plan

### 1. MomentumCard — show starter fallback when no profile
Instead of `return null`, render a "starter" card with:
- Default Level 1 / Starter tier
- XP bar at 0
- Streak at 0
- Invite to "Check in to start earning XP!"
- Same tap → `/member/momentum` behavior

### 2. Add badge horizontal scroll strip below streak row
- Fetch `fetchMyBadges(memberId)` in the card
- Show up to 6 badges as small circles in a horizontal scroll
- If none: show "Earn your first badge" with a lock icon
- Tap → `/member/badges`

### 3. Add Leaderboard + Squad quick links
- Below badges, add two compact pill-buttons:
  - "Leaderboard" → `/member/leaderboard`
  - "My Squad" → `/member/squad`
- Compact row, icon + text, muted styling

### Files to modify
- `src/apps/member/features/momentum/MomentumCard.tsx` — all 3 changes above

### Risk: Zero
- Additive only — no DB/edge function changes
- Existing behavior preserved for users who DO have a profile

