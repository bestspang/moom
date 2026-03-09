

# MOOM Momentum Club — Gap Analysis & Next Steps

## Current State (Verified Against Spec)

### ✅ Fully Complete
| Area | Status |
|------|--------|
| DB Schema (all 5 new tables + alterations) | ✅ Done |
| Seed data (15 rules, 20 levels, 25 quests, 20 badges, 21 rewards, 9 coupons, 2 shop rules) | ✅ Done, values match spec |
| RLS policies on all new tables | ✅ Done |
| Edge Functions (assign-quests, claim-quest, issue-coupon) | ✅ Done |
| Quest progress tracking in process-event | ✅ Done |
| QuestHub component (daily/weekly/monthly with claim) | ✅ Done |
| MemberCouponsPage + route | ✅ Done |
| MemberRewardsPage "Coin" terminology | ✅ Done |
| api.ts quest/coupon fetchers | ✅ Done |

### ❌ Gaps Found

**Gap 1: QuestHub NOT wired into MemberMomentumPage**
The Quests tab (line 346–438) still uses the OLD `gamification_challenges` + `QuestCard` component. The new `QuestHub` component (which reads from `quest_instances`/`quest_templates`) exists but is never imported or rendered. This is the **biggest functional gap** — users won't see their daily/weekly quests.

**Gap 2: Stale "RP" text in MemberMomentumPage**
- Line 473: `"keep earning RP!"` → should be "Coin"
- Line 499: `"Earn RP by checking in"` → should be "Coin"

**Gap 3: Admin UI — 3 missing tabs (Phase 5 not started)**
GamificationStudio has 8 tabs but is missing:
- **Quests** tab (CRUD on `quest_templates`)
- **Coupons** tab (CRUD on `coupon_templates`)
- **Shop Rules** tab (CRUD on `shop_reward_rules`)

**Gap 4: Admin dialogs not enhanced**
- `CreateBadgeDialog` — missing `badge_type`, `effect_type`, `effect_value`, `duration_days` fields
- `CreateRewardDialog` — missing `cash_price`, `reward_type`, `required_badge_id` fields

**Gap 5: Trainer system (Phase 6 not started)**
- No trainer-specific quest templates in DB
- No trainer coin tracking
- No trainer rewards

---

## Implementation Plan

### Batch A — Fix Member Quests Tab (Critical)
1. **Replace old Quests tab content** in `MemberMomentumPage.tsx` with the `QuestHub` component
   - Remove the old `gamification_challenges` based quest rendering (lines 346–438)
   - Import and render `<QuestHub />` instead
   - Keep the old `gamification_challenges` "Available Quests" section below QuestHub as "Community Challenges" for backward compatibility

2. **Fix remaining "RP" → "Coin"** text (2 spots in MemberMomentumPage)

### Batch B — Admin UI: Quest/Coupon/Shop Tabs
3. **Create `GamificationQuests.tsx`** — Quest template CRUD page with period filters (daily/weekly/monthly/seasonal)
4. **Create `GamificationCoupons.tsx`** — Coupon template CRUD page  
5. **Create `GamificationShopRules.tsx`** — Shop reward rules CRUD page
6. **Create hooks**: `useGamificationQuests.ts`, `useGamificationCoupons.ts`, `useGamificationShopRules.ts`
7. **Add 3 new tabs** to `GamificationStudio.tsx` and routes in `App.tsx`

### Batch C — Enhanced Admin Dialogs
8. **Enhance `CreateBadgeDialog`** — Add badge_type dropdown, effect_type, effect_value JSON, duration_days
9. **Enhance `CreateRewardDialog`** — Add cash_price, reward_type dropdown, required_badge_id selector

### Batch D — Trainer System (deferred to Phase 2 per spec)
- Trainer quest templates seed data
- Trainer coin ledger integration  
- Trainer rewards catalog

---

## Files to Modify/Create

| File | Change |
|------|--------|
| `src/apps/member/pages/MemberMomentumPage.tsx` | Wire QuestHub, fix RP→Coin |
| `src/pages/gamification/GamificationQuests.tsx` | **New** — Quest template admin |
| `src/pages/gamification/GamificationCoupons.tsx` | **New** — Coupon template admin |
| `src/pages/gamification/GamificationShopRules.tsx` | **New** — Shop rules admin |
| `src/hooks/useGamificationQuests.ts` | **New** — CRUD hook |
| `src/hooks/useGamificationCoupons.ts` | **New** — CRUD hook |
| `src/hooks/useGamificationShopRules.ts` | **New** — CRUD hook |
| `src/pages/gamification/GamificationStudio.tsx` | Add 3 tabs |
| `src/App.tsx` | Add 3 admin routes |
| `src/components/gamification/CreateBadgeDialog.tsx` | Add badge_type/effect fields |
| `src/components/gamification/CreateRewardDialog.tsx` | Add cash_price/reward_type fields |
| `src/i18n/locales/en.ts` + `th.ts` | Add translation keys for new tabs |

## Risk Assessment
- **Batch A**: Low risk — QuestHub already works, just needs to be placed in the right spot
- **Batch B**: Low risk — additive admin pages, no existing flows affected
- **Batch C**: Medium risk — modifying shared dialogs, but changes are additive (new optional fields)
- **Batch D**: Deferred per user's rollout plan

