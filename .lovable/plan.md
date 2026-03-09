

# Seed Production Data v1 — Full Economy

## Current State vs Spec

| Table | Exists | Current Rows | Spec Rows | Action |
|-------|--------|-------------|-----------|--------|
| `gamification_levels` | Yes | 20 | 20 | UPDATE — xp/perks differ (e.g. lv5: 560→660, lv6: 690→920, lv20 name) |
| `coupon_templates` | Yes | 9 | 8 | DELETE all + INSERT new (names/values changed) |
| `gamification_badges` | Yes | 20 | 19 | DELETE all + INSERT new (effect_value format changed, "Momentum Legend" removed) |
| `gamification_rewards` | Yes | 31 | 19 | DELETE all + INSERT new (complete restructure with daily/monthly limits) |
| `quest_templates` | Yes | 33 | 22 member + trainer | DELETE all + INSERT new (names/desc changed) |
| `gamification_trainer_tiers` | Yes | 0 | 10 | INSERT |
| `shop_reward_rules` | Yes | 2 | 4 | DELETE all + INSERT new |
| `economy_guardrails` | **No** | — | 14 | CREATE table + INSERT |
| `trainer_action_rewards` | **No** | — | 11 | CREATE table + INSERT |

## Plan

### Step 1 — Create 2 new tables (migration)

**`economy_guardrails`**: `id uuid PK`, `rule_code text UNIQUE NOT NULL`, `rule_value text NOT NULL`, `description text`, `is_active boolean DEFAULT true`, `created_at timestamptz DEFAULT now()`

**`trainer_action_rewards`**: `id uuid PK`, `action_code text NOT NULL`, `trainer_type text NOT NULL DEFAULT 'inhouse'`, `score_delta integer DEFAULT 0`, `coin_delta integer DEFAULT 0`, `xp_delta integer DEFAULT 0`, `is_active boolean DEFAULT true`, `created_at timestamptz DEFAULT now()`, UNIQUE(`action_code`, `trainer_type`)

RLS: Staff level_1+ SELECT, Manager level_3+ ALL.

### Step 2 — Clear existing data that will be replaced

Delete in correct order (FK-safe):
1. `reward_redemptions` (refs rewards)
2. `gamification_rewards`
3. `coupon_wallet` (refs coupon_templates)
4. `coupon_templates`
5. `badge_earnings` (refs badges)
6. `gamification_badges`
7. `quest_instances` (refs quest_templates)
8. `quest_templates`
9. `shop_reward_rules`

Then UPDATE `gamification_levels` in place.

### Step 3 — Insert all seed data

Insert into each table matching the exact column schema discovered above:
- 20 levels (UPDATE perks jsonb with `perk_code` + `perk_description`)
- 8 coupon templates
- 19 badges (effect_value as jsonb like `{"effect": "profile_stamp_first_step"}`)
- 19 rewards (with daily_limit, monthly_limit, reward_type, required_badge_id linked by name lookup)
- 22 quest templates (badge_reward_id and coupon_reward_template_id linked by name lookup)
- 10 trainer tiers (5 inhouse + 5 freelance)
- 4 shop reward rules
- 14 economy guardrails
- 11 trainer action rewards

### Step 4 — Cross-reference FK links

Rewards referencing badges (e.g. `SHOP_SUPPORTER`, `SQUAD_CAPTAIN`, `COMMUNITY_HEART`) need the actual UUID from the newly inserted badges. Same for quest templates referencing badge_reward_id and coupon_reward_template_id.

Strategy: Insert badges and coupons first, then query their UUIDs, then insert rewards and quests with correct FK references.

### No code changes needed

All existing UI already reads from these tables generically. The seed data change is purely database-level.

