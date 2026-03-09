

# MOOM Momentum Club — Full Production Implementation Plan

## Current State Assessment

### What Already Exists in DB
| Entity | Table | Status |
|--------|-------|--------|
| Member XP/Level/Points | `member_gamification_profiles` | ✅ Has total_xp, current_level, available_points, streak |
| XP Ledger | `xp_ledger` | ✅ |
| Points Ledger | `points_ledger` | ✅ (this = Coin ledger) |
| Rules (earn rates) | `gamification_rules` | ✅ action_key, xp_value, points_value, cooldown, max_per_day |
| Challenges/Quests | `gamification_challenges` + `challenge_progress` | ✅ But no daily/weekly rotation |
| Badges | `gamification_badges` + `badge_earnings` | ✅ But no effect/duration system |
| Rewards | `gamification_rewards` + `reward_redemptions` | ✅ But no hybrid coin+cash |
| Levels | `gamification_levels` | ✅ But no perks system |
| Squads | `squads` + `squad_memberships` | ✅ |
| Seasons | `gamification_seasons` | ✅ |
| Trainer Scores | `trainer_gamification_scores` + `gamification_trainer_tiers` | ✅ |
| Streak | `streak_snapshots` | ✅ |
| Audit | `gamification_audit_log` | ✅ |

### What's Missing (New Tables Needed)
| Feature | Why |
|---------|-----|
| **Quest Templates** | Daily/weekly rotation pool — current `gamification_challenges` is static, not a rotating quest system |
| **Quest Instances** | Per-member daily/weekly quest assignments with expiry |
| **Coupon Templates** | Discount definitions (type, value, min_spend, validity, applies_to) |
| **Coupon Wallet** | Per-member issued coupons with expiry/usage tracking |
| **Badge Effects** | Duration, effect_type, effect_value on badges (boost/access types) |
| **Shop Reward Rules** | XP/coin earn rules for shop purchases by order type |
| **Level Perks** | Structured perks on `gamification_levels` (currently just jsonb) |

### What Needs Schema Updates (Existing Tables)
| Table | Change |
|-------|--------|
| `gamification_badges` | Add `badge_type`, `effect_type`, `effect_value`, `duration_days` |
| `gamification_rewards` | Add `cash_price`, `required_badge_id`, `daily_limit`, `monthly_limit`, `reward_type` |
| `gamification_challenges` | Add `audience_type`, `quest_period`, `is_quest_pool` for quest rotation |
| `gamification_levels` | Ensure `perks` jsonb has structured perk_code entries |
| `gamification_rules` | Update with all the new XP/coin values per the spec |

---

## Implementation Plan — Phased

### Phase 1: Database Schema (New tables + alterations)

**Migration 1: Quest system tables**
```sql
-- quest_templates: pool of quests that rotate daily/weekly
CREATE TABLE quest_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audience_type text NOT NULL DEFAULT 'member', -- member, trainer_inhouse, trainer_freelance
  quest_period text NOT NULL DEFAULT 'daily', -- daily, weekly, monthly, seasonal
  name_en text NOT NULL,
  name_th text,
  description_en text,
  description_th text,
  goal_type text NOT NULL DEFAULT 'action_count',
  goal_action_key text,
  goal_value integer NOT NULL DEFAULT 1,
  xp_reward integer NOT NULL DEFAULT 0,
  coin_reward integer NOT NULL DEFAULT 0,
  badge_reward_id uuid REFERENCES gamification_badges(id),
  coupon_reward_template_id uuid, -- FK added after coupon_templates created
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- quest_instances: assigned quests per member per period
CREATE TABLE quest_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL,
  quest_template_id uuid NOT NULL REFERENCES quest_templates(id),
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  progress_value integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active', -- active, completed, expired, claimed
  claimed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_quest_instances_member ON quest_instances(member_id, status);
```

**Migration 2: Coupon system**
```sql
CREATE TABLE coupon_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_th text,
  discount_type text NOT NULL DEFAULT 'fixed', -- fixed, percent
  discount_value numeric NOT NULL DEFAULT 0,
  max_discount numeric,
  min_spend numeric DEFAULT 0,
  valid_days integer NOT NULL DEFAULT 14,
  applies_to text NOT NULL DEFAULT 'all', -- merch, package, event, all
  stackable boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE coupon_wallet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL,
  coupon_template_id uuid NOT NULL REFERENCES coupon_templates(id),
  issued_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  status text NOT NULL DEFAULT 'active', -- active, used, expired
  source_type text, -- redemption, quest_reward, level_perk, campaign
  source_id uuid
);
CREATE INDEX idx_coupon_wallet_member ON coupon_wallet(member_id, status);
```

