

# MOOM Momentum Club — Final Recheck & Remaining Work

## Verification: What's Complete

| Area | Status |
|------|--------|
| DB: 5 new tables + badge/reward column enhancements | Done |
| Seed: 15 rules, 20 levels, 25 quests, 20 badges, 21 rewards, 9 coupons, 2 shop rules | Done |
| Edge Functions: assign-quests, claim-quest, issue-coupon, process-event | Done |
| Member: QuestHub wired in MomentumPage | Done |
| Member: MemberCouponsPage + route + bottom nav | Done |
| Member: RewardDropCard hybrid pricing (coin + cash) | Done |
| Member: Badge Gallery (type labels, effects, expiry) | Done |
| Member: LevelPerksCard (unlocked/upcoming) | Done |
| Member: "RP" renamed to "Coin" throughout | Done |
| Admin: Quests/Coupons/ShopRules tabs in Studio | Done |
| Admin: CreateBadgeDialog (badge_type, effect_type, duration) | Done |
| Admin: CreateRewardDialog (reward_type, cash_price) | Done |
| Member Home: MomentumCard widget | Done |

## Remaining Gap: Trainer System (Spec Section 10 & 11)

The spec calls for separate gamification for In-house Trainers (Coach XP + Coach Coin) and Freelance Trainers (Partner Score + Partner Coin). Currently:

- `CoachImpactCard` and `PartnerReputationCard` display score/metrics from `trainer_gamification_scores` but have **no coin balance, no quests, no rewards**.
- The trainer types don't show Coach XP/Coin or Partner Score/Coin values from the spec.
- No trainer quest system exists.
- No trainer reward catalog exists.

### What needs to happen

**1. Add `coin_balance` column to `trainer_gamification_scores`**
The existing table has `score` but no coin tracking. Add `coin_balance integer DEFAULT 0` via migration.

**2. Seed trainer gamification rules**
Insert rules into `gamification_rules` for trainer actions:
- In-house: `trainer_attendance_ontime` (8 XP / 1 coin), `trainer_pt_log_complete` (12 XP / 2 coin), `trainer_member_streak_success` (20 XP / 4 coin), `trainer_squad_challenge_success` (50 XP / 10 coin), `trainer_renewal_influence` (25 XP / 5 coin)
- Freelance: `partner_session_ontime` (6 score / 2 coin), `partner_session_complete` (10 score / 2 coin), `partner_repeat_booking` (20 score / 4 coin), `partner_clean_month` (40 score / 8 coin)

**3. Seed trainer quest templates**
Insert into `quest_templates` with `audience_type = 'trainer_inhouse'` and `'trainer_freelance'`.

**4. Enhance CoachImpactCard UI**
Add Coach Coin balance display and a mini quest section showing trainer quests.

**5. Enhance PartnerReputationCard UI**
Add Partner Coin balance and partner quest section.

**6. Create trainer reward catalog entries**
Seed trainer-specific rewards into `gamification_rewards` (featured coach, premium uniform credit, verified partner badge, profile boost, etc.)

---

## Implementation Plan

### Step 1: DB Migration
Add `coin_balance` column to `trainer_gamification_scores`.

### Step 2: Seed Trainer Data
- 9 trainer gamification rules (5 in-house + 4 freelance)
- 8 trainer quest templates (4 in-house + 4 freelance)
- 10 trainer rewards (5 in-house + 5 freelance)

### Step 3: Enhance CoachImpactCard
- Show `coin_balance` from `trainer_gamification_scores`
- Add "Coach Coin" display next to impact score
- Add mini quest preview for trainer quests

### Step 4: Enhance PartnerReputationCard
- Show `coin_balance`
- Add "Partner Coin" display
- Add mini quest preview

### Step 5: Update trainer impact API
- `fetchCoachImpactProfile` — include `coin_balance` in return
- `fetchPartnerReputationProfile` — include `coin_balance`
- Add `fetchTrainerQuests(staffId)` function

## Files

| File | Change |
|------|--------|
| Migration | Add `coin_balance` to `trainer_gamification_scores` |
| Seed data | Trainer rules, quests, rewards |
| `src/apps/trainer/features/impact/types.ts` | Add `coin_balance` to both profile types |
| `src/apps/trainer/features/impact/api.ts` | Map `coin_balance`, add `fetchTrainerQuests` |
| `src/apps/trainer/features/impact/CoachImpactCard.tsx` | Coin display + quest preview |
| `src/apps/trainer/features/impact/PartnerReputationCard.tsx` | Coin display + quest preview |

## Risk
- Migration is additive (new column with default)
- Seed data is additive (new rows)
- UI changes are enhancements to existing cards
- Zero regression to member flows

