

# Fix Badge Icons, Badge Earning, and Quest Progress

## Issues Found

1. **Badge icons don't load**: All badges have `icon_url` like `/badges/first-step.png` — these files don't exist. The fallback shows a generic `Award` Lucide icon which is small and unclear.

2. **Badges never get earned**: The edge function (`gamification-process-event`) only awards badges via **challenge completion** rewards. There is **no code** that checks badge `unlock_condition` (e.g., `{type: "checkin_count", value: 1}`) directly after events. So even though the member has 24 XP and a check-in, the "First Step" badge was never awarded.

3. **Quest progress never updates**: All `quest_templates` have `goal_action_key = NULL`. The edge function checks `qt.goal_action_key !== event_type` — when `goal_action_key` is null, this always skips. Quests will never progress.

## Plan

### Part 1: Emoji fallback for badge icons
**Files**: `BadgeGrid.tsx`, `MemberBadgeGalleryPage.tsx`, `TrainerBadgesPage.tsx`

Add a `BADGE_EMOJI` map keyed by badge name pattern or unlock condition type:
- `checkin_count` → 🏃
- `class_attend_count` → 🎯
- `open_gym_count` → 💪
- `distinct_class_types` → 🧭
- `consecutive_weeks` → 🔥
- `squad_join` → 🤝
- `successful_referral` → ⭐
- `shop_order_count` → 🛍️
- `comeback_visits` → 💫
- default → 🏅

When `iconUrl` is null or the image fails to load, render the emoji at 24px instead of the Lucide `Award` icon.

### Part 2: Add badge unlock checking to edge function
**File**: `supabase/functions/gamification-process-event/index.ts`

After updating the profile (step 10), add a new step that:
1. Fetches all active badges from `gamification_badges`
2. Fetches already earned badge IDs from `badge_earnings` for this member
3. For each unearned badge, checks `unlock_condition` against current stats:
   - `checkin_count` → compare against attendance count from `xp_ledger` events
   - `streak` / `consecutive_weeks` → compare against `newStreak`
   - `xp_total` → compare against `newTotalXp`
   - `level` → compare against `newLevel`
   - Other types → skip (will be handled by specific event processors later)
4. Inserts into `badge_earnings` with `ON CONFLICT IGNORE`
5. Returns newly earned badges in the response

### Part 3: Fix quest_templates goal_action_key
**Database migration**: Update all quest templates to map `goal_type` → `goal_action_key`:
- `checkin_count` → `check_in`
- `class_attend_count` → `class_attended`
- `offpeak_checkin_count` → `check_in`
- `visit_days_per_week` → `check_in`
- `shop_order_count` → `shop_purchase`
- Other types get their matching event key

### Part 4: Seed the "First Step" badge for test member
**Database**: Insert a `badge_earnings` row for member `1509a8c5...` with badge `First Step` (id: `c8da797e...`) since they already have 1 check-in worth of XP.

## Files to Change

| File | Change |
|------|--------|
| `BadgeGrid.tsx` | Add emoji map, replace `Award` icon fallback with emoji |
| `MemberBadgeGalleryPage.tsx` | Same emoji fallback |
| `gamification-process-event/index.ts` | Add `checkBadgeUnlocks()` after profile update |
| DB migration | Update `quest_templates.goal_action_key` for all rows |
| DB insert | Seed badge earning for test member |