**Migration 3: Badge enhancements + shop rules**
```sql
-- Enhance badges with effect system
ALTER TABLE gamification_badges
  ADD COLUMN IF NOT EXISTS badge_type text DEFAULT 'permanent', -- permanent, boost, access, seasonal
  ADD COLUMN IF NOT EXISTS effect_type text, -- cosmetic, coin_bonus, xp_bonus, access, discount
  ADD COLUMN IF NOT EXISTS effect_value jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS duration_days integer; -- null = permanent

-- Enhance rewards with hybrid pricing
ALTER TABLE gamification_rewards
  ADD COLUMN IF NOT EXISTS cash_price numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS required_badge_id uuid REFERENCES gamification_badges(id),
  ADD COLUMN IF NOT EXISTS daily_limit integer,
  ADD COLUMN IF NOT EXISTS monthly_limit integer,
  ADD COLUMN IF NOT EXISTS reward_type text DEFAULT 'digital'; -- digital, perk, coupon, merch, access, hybrid

-- Shop reward rules
CREATE TABLE shop_reward_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_type text NOT NULL DEFAULT 'merch', -- merch, package, event
  min_spend numeric DEFAULT 0,
  xp_per_order integer DEFAULT 0,
  xp_per_spend_unit numeric DEFAULT 0, -- e.g. 1 XP per 100 THB
  spend_unit numeric DEFAULT 100,
  xp_cap integer,
  coin_per_spend_unit numeric DEFAULT 0,
  coin_spend_unit numeric DEFAULT 100,
  coin_cap integer,
  required_level integer DEFAULT 0,
  required_badge_id uuid REFERENCES gamification_badges(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

**Migration 4: RLS policies for new tables**
```sql
-- Quest templates: staff read, managers manage
ALTER TABLE quest_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can read quest_templates" ON quest_templates FOR SELECT USING (has_min_access_level(auth.uid(), 'level_1_minimum'));
CREATE POLICY "Managers can manage quest_templates" ON quest_templates FOR ALL USING (has_min_access_level(auth.uid(), 'level_3_manager'));

-- Quest instances: members read own, staff read all
ALTER TABLE quest_instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read own quests" ON quest_instances FOR SELECT USING (member_id = get_my_member_id(auth.uid()));
CREATE POLICY "Staff read all quests" ON quest_instances FOR SELECT USING (has_min_access_level(auth.uid(), 'level_1_minimum'));

-- Coupon templates: staff read, managers manage
ALTER TABLE coupon_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can read coupon_templates" ON coupon_templates FOR SELECT USING (has_min_access_level(auth.uid(), 'level_1_minimum'));
CREATE POLICY "Managers can manage coupon_templates" ON coupon_templates FOR ALL USING (has_min_access_level(auth.uid(), 'level_3_manager'));

-- Coupon wallet: members read own, staff manage
ALTER TABLE coupon_wallet ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read own coupons" ON coupon_wallet FOR SELECT USING (member_id = get_my_member_id(auth.uid()));
CREATE POLICY "Staff manage coupons" ON coupon_wallet FOR ALL USING (has_min_access_level(auth.uid(), 'level_2_operator'));

