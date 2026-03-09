# Gamification Event Map — v1

> **Status:** LOCKED — matches `gamification_rules` table and Edge Function logic  
> **Last verified:** 2026-03-09

---

## Section 1 — Member Events

### Core Activity Events

| # | Event Name | action_key | Who Triggers | When Valid | XP | Coin | Cooldown | Daily Cap | Rollback? |
|---|-----------|-----------|-------------|-----------|-----|------|----------|-----------|-----------|
| 1 | Check-in | `check_in` | Member (via lobby) | Lobby confirms check-in | 8 | 1 | 720 min | 1 | No |
| 2 | Open Gym Session | `open_gym_45min` | System (duration tracked) | ≥45 min gym time | 18 | 3 | 720 min | 1 | No |
| 3 | Class Attendance | `class_attend` | Staff marks attended | Booking status → attended | 25 | 4 | 60 min | 5 | No |
| 4 | PT Session | `pt_session` | Staff marks complete | PT booking completed | 40 | 6 | 60 min | 3 | No |

### Commerce Events

| # | Event Name | action_key | Who Triggers | When Valid | XP | Coin | Cooldown | Daily Cap | Rollback? |
|---|-----------|-----------|-------------|-----------|-----|------|----------|-----------|-----------|
| 5 | Package Purchase | `package_purchase` | approve-slip / stripe-webhook | Payment confirmed | 20 | per guardrail* | — | 3 | Yes (refund) |
| 6 | Shop Purchase | `shop_purchase` | Order payment confirmed | Order status = paid | 10 base | per shop_reward_rules* | — | 5 | Yes (refund) |

*Package coin: 1 coin per 150 THB, cap 30 (`PACKAGE_COIN_PER_150_THB`, `PACKAGE_COIN_CAP_PER_ORDER`)  
*Shop coin: 1 coin per 100 THB, cap 25 (`SHOP_COIN_PER_100_THB`, `SHOP_COIN_CAP_PER_ORDER`)

### Social & Engagement Events

| # | Event Name | action_key | Who Triggers | When Valid | XP | Coin | Cooldown | Daily Cap | Rollback? |
|---|-----------|-----------|-------------|-----------|-----|------|----------|-----------|-----------|
| 7 | Referral Trial | `referral_trial` | System on friend visit | Friend completes trial | 30 | 15 | — | 5 | No |
| 8 | Referral Purchase | `referral_purchase` | System on friend buy | Friend buys package | 100 | 80 | — | 5 | Yes (refund) |
| 9 | Monthly Review | `review_monthly` | Member submits review | Once per month | 20 | 5 | — | 1 | No |

### Streak Events (Auto-triggered)

| # | Event Name | action_key | Who Triggers | When Valid | XP | Coin | Daily Cap |
|---|-----------|-----------|-------------|-----------|-----|------|-----------|
| 10 | 7-Day Streak | `streak_7day` | System auto | 7 consecutive days | 30 | 10 | 1 |
| 11 | 30-Day Streak | `streak_30day` | System auto | 30 consecutive days | 100 | 30 | 1 |

### Quest Completion Events

| # | Event Name | action_key | Who Triggers | When Valid | XP | Coin | Daily Cap |
|---|-----------|-----------|-------------|-----------|-----|------|-----------|
| 12 | Daily Quest Done | `daily_quest_done` | System on goal met | Quest goal_value reached | 12 | 2 | 3 |
| 13 | Weekly Quest Done | `weekly_quest_done` | System on goal met | Quest goal_value reached | 45 | 8 | 4 |
| 14 | Monthly Challenge | `monthly_challenge` | System on goal met | Quest goal_value reached | 180 | 25 | 4 |
| 15 | Seasonal Challenge | `seasonal_challenge` | System on goal met | Quest goal_value reached | 380 | 80 | 2 |

---

## Section 2 — Trainer Events

### In-House Coach Events

| # | Event Name | action_key | Score | Coin | XP | Daily Cap |
|---|-----------|-----------|-------|------|----|-----------|
| 1 | Attendance On Time | `trainer_attendance_ontime` | 8 | 1 | 8 | 10 |
| 2 | PT Log Complete | `trainer_pt_log_complete` | 12 | 2 | 12 | 10 |
| 3 | Member Streak Success | `trainer_member_streak_success` | 20 | 4 | 20 | 5 |
| 4 | Squad Challenge Success | `trainer_squad_challenge_success` | 50 | 10 | 50 | 1 |
| 5 | Renewal Influence | `trainer_renewal_influence` | 25 | 5 | 25 | 3 |

