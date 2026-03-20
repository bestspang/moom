# Gamification Event Map — v2

> **Status:** ACTIVE — matches `gamification_rules` table and Edge Function logic  
> **Last updated:** 2026-03-20  
> **Economy version:** v2
>
> ⚠️ **AI SAFETY NOTE — DO NOT CHANGE THESE KEYS:**  
> - Class attendance key = `class_attend` (NOT `class_attended`)  
> - Package purchase key = `package_purchase` (NOT `package_purchased`)  
> - These match `gamification_rules.action_key` and `status_tier_sp_rules.action_key` in the DB.  
> - Changing them will silently break the SP pipeline. Verified 2026-03-20.

---

## Section 1 — Member Events

### Core Activity Events

| # | Event Name | action_key | Who Triggers | XP | Coin | SP | Cooldown | Daily Cap |
|---|-----------|-----------|-------------|-----|------|-----|----------|-----------|
| 1 | Check-in | `check_in` | Member (via lobby) | 6 | 1 | — | 720 min | 1 |
| 2 | Open Gym Session | `open_gym_45min` | System (≥45 min) | 16 | 3 | 1 | 720 min | 1 |
| 3 | Class Attendance | `class_attended` | Staff marks attended | 22 | 4 | 2 | 60 min | 5 |
| 4 | PT Session | `pt_session` | Staff marks complete | 34 | 6 | 3 | 60 min | 3 |

### Commerce Events

| # | Event Name | action_key | XP | Coin | SP | Daily Cap | Required Metadata |
|---|-----------|-----------|-----|------|-----|-----------|-------------------|
| 5 | Package Purchase | `package_purchased` | formula | formula | 8/20/35/55 by term | 3 | `net_paid`, `term_months` |
| 6 | Shop Purchase | `shop_purchase` | formula | formula | floor(net_paid/400) cap 5 | 5 | `net_paid` |

### Social & Engagement Events

| # | Event Name | action_key | XP | Coin | SP | Daily Cap |
|---|-----------|-----------|-----|------|-----|-----------|
| 7 | Referral Trial | `referral_trial` | 25 | 15 | — | 5 |
| 8 | Referral Purchase | `referral_purchase` | 80 | 80 | 20 | 5 |
| 9 | Monthly Review | `review_monthly` | 15 | 5 | — | 1 |

### Streak Events (Auto-triggered)

| # | Event Name | action_key | XP | Coin | SP | Daily Cap |
|---|-----------|-----------|-----|------|-----|-----------|
| 10 | 7-Day Streak | `streak_7day` | 30 | 10 | — | 1 |
| 11 | 30-Day Streak | `streak_30day` | 100 | 30 | — | 1 |

### Quest Completion Events

| # | Event Name | action_key | XP | Coin | SP | Daily Cap |
|---|-----------|-----------|-----|------|-----|-----------|
| 12 | Daily Quest Done | `daily_quest_done` | 13 | 2 | 1 | 3 |
| 13 | Weekly Quest Done | `weekly_quest_done` | 45 | 8 | 3 | 4 |
| 14 | Monthly Challenge | `monthly_challenge` | 180 | 25 | 6 | 4 |
| 15 | Seasonal Challenge | `seasonal_challenge` | 350 | 80 | 15 | 2 |

---

## Section 2 — Trainer Events

### In-House Coach Events

| # | action_key | Score | Coin | XP | Daily Cap |
|---|-----------|-------|------|----|-----------|
| 1 | `trainer_attendance_ontime` | 8 | 1 | 8 | 10 |
| 2 | `trainer_pt_log_complete` | 12 | 2 | 12 | 10 |
| 3 | `trainer_member_streak_success` | 20 | 4 | 20 | 5 |
| 4 | `trainer_squad_challenge_success` | 50 | 10 | 50 | 1 |
| 5 | `trainer_renewal_influence` | 25 | 5 | 25 | 3 |

### Freelance Partner Events

| # | action_key | Score | Coin | XP | Daily Cap |
|---|-----------|-------|------|----|-----------|
| 6 | `partner_session_ontime` | 6 | 2 | 6 | 10 |
| 7 | `partner_session_complete` | 10 | 2 | 10 | 10 |
| 8 | `partner_repeat_booking` | 20 | 4 | 20 | 5 |
| 9 | `partner_clean_month` | 40 | 8 | 40 | 1 |

---

## Section 3 — Package/Shop Formulas (v2)

### Package XP
```
XP = floor(net_paid / 300) + term_bonus
term_bonus: 1m=8, 3m=18, 6m=35, 12m=55
```

### Package Coin
```
Coin = floor(net_paid / 180) + term_bonus_coin
term_bonus_coin: 1m=1, 3m=5, 6m=12, 12m=25
Cap: 100 coin/order
```

### Shop XP
```
XP = 6 + floor(net_paid / 180), cap 16
```

### Shop Coin
```
Coin = floor(net_paid / 120), cap 18
```

---

## Section 4 — Integration Points

| Producer | File | Event | Required Metadata |
|----------|------|-------|-------------------|
| Check-in | `src/hooks/useLobby.ts` | `check_in` | — |
| Class Attendance | `src/hooks/useClassBookings.ts` | `class_attended` | — |
| Slip Approval | `supabase/functions/approve-slip/index.ts` | `package_purchased` | `net_paid`, `term_months` |
| Stripe Payment | `supabase/functions/stripe-webhook/index.ts` | `package_purchased` | `net_paid`, `term_months` |
| Manual Purchase | `src/hooks/useMemberDetails.ts` | `package_purchased` | `net_paid`, `term_months` |
| Event Processor | `supabase/functions/gamification-process-event/index.ts` | All events | — |
| Reward Redeem | `supabase/functions/gamification-redeem-reward/index.ts` | Redemption + void | — |

---

*Changes here must be reflected in Edge Function logic and `gamification_rules` table.*
