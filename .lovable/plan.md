

# Economy v2 — Prestige Logic + Level Benefits Seed Data

## Verification Results

All Economy v2 values are **correctly stored** in the database:
- **gamification_levels**: All 20 levels have correct XP thresholds (0 → 12,600), correct names, and perks JSONB including prestige criteria for levels 18–20
- **gamification_rules**: All 15 member actions + 9 trainer actions have correct v2 XP/Coin values
- **economy_guardrails**: All 25 rules present with correct v2 formulas
- **gamification_rewards**: All 20 rewards with correct v2 coin pricing

No `level_benefits` or `reward_catalog` tables exist yet — these need to be created.

---

## Changes

### 1. Database Migration — Create `level_benefits` table

New table to store the structured benefit ladder per level:

```text
level_benefits
├── id (uuid PK)
├── level_number (int, unique per benefit)
├── benefit_code (text) — e.g. "free_water_1x", "perk_wallet_standard"
├── benefit_type (text) — "pride", "convenience", "low_cost_perk", "savings"
├── frequency (text) — "one_time", "monthly", "ongoing"
├── description_en (text)
├── description_th (text)
├── business_cost (text) — "zero", "low", "medium", "high"
├── is_active (boolean)
├── created_at, updated_at
```

Seed all 20 levels with ~35 benefit rows from the Economy v2 spec.

### 2. Database Migration — Create `prestige_criteria` table

Stores the extra qualification rules for levels 18–20:

```text
prestige_criteria
├── id (uuid PK)
├── level_number (int) — 18, 19, or 20
├── criterion_code (text) — e.g. "min_visits", "monthly_quests_4of6"
├── criterion_type (text) — "numeric", "boolean", "count_of_n"
├── target_value (int)
├── description_en (text)
├── description_th (text)
├── is_active (boolean)
```

Seed with criteria from the spec:
- Level 18: XP ≥ 9400, visits ≥ 60, monthly quests 4/6, good standing
- Level 19: XP ≥ 10900, visits ≥ 100, seasonal badge OR referral OR 6mo continuous
- Level 20: XP ≥ 12600, visits ≥ 140, tenure ≥ 12mo, 2-of-4 achievement badges, hybrid review

### 3. Database Function — `check_prestige_eligibility(p_member_id uuid, p_target_level int)`

A `SECURITY DEFINER` function that checks whether a member qualifies for levels 18–20 by querying:
- `member_gamification_profiles` for XP
- `class_bookings` (status = 'attended') for confirmed visit count
- `challenge_progress` (completed monthly challenges in last 6 months)
- `badge_earnings` for seasonal/achievement badges
- `member_referrals` for referral conversions
- `members.created_at` for active tenure

Returns a JSON object: `{ eligible: boolean, criteria: [{ code, met, current, target }] }`

### 4. Edge Function Update — `gamification-process-event`

Modify `checkLevelUp()` to enforce prestige criteria for levels 18–20:
- For levels 1–17: keep current XP-only logic
- For levels 18–20: after XP check passes, call `check_prestige_eligibility` RPC
- Only grant level-up if both XP AND prestige criteria are met

### 5. Frontend — Show prestige criteria on `LevelPerksCard`

Update `LevelPerksCard.tsx` to fetch `prestige_criteria` for levels 18–20 and display requirement progress (visits, quests, badges) with check/lock icons.

### 6. Frontend — `LevelRequirementsCard` update

Update to use real prestige criteria data instead of derived placeholder targets.

---

## Implementation Order

1. DB migration: create `level_benefits` + `prestige_criteria` tables
2. Seed data: insert all benefit rows + prestige criteria rows
3. DB function: `check_prestige_eligibility`
4. Edge function: update `checkLevelUp` to enforce prestige
5. Frontend: update `LevelPerksCard` and `LevelRequirementsCard`

