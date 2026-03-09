

# Step 1-3 Implementation Plan: Lock v1 Economy + Event Map + Phase 1 Scope

## Current State (Verified)

All seed data is **100% in the database** and matches the spec exactly:

| Table | Rows | Status |
|-------|------|--------|
| `gamification_levels` | 20 | Exact match |
| `gamification_badges` | 19 | Exact match |
| `gamification_rewards` | 19 | Exact match |
| `coupon_templates` | 8 | Exact match |
| `quest_templates` | 22 | Exact match |
| `gamification_trainer_tiers` | 10 | Exact match |
| `shop_reward_rules` | 4 | Exact match |
| `economy_guardrails` | 14 | Exact match |
| `trainer_action_rewards` | 11 | Exact match |
| `gamification_rules` | 24 | Exact match |

Schema is complete: all 27 gamification tables exist, all enums exist, Edge Functions deployed.

**What's missing:** No `docs/gamification-event-map.md` or `docs/ECONOMY_V1.md` — the event-to-reward logic exists only inside the Edge Function code and scattered across architecture docs.

---

## Plan: 3 Deliverables (No code changes, docs only)

### Deliverable 1 — `docs/ECONOMY_V1.md`

Lock the v1 economy spec as a single reference doc containing:
- 20 levels with XP thresholds and perk codes
- 8 coupon templates
- 19 badges (permanent/boost/access)
- 19 rewards (digital/perk/coupon/hybrid/merch/access)
- 22 quest templates (8 daily, 8 weekly, 4 monthly, 2 seasonal)
- 24 gamification rules (action_key → XP/coin mapping)
- 4 shop reward rules
- 14 economy guardrails
- Economy balance summary (60-180 coin/month for average member)

### Deliverable 2 — `docs/gamification-event-map.md`

Complete event-to-reward mapping:

**Member Events:**
| Event | Trigger | XP | Coin | Cooldown | Daily Cap | Quest Types Updated | Badge Progress | Rollback? |
|-------|---------|-----|------|----------|-----------|-------------------|----------------|-----------|
| `check_in` | Check-in confirmed | 8 | 1 | 720min | 1 | `checkin_count`, `visit_days_per_week`, `monthly_checkin_count`, `offpeak_checkin_count` | FIRST_STEP, VISIT_25/50/100, OFFPEAK_HERO | No |
| `class_attended` (mapped as `class_attend`) | Class attendance confirmed | 25 | 4 | 60min | 5 | `class_attend_count`, `distinct_class_types_weekly`, `new_class_type_attend_count`, `monthly_class_mix_goal` | FIRST_CLASS, EXPLORER | No |
| `open_gym_45min` | 45min gym session | 18 | 3 | 720min | 1 | `open_gym_minutes` | OPEN_GYM_SOUL | No |
| `pt_session` | PT completed | 40 | 6 | 60min | 3 | `monthly_pt_count`, `pt_plus_class_combo` | — | No |
| `package_purchased` | Payment confirmed | 20 | per rule | — | 3 | `early_package_renewal_count` | PACKAGE_KEEPER | Yes (refund) |
| `shop_purchase` | Order paid | 10 base + per rule | per shop_reward_rules | — | 5 | `shop_order_count`, `monthly_distinct_shop_categories` | SHOP_SCOUT, SHOP_SUPPORTER | Yes (refund) |
| `referral_trial` | Friend trial visit | 30 | 15 | — | 5 | `successful_trial_referral_count` | REFERRAL_SPARK | No |
| `referral_purchase` | Friend purchases | 100 | 80 | — | 5 | — | REFERRAL_HERO | Yes (refund) |
| `review_monthly` | Monthly review | 20 | 5 | — | 1 | — | — | No |
| `streak_7day` / `streak_30day` | Auto on streak | 30/100 | 10/30 | — | 1 | — | FLOW_4W, COMEBACK_STRONG | No |

**Trainer Events:**
| Event | Type | Score | Coin | XP |
|-------|------|-------|------|----|
| `trainer_attendance_ontime` | inhouse | 8 | 1 | 8 |
| `trainer_pt_log_complete` | inhouse | 12 | 2 | 12 |
| `trainer_member_streak_success` | inhouse | 20 | 4 | 20 |
| `trainer_squad_challenge_success` | inhouse | 50 | 10 | 50 |
| `trainer_renewal_influence` | inhouse | 25 | 5 | 25 |
| `partner_session_ontime` | freelance | 6 | 2 | 6 |
| `partner_session_complete` | freelance | 10 | 2 | 10 |
| `partner_repeat_booking` | freelance | 20 | 4 | 20 |
| `partner_clean_month` | freelance | 40 | 8 | 40 |

**Rollback Events:**
| Trigger | Action |
|---------|--------|
| Package refund | Rollback XP + coin from `package_purchased` |
| Shop refund | Rollback XP + coin from `shop_purchase` |
| Booking cancel (no attendance) | Rollback XP per guardrail `BOOKING_CANCEL_XP_ROLLBACK` |

**Anti-abuse (from gamification_rules + economy_guardrails):**
- Cooldown: check_in 720min, class_attend 60min, open_gym 720min, pt_session 60min
- Daily caps: check_in 1, class 5, PT 3, shop 5, referral 5
- Max redemptions: 3/day
- Quest reroll: 1/day

### Deliverable 3 — Phase 1 Launch Scope (inside `docs/ECONOMY_V1.md`)

**Phase 1 — Launch now:**
- Levels 1-20 (all)
- XP + Coin ledgers
- 8 daily quests
- 8 weekly quests
- 10 core badges (First Step, First Class, Open Gym Soul, Explorer, 25/50/100 Visits, 4-Week Flow, Comeback Strong, Referral Spark)
- 12 core rewards (Quest Reroll, Spring Frame, Night Theme, Water, Towel, Locker, Body Scan, Guest Pass, Merch 50/100, PKG 150, Shaker)
- 4 shop reward rules
- Member home widgets + rewards page + badge gallery
- Admin gamification overview

**Phase 2 — Wait:**
- 4 monthly quests, 2 seasonal quests
- 9 remaining badges (Squad Up, Squad Captain, Referral Hero, Shop Scout/Supporter, Package Keeper, Off-Peak Hero, Community Heart, Elite Finisher)
- 7 remaining rewards (Merch 10%, PKG 300, Early Drop, Event Priority, Special Tee, Captain Drop, Community Drop)
- Squad system
- Trainer economy full UI
- Seasonal campaigns

**Phase 3 — Future:**
- Dynamic/personalized quests
- Advanced coupon stacking
- Shop segmentation by badge/season
- Trainer-led challenges

---

## Files to create/modify

| File | Action |
|------|--------|
| `docs/ECONOMY_V1.md` | **Create** — Full economy spec, phase scope, balance rationale |
| `docs/gamification-event-map.md` | **Create** — Complete event → reward mapping |

No database changes. No code changes. Pure documentation that locks the spec for implementation.

