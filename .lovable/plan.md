

# Economy v2 — Full Redesign Implementation Plan

This is a large-scale update covering database seed data, frontend XP thresholds, documentation, and Edge Function logic. The changes align the gamification economy with real business pricing (900–12,000 THB packages) and make levels 18–20 prestige tiers.

---

## What Changes

### 1. Documentation Update
**`docs/ECONOMY_V1.md`** → rename content to **ECONOMY_V2** with all new values:
- New XP values for all 15 member action_keys
- New level curve (0 → 12,600 XP across 20 levels)
- New benefit ladder per level
- New reward coin pricing
- New package/shop XP+Coin formulas
- Level 18–20 prestige criteria documented
- New quest XP/coin values
- New economy guardrails

### 2. Database Migration — Update `gamification_levels` rows
Update all 20 levels with new XP thresholds, names, and perks:

| Lv | Name | XP Required |
|----|------|-------------|
| 1 | Starter I | 0 |
| 2 | Starter II | 100 |
| 3 | Starter III | 240 |
| 4 | Mover I | 420 |
| 5 | Mover II | 650 |
| 6 | Mover III | 930 |
| 7 | Strong I | 1,260 |
| 8 | Strong II | 1,650 |
| 9 | Strong III | 2,100 |
| 10 | Strong IV | 2,620 |
| 11 | Elite I | 3,210 |
| 12 | Elite II | 3,870 |
| 13 | Elite III | 4,600 |
| 14 | Elite IV | 5,400 |
| 15 | Legend I | 6,280 |
| 16 | Legend II | 7,240 |
| 17 | Legend III | 8,280 |
| 18 | Apex Access | 9,400 |
| 19 | Inner Circle | 10,900 |
| 20 | Legend Circle | 12,600 |

Each level gets updated `perks` JSONB with the benefit ladder from the spec.

### 3. Database Migration — Update `gamification_rules` XP/Coin values
Update member action rules to v2 values:

| action_key | XP (was → now) | Coin |
|-----------|----------------|------|
| check_in | 8→6 | 1 |
| open_gym_45min | 18→16 | 3 |
| class_attend | 25→22 | 4 |
| pt_session | 40→34 | 6 |
| daily_quest_done | 12→13 | 2 |
| weekly_quest_done | 45→45 | 8 |
| monthly_challenge | 180→180 | 25 |
| seasonal_challenge | 380→350 | 80 |
| review_monthly | 20→15 | 5 |
| referral_trial | 30→25 | 15 |
| referral_purchase | 100→80 | 80 |
| package_purchase | 20→formula | 0* |
| shop_purchase | 10→formula | 0* |
| streak_7day | 30→30 | 10 |
| streak_30day | 100→100 | 30 |

### 4. Database Migration — Update `economy_guardrails`
Update package/shop coin formulas:

| Rule | Old → New |
|------|-----------|
| PACKAGE_COIN_PER_150_THB → PACKAGE_COIN_PER_180_THB | 1 coin per 180 THB |
| PACKAGE_COIN_CAP_PER_ORDER | 30→100 (to allow annual packages) |
| SHOP_COIN_PER_100_THB → SHOP_COIN_PER_120_THB | 1 coin per 120 THB |
| SHOP_COIN_CAP_PER_ORDER | 25→18 |
| SHOP_XP_BASE_PER_ORDER | 10→6 |
| New: PACKAGE_XP_PER_300_THB | 1 XP per 300 THB |
| New: PACKAGE_XP_TERM_BONUS_* | 8/18/35/55 per term |

### 5. Database Migration — Update `gamification_rewards` coin pricing

| Reward | Old Coin → New Coin |
|--------|---------------------|
| น้ำดื่มฟรี | 35→40 |
| Towel Rental | 45→60 |
| Locker Upgrade | 60→70 |
| Body Scan | 70→110 |
| Merch 50 coupon | 90→140 |
| Guest Pass | 95→260 |
| Merch 100 coupon | 170→260 |
| PKG 150 coupon | 260→380 |
| PKG 300 coupon | 500→620 |
| Early Drop Access | 120→120 |
| Event Priority | 150→150 |
| Special Shaker | 80→120 (+199 THB) |
| Special Tee | 160→220 (+490 THB) |
| Selected Class Pass (new) | —→220 |

### 6. Frontend — Update XP Thresholds in `types.ts`
Update the hardcoded `XP_THRESHOLDS` array to match the new curve.

### 7. Edge Function — Update package/shop XP formula
In `gamification-process-event`, update the package_purchase and shop_purchase handlers to use the new formulas:
- Package XP: `floor(net_paid / 300) + term_bonus`
- Package Coin: `floor(net_paid / 180) + term_bonus_coin`
- Shop XP: `6 + floor(net_paid / 180)`, cap 16
- Shop Coin: `floor(net_paid / 120)`, cap 18

### 8. Update `gamification-event-map.md`
Reflect all new XP/coin values in the event map doc.

---

## Technical Approach

### Database: 4 migration statements
1. UPDATE `gamification_levels` — 20 rows with new xp_required + perks
2. UPDATE `gamification_rules` — 15 member rules with new XP values
3. UPSERT `economy_guardrails` — new formula rules
4. UPDATE `gamification_rewards` — new coin prices

### Frontend: 1 file change
- `src/apps/member/features/momentum/types.ts` — new XP_THRESHOLDS array

### Edge Function: 1 file update
- `supabase/functions/gamification-process-event/index.ts` — new package/shop formulas

### Documentation: 2 file updates
- `docs/ECONOMY_V1.md` → updated to v2
- `docs/gamification-event-map.md` → updated values

---

## Implementation Order

1. Database migrations (levels, rules, guardrails, rewards)
2. Frontend XP thresholds
3. Edge Function formulas
4. Documentation updates