### Freelance Partner Events

| # | Event Name | action_key | Score | Coin | XP | Daily Cap |
|---|-----------|-----------|-------|------|----|-----------|
| 6 | Session On Time | `partner_session_ontime` | 6 | 2 | 6 | 10 |
| 7 | Session Complete | `partner_session_complete` | 10 | 2 | 10 | 10 |
| 8 | Repeat Booking | `partner_repeat_booking` | 20 | 4 | 20 | 5 |
| 9 | Clean Month | `partner_clean_month` | 40 | 8 | 40 | 1 |

---

## Section 3 — Quest Progress Mapping

Which events update which quest `goal_type`:

| Event (action_key) | Quest goal_types Updated |
|--------------------|------------------------|
| `check_in` | `checkin_count`, `visit_days_per_week`, `monthly_checkin_count`, `offpeak_checkin_count` (if off-peak) |
| `class_attend` | `class_attend_count`, `distinct_class_types_weekly`, `new_class_type_attend_count`, `monthly_class_mix_goal` |
| `open_gym_45min` | `open_gym_minutes` |
| `pt_session` | `monthly_pt_count`, `pt_plus_class_combo` |
| `package_purchase` | `early_package_renewal_count` (if renewed before expiry) |
| `shop_purchase` | `shop_order_count`, `shop_order_count_weekly`, `monthly_distinct_shop_categories` |
| `referral_trial` | `successful_trial_referral_count` |
| Booking next day | `next_day_booking_count` |
| Recovery task | `recovery_task_count` |

---

## Section 4 — Badge Progress Mapping

Which events can trigger badge unlocks:

| Badge | Trigger Events | Condition |
|-------|---------------|-----------|
| First Step | `check_in` | 1st ever check-in |
| First Class | `class_attend` | 1st ever class attendance |
| Open Gym Soul | `open_gym_45min` | 10 cumulative open gym sessions |
| Explorer | `class_attend` | 4 distinct class types attended |
| 25 Visits | `check_in` | 25 cumulative check-ins |
| 50 Visits | `check_in` | 50 cumulative check-ins |
| 100 Visits | `check_in` | 100 cumulative check-ins |
| 4-Week Flow | `check_in` | 4 consecutive weeks with ≥2 visits |
| Comeback Strong | `check_in` | 3 visits within 10 days after 30+ day absence |
| Referral Spark | `referral_trial` | 1 successful referral |
| Referral Hero | `referral_purchase` | 5 successful referral purchases |
| Shop Scout | `shop_purchase` | 1st ever shop order |
| Shop Supporter | `shop_purchase` | 3 cumulative shop orders |
| Package Keeper | `package_purchase` | 2 consecutive early renewals |
| Off-Peak Hero | `check_in` (off-peak) | 6 off-peak visits in a month |
| Squad Up | squad_join | 1st squad join |
| Squad Captain | seasonal_challenge | Lead team to finish seasonal challenge |
| Community Heart | community_event | 3 community events attended |
| Elite Finisher | seasonal_challenge | Complete major seasonal challenge |

---

## Section 5 — Rollback Events

| Trigger | Rollback Action | Source Guardrail |
|---------|----------------|-----------------|
| Package refund | Rollback XP from `package_purchase` + rollback coin per `PACKAGE_COIN_PER_150_THB` | `REFUND_XP_ROLLBACK=conditional`, `REFUND_COIN_ROLLBACK=true` |
| Shop refund | Rollback XP from `shop_purchase` + rollback coin per shop rule | `REFUND_XP_ROLLBACK=conditional`, `REFUND_COIN_ROLLBACK=true` |
| Booking cancel (no attendance) | Rollback XP if attendance reward was given | `BOOKING_CANCEL_XP_ROLLBACK=true` |
| Reward void (admin) | Restore spent coin, decrement `redeemed_count`, set status `rolled_back` | Edge Function `gamification-redeem-reward?action=void` |

### Rollback Implementation

All rollbacks create negative-delta entries in `xp_ledger` / `points_ledger` with `event_type = 'rollback'` and reference the original `idempotency_key`.

