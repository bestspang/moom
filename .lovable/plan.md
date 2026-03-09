

# MOOM Momentum Club — Recheck & Remaining Gaps

## Verification Summary

| Area | Status | Notes |
|------|--------|-------|
| DB Schema (quest_templates, quest_instances, coupon_templates, coupon_wallet, shop_reward_rules) | ✅ Done | |
| Badge columns (badge_type, effect_type, effect_value, duration_days) | ✅ Done | |
| Reward columns (cash_price, reward_type, required_badge_id) | ✅ Done | |
| Seed data (rules, levels, quests, badges, rewards, coupons, shop rules) | ✅ Done | |
| Edge Functions (assign-quests, claim-quest, issue-coupon, process-event quest tracking) | ✅ Done | |
| QuestHub wired into MemberMomentumPage | ✅ Done (line 349) | |
| MemberCouponsPage + route | ✅ Done | |
| Admin: GamificationQuests / Coupons / ShopRules tabs | ✅ Done | |
| Admin: CreateBadgeDialog (badge_type, effect_type, duration_days) | ✅ Done | |
| Admin: CreateRewardDialog (reward_type, cash_price) | ✅ Done | |
| "RP" renamed to "Coin" in MomentumPage & RewardsPage | ✅ Done | |

## Remaining Gaps

### Gap 1: RewardDropCard does NOT show hybrid coin+cash pricing
`RewardDropCard.tsx` only shows `pointsCost`. For hybrid rewards (e.g., "Exclusive shaker: 80 coin + ฿199"), it should display both the coin cost AND cash price. The `cashPrice` field exists in the type but is never rendered.

### Gap 2: Badge Gallery does NOT show badge_type or effect info
`MemberBadgeGalleryPage.tsx` shows badges with tier/rarity but doesn't display:
- Badge type label (Permanent / Boost / Access)
- Effect description (e.g., "+2 coin per 3rd visit")
- Expiry countdown for boost badges
- The `badgeType`, `effectType`, `effectValue`, `durationDays` fields are mapped in the API but never rendered.

### Gap 3: No Level Perks display
There is no `LevelPerksCard` component. The spec defines perks per level (e.g., Level 3 = profile frame, Level 5 = merch coupon access, Level 10 = package coupon tier 1). The `LevelRequirementsCard` shows XP/streak/quests/badges progress but NOT what perks the user has unlocked or what's coming next.

### Gap 4: Trainer system not started (Batch D)
- No trainer-specific quests, coin tracking, or rewards
- Existing `CoachImpactCard` and `PartnerReputationCard` show score/metrics but no coin balance or quest system
- No trainer reward catalog

### Gap 5: MemberBottomNav missing Coupon entry
The coupon page exists at `/member/coupons` but there's no navigation entry to reach it from the member app.

---

## Implementation Plan

### Batch 1: Enhance RewardDropCard for hybrid pricing
**File:** `src/apps/member/features/momentum/RewardDropCard.tsx`
- Show `cashPrice` alongside coin cost when `cashPrice > 0`
- Display as "80 Coin + ฿199" format
- Show `rewardType` badge label (Digital, Perk, Hybrid, etc.)

### Batch 2: Enhance Badge Gallery with types & effects
**File:** `src/apps/member/pages/MemberBadgeGalleryPage.tsx`
- Add badge type label (Permanent / Boost / Access / Seasonal)
- Show effect description for non-cosmetic badges
- Show expiry timer for boost badges (using `durationDays` + `earnedAt`)
- Visual distinction between permanent vs time-limited badges

### Batch 3: Create Level Perks Card
**New file:** `src/apps/member/features/momentum/LevelPerksCard.tsx`
- Fetch from `gamification_levels` table
- Show unlocked perks (levels ≤ current) with check marks
- Show upcoming perks (next 2-3 levels) with lock icons
- Wire into MemberMomentumPage Level tab

**Update:** `src/apps/member/features/momentum/api.ts` — add `fetchLevelPerks()` function
**Update:** `src/apps/member/pages/MemberMomentumPage.tsx` — add LevelPerksCard to Level tab

### Batch 4: Add Coupon navigation
**File:** `src/apps/member/components/MemberBottomNav.tsx`
- Add coupons link or integrate into existing nav (e.g., Rewards section)
- Or: add a coupon shortcut button on MemberMomentumPage rewards tab

### Batch 5: Trainer system foundations (deferred per user's rollout plan)
- Seed trainer quest templates
- Add coin tracking to trainer scores
- Trainer reward catalog
- This is Phase 2 per spec — will note but not implement now unless requested

---

## Files to modify/create

| File | Change |
|------|--------|
| `src/apps/member/features/momentum/RewardDropCard.tsx` | Show hybrid coin+cash pricing |
| `src/apps/member/pages/MemberBadgeGalleryPage.tsx` | Badge types, effects, expiry |
| `src/apps/member/features/momentum/LevelPerksCard.tsx` | **New** — level perks display |
| `src/apps/member/features/momentum/api.ts` | Add `fetchLevelPerks()` |
| `src/apps/member/pages/MemberMomentumPage.tsx` | Wire LevelPerksCard |
| `src/apps/member/components/MemberBottomNav.tsx` | Add coupon nav entry |

## Risk
- All changes are additive UI enhancements
- No DB changes needed — all columns/tables already exist
- No edge function changes needed
- Zero regression risk to existing flows