-- Shop reward rules: staff read, managers manage
ALTER TABLE shop_reward_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can read shop_reward_rules" ON shop_reward_rules FOR SELECT USING (has_min_access_level(auth.uid(), 'level_1_minimum'));
CREATE POLICY "Managers can manage shop_reward_rules" ON shop_reward_rules FOR ALL USING (has_min_access_level(auth.uid(), 'level_3_manager'));
```

### Phase 2: Seed Data (All the exact values from the spec)

Insert via data operations (not migrations):

1. **`gamification_rules`** — Update/insert all 15+ action rules with exact XP/coin values from the spec (check_in=8XP/1coin, open_gym=18XP/3coin, class_attend=25XP/4coin, etc.)

2. **`gamification_levels`** — Insert 20 levels with exact XP thresholds and perk codes from the spec

3. **`quest_templates`** — Insert ~9 daily quests, ~9 weekly quests, ~7 monthly/seasonal challenges with exact rewards

4. **`gamification_badges`** — Insert ~20 badges with types (permanent/boost/access), effects, and duration

5. **`coupon_templates`** — Insert coupon types (merch 50/100/150, package 150/300, etc.)

6. **`gamification_rewards`** — Insert full reward catalog (~25 items across digital, perks, coupons, limited/premium categories with exact coin prices)

7. **`shop_reward_rules`** — Insert rules for merch (1coin/100THB, cap 25) and package (1coin/150THB, cap 30)

### Phase 3: Backend Logic (Edge Functions)

1. **`gamification-assign-daily-quests`** — New edge function called daily (or on member login) that picks 3 random daily quests from `quest_templates` and creates `quest_instances` for each active member

2. **`gamification-assign-weekly-quests`** — Same but weekly, picks 4 quests

3. **Update `gamification-process-event`** — Add quest progress tracking: when an event fires (check_in, class_attend, etc.), check all active `quest_instances` for that member and increment `progress_value` if `goal_action_key` matches

4. **`gamification-claim-quest`** — New edge function: validates quest completion, awards XP/coin/badge/coupon, marks as claimed

5. **Update `gamification-redeem-reward`** — Support hybrid coin+cash rewards, badge-gated rewards, daily/monthly limits, coupon issuance on redemption

6. **`gamification-issue-coupon`** — New edge function: creates `coupon_wallet` entry from a template, validates level requirements

### Phase 4: Member UI Updates

1. **Rename "RP" → "Coin"** throughout the UI (MomentumPage, RewardDropCard, etc.)

2. **Quest Hub** — Replace current "Quests" tab content with daily/weekly/monthly sections showing `quest_instances` with progress bars, timers, and claim buttons

3. **Coupon Wallet** — New `/member/coupons` page showing active/used/expired coupons

4. **Enhanced Badge Gallery** — Show badge types (permanent/boost/access) with effect descriptions and expiry timers for boost badges

5. **Level Perks Card** — Show what the member has unlocked and what's coming next

6. **Reward Store Enhancement** — Show hybrid coin+cash prices, badge-gated items, level-gated items with lock indicators

### Phase 5: Admin UI Updates

1. **Quest Template Manager** — New tab in Gamification Studio for CRUD on quest templates

2. **Coupon Template Manager** — New tab for creating/managing coupon templates

3. **Shop Rules Manager** — New tab for configuring shop earn rules

4. **Badge Editor Enhancement** — Add badge_type, effect_type, duration_days fields

5. **Reward Editor Enhancement** — Add cash_price, required_badge, daily/monthly limit fields

### Phase 6: Trainer System

1. **Trainer Quest Templates** — Add trainer-specific quests in quest_templates with `audience_type = 'trainer_inhouse'` or `'trainer_freelance'`

2. **Enhance `trainer_gamification_scores`** — Add coin tracking alongside score

3. **Trainer Rewards** — Separate reward catalog items for trainers

---

## Files to Create/Modify

### New Files
- `supabase/functions/gamification-assign-quests/index.ts`
- `supabase/functions/gamification-claim-quest/index.ts`
- `supabase/functions/gamification-issue-coupon/index.ts`
- `src/apps/member/pages/MemberCouponsPage.tsx`
- `src/apps/member/features/momentum/QuestHub.tsx`
- `src/apps/member/features/momentum/CouponCard.tsx`
- `src/apps/member/features/momentum/LevelPerksCard.tsx`
- `src/pages/gamification/GamificationQuests.tsx`
- `src/pages/gamification/GamificationCoupons.tsx`
- `src/pages/gamification/GamificationShopRules.tsx`
- `src/hooks/useGamificationQuests.ts`
- `src/hooks/useGamificationCoupons.ts`
- `src/hooks/useGamificationShopRules.ts`

### Modified Files
- `src/apps/member/features/momentum/api.ts` — Add quest/coupon fetchers
- `src/apps/member/features/momentum/types.ts` — Add quest/coupon types
- `src/apps/member/pages/MemberMomentumPage.tsx` — Rewrite Quests tab, rename RP→Coin
- `src/apps/member/pages/MemberRewardsPage.tsx` — Enhanced reward store
- `src/apps/member/pages/MemberBadgeGalleryPage.tsx` — Badge types/effects
- `src/pages/gamification/GamificationStudio.tsx` — Add Quests/Coupons/Shop tabs
- `src/components/gamification/CreateBadgeDialog.tsx` — Badge type/effect fields
- `src/components/gamification/CreateRewardDialog.tsx` — Hybrid pricing fields
- `supabase/functions/gamification-process-event/index.ts` — Quest progress tracking
- `supabase/functions/gamification-redeem-reward/index.ts` — Hybrid + coupon issuance
- `src/App.tsx` — Add new routes (/member/coupons, gamification tabs)

## Risk Assessment
- **DB migrations are additive** — no existing columns removed, no data lost
- **Existing flows preserved** — current challenges/badges/rewards continue working
- **RP→Coin is a UI rename only** — `available_points` column stays the same in DB
- **New edge functions are independent** — no changes to existing function signatures

## Recommended Build Order
1. DB schema migrations (4 migrations)
2. Seed data (rules, levels, quests, badges, rewards, coupons)
3. Edge functions (assign-quests, claim-quest, update process-event)
4. Member UI (quest hub, coupon wallet, enhanced rewards)
5. Admin UI (quest/coupon/shop-rules management)
6. Trainer system (last, as spec says Phase 2)

This is a large multi-message implementation. Shall I start with the database schema and seed data first?