---

## Section 6 — Anti-Abuse Rules

### From `gamification_rules` (server-enforced)

| Rule | Mechanism |
|------|-----------|
| Cooldown | `cooldown_minutes` per action_key per member — reject if last grant < cooldown |
| Daily cap | `max_per_day` per action_key per member per calendar day |
| Idempotency | Unique `idempotency_key` in `xp_ledger` — duplicate events silently skipped |

### From `economy_guardrails` (server-enforced)

| Rule | Value | Mechanism |
|------|-------|-----------|
| Max check-in reward/day | 1 | Enforced via `max_per_day` on `check_in` rule |
| Max open gym reward/day | 1 | Enforced via `max_per_day` on `open_gym_45min` rule |
| Min open gym minutes | 45 | Validated before granting reward |
| Max review reward/month | 1 | Calendar month check |
| Max reward redemptions/day | 3 | Checked in `gamification-redeem-reward` Edge Function |
| Max quest reroll/day | 1 | Checked in quest reroll logic |
| Shop/package coin caps | 25/30 | Capped per order in Edge Function |

### Flagging

Violations are logged to `gamification_audit_log` with `flagged = true` and `flag_reason` describing the violation type.

---

## Section 7 — Event-to-Reward Complete Mapping Table

| action_key | XP | Coin | Quest Progress | Badge Progress | Rollback | Cooldown | Cap |
|-----------|-----|------|---------------|----------------|----------|----------|-----|
| `check_in` | 8 | 1 | checkin_count, visit_days_per_week, monthly_checkin_count | FIRST_STEP, VISIT_25/50/100, OFFPEAK_HERO | No | 720min | 1/day |
| `open_gym_45min` | 18 | 3 | open_gym_minutes | OPEN_GYM_SOUL | No | 720min | 1/day |
| `class_attend` | 25 | 4 | class_attend_count, distinct_class_types_weekly | FIRST_CLASS, EXPLORER | No | 60min | 5/day |
| `pt_session` | 40 | 6 | monthly_pt_count, pt_plus_class_combo | — | No | 60min | 3/day |
| `package_purchase` | 20 | per rule | early_package_renewal_count | PACKAGE_KEEPER | Yes | — | 3/day |
| `shop_purchase` | 10+ | per rule | shop_order_count | SHOP_SCOUT, SHOP_SUPPORTER | Yes | — | 5/day |
| `referral_trial` | 30 | 15 | successful_trial_referral_count | REFERRAL_SPARK | No | — | 5/day |
| `referral_purchase` | 100 | 80 | — | REFERRAL_HERO | Yes | — | 5/day |
| `review_monthly` | 20 | 5 | — | — | No | — | 1/day |
| `streak_7day` | 30 | 10 | — | FLOW_4W | No | — | 1/day |
| `streak_30day` | 100 | 30 | — | FLOW_4W | No | — | 1/day |
| `daily_quest_done` | 12 | 2 | — | — | No | — | 3/day |
| `weekly_quest_done` | 45 | 8 | — | — | No | — | 4/day |
| `monthly_challenge` | 180 | 25 | — | — | No | — | 4/day |
| `seasonal_challenge` | 380 | 80 | — | ELITE_FINISHER | No | — | 2/day |

---

## Section 8 — Integration Points (Current Codebase)

| Producer | File | Event | Integration |
|----------|------|-------|------------|
| Check-in | `src/hooks/useLobby.ts` | `check_in` | `onSuccess` callback, fire-and-forget |
| Class Attendance | `src/hooks/useClassBookings.ts` | `class_attend` | `onSuccess` callback, fire-and-forget |
| Slip Approval | `supabase/functions/approve-slip/index.ts` | `package_purchased` | Edge Function → Edge Function call |
| Stripe Payment | `supabase/functions/stripe-webhook/index.ts` | `package_purchased` | Edge Function → Edge Function call |
| Event Processor | `supabase/functions/gamification-process-event/index.ts` | All events | Central processor: XP, coin, streaks, badges, challenges |
| Reward Redeem | `supabase/functions/gamification-redeem-reward/index.ts` | Redemption + void | Point debit, stock management, audit |

---

*This document maps every business event to its gamification effects. Changes here must be reflected in the Edge Function logic and `gamification_rules` table.*
