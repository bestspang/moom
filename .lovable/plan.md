

# System Audit — Findings & Fix Plan

## Verified Working (No Issues)

- Realtime publication: 44 tables match `useRealtimeSync.ts` — fully synchronized ✅
- `evaluate_member_tier` RPC: correct `event_type` column, extra_criteria, tier notification ✅
- SP rules in DB: `class_attend` (correct), all 14 rules present ✅
- Edge function SP logic: `package_purchase` check correct at line 564 ✅
- Referral SP write: present at line 772-791 ✅
- `community_event` gamification rule: exists and active ✅
- Auth trigger: `on_auth_user_created` → `handle_new_user()` active ✅
- `GamificationStatusTiers.tsx`: no `as any` casts, proper typing ✅
- StatusTierBadge in MomentumCard, HomePage, ProfilePage ✅
- `PLATFORM_CONTRACT.md`: all 9 edge functions + 4 RPCs documented ✅
- Notification enum: all 13 types present in DB ✅
- `tier_change` in useNotifications, Notifications.tsx, MemberNotificationsPage ✅
- i18n `tierChange` key present in both EN and TH ✅

---

## Issues Found

### 1. Notification type labels hardcoded in English (i18n Gap)

**File:** `src/pages/Notifications.tsx` lines 85-91

The `getTypeLabel` function has 7 gamification notification types with hardcoded English strings instead of i18n keys:

```typescript
badge_earned: 'Badge Earned',        // should be t('notifications.types.badgeEarned')
level_up: 'Level Up',
challenge_completed: 'Challenge Completed',
reward_fulfilled: 'Reward Fulfilled',
streak_milestone: 'Streak Milestone',
xp_earned: 'XP Earned',
referral_completed: 'Referral Completed',
```

**Impact:** Thai users see English labels for gamification notification types in the admin notification page.

**Fix:** Add 7 i18n keys to `en.ts` and `th.ts` under `notifications.types`, then use `t()` in the component.

### 2. Admin notification filter missing gamification types (UX Gap)

**File:** `src/pages/Notifications.tsx` line 37-44

The `notificationTypes` filter array only has 6 types — the 7 gamification types are absent from filter chips. Admins cannot filter to see only badge/level/tier/streak notifications.

**Fix:** Add `badge_earned`, `level_up`, `challenge_completed`, `reward_fulfilled`, `streak_milestone`, `xp_earned`, `referral_completed` to the array.

### 3. Stale project memory still says `package_purchased` (Regression Risk)

**Memory `architecture/gamification-event-contracts`** still says:
> "The gamification event pipeline utilizes the 'package_purchased' (past tense) event key"

This is incorrect — the actual key is `package_purchase`. This memory will mislead future AI edits into reverting the fix.

**Fix:** Documentation already has the AI safety warning banner. The `.lovable/plan.md` should be updated with a clear note about this memory being stale, since we cannot directly edit project memory.

---

## Implementation Plan

| # | File | Change | Risk |
|---|------|--------|------|
| 1 | `src/i18n/locales/en.ts` | Add 7 notification type keys: `badgeEarned`, `levelUp`, `challengeCompleted`, `rewardFulfilled`, `streakMilestone`, `xpEarned`, `referralCompleted` | Zero — additive |
| 2 | `src/i18n/locales/th.ts` | Add same 7 keys in Thai | Zero — additive |
| 3 | `src/pages/Notifications.tsx` | Replace hardcoded strings with `t()` calls; add 7 gamification types to filter array | Zero — string replacement only |
| 4 | `.lovable/plan.md` | Update with stale memory warning about `package_purchased` vs `package_purchase` | Zero — doc only |

### What stays exactly the same
- All edge functions, DB functions, seed data, SP rules — verified correct
- All frontend components (StatusTierBadge, StatusTierCard, MomentumCard) — correct
- Realtime sync — complete
- PLATFORM_CONTRACT.md — up to date
- data-contract.md — up to date
- useNotifications.ts — correct (already has all 13 types)
- MemberNotificationsPage — correct

---

## Feature Suggestions (Verified Safe — All Additive)

**1. Comeback Quest System** — When a member's tier downgrades, auto-assign a special "comeback quest" (e.g., "Check in 3 times in 10 days = +15 SP boost"). This was in the user's original spec. Implementation: new quest type in `gamification_challenges`, triggered by the tier notification logic in `evaluate_member_tier`. No existing code modified.

**2. Tier Benefits Redemption UI** — Members can see their tier benefits but cannot yet redeem them (e.g., "free water this month"). Needs a `tier_benefit_redemptions` table + a member-facing UI card. Purely additive — new table, new component, no existing logic touched.

**3. SP History Timeline** — Member app shows current tier but no SP earning history. A small timeline component reading from `sp_ledger` would show members how they earned their SP. Purely additive — new query + new component.

