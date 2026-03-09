# MOOM Momentum Club — Economy v1 Spec (Locked)

> **Status:** LOCKED — Production seed data  
> **Last verified:** 2026-03-09  
> **DB row count:** 127 records across 9 config tables + 24 gamification rules

---

## 1. Level Tiers (20 levels)

| Lv | Name | XP Required | Perk Code | Perk Description |
|----|------|-------------|-----------|------------------|
| 1 | Starter I | 0 | `none` | เริ่มต้นใช้งานระบบ |
| 2 | Starter II | 120 | `none` | ปลดล็อก progress card เพิ่ม |
| 3 | Starter III | 260 | `badge_slot_1` | ปลดล็อก badge slot ช่องแรก |
| 4 | Mover I | 440 | `none` | ปลดล็อก weekly summary แบบละเอียด |
| 5 | Mover II | 660 | `merch_coupon_tier_1` | แลกคูปองส่วนลดสินค้า merch ระดับ 1 ได้ |
| 6 | Mover III | 920 | `none` | ปลดล็อก frame โปรไฟล์ระดับ Mover |
| 7 | Strong I | 1,220 | `early_access_12h` | เข้าร่วม challenge หรือ drop ก่อน 12 ชม. |
| 8 | Strong II | 1,560 | `none` | ปลดล็อก shop category พิเศษบางรายการ |
| 9 | Strong III | 1,940 | `none` | ปลดล็อก title แสดงบนโปรไฟล์ |
| 10 | Strong IV | 2,360 | `package_coupon_tier_1` | แลกคูปองส่วนลด package ระดับ 1 ได้ |
| 11 | Elite I | 2,820 | `none` | ปลดล็อก challenge กลุ่ม Elite |
| 12 | Elite II | 3,320 | `badge_slot_2` | ปลดล็อก badge slot ช่องที่สอง |
| 13 | Elite III | 3,860 | `guest_reward_access` | แลกรางวัล guest pass บางประเภทได้ |
| 14 | Elite IV | 4,440 | `none` | ปลดล็อกโปรไฟล์ frame ระดับ Elite |
| 15 | Legend I | 5,060 | `seasonal_priority` | สิทธิ์เข้า seasonal event/drop ก่อน |
| 16 | Legend II | 5,720 | `none` | ปลดล็อก title ระดับ Legend |
| 17 | Legend III | 6,420 | `merch_coupon_tier_2` | แลกคูปอง merch ระดับสูงได้ |
| 18 | Legend IV | 7,160 | `package_coupon_tier_2` | แลกคูปอง package ระดับสูงได้ |
| 19 | Legend V | 7,940 | `vip_access` | สิทธิ์เข้าถึง reward/drop แบบ VIP |
| 20 | Legend X | 8,760 | `legend_only_access` | ปลดล็อก challenge และของรางวัลเฉพาะ Legend |

**XP progression curve:** ~120–800 XP gap between levels, increasing non-linearly.

---

## 2. Coupon Templates (8 templates)

| Name | Type | Value | Max Discount | Min Spend | Valid Days | Applies To |
|------|------|-------|-------------|-----------|-----------|-----------|
| Merch 50 THB Off | fixed | 50 | 50 | 300 | 14 | merch |
| Merch 100 THB Off | fixed | 100 | 100 | 700 | 14 | merch |
| Merch 10% Off | percent | 10 | 150 | 900 | 10 | merch |
| Package 150 THB Off | fixed | 150 | 150 | 2,500 | 21 | package |
| Package 300 THB Off | fixed | 300 | 300 | 5,000 | 21 | package |
| Birthday 12% Off | percent | 12 | 300 | 500 | 30 | all |
| Comeback 200 THB | fixed | 200 | 200 | 1,800 | 10 | package |
| Event 100 THB Off | fixed | 100 | 100 | 600 | 7 | event |

All non-stackable.

---

## 3. Badge Definitions (19 badges)

### Permanent Badges (10)

| Badge | Effect Type | Description |
|-------|-----------|-------------|
| First Step | cosmetic | เช็กอินครั้งแรกสำเร็จ |
| First Class | cosmetic | เข้า class ครั้งแรกสำเร็จ |
| Open Gym Soul | cosmetic | ใช้ open gym ครบ 10 ครั้ง |
| Explorer | coin_bonus_monthly | ลอง class ต่างประเภทครบ 4 แบบ |
| 25 Visits | cosmetic | เช็กอินครบ 25 ครั้ง |
| 50 Visits | unlock_profile_frame | เช็กอินครบ 50 ครั้ง |
| 100 Visits | unlock_profile_aura | เช็กอินครบ 100 ครั้ง |
| Squad Up | cosmetic | เข้าร่วม squad ครั้งแรก |
| Referral Spark | cosmetic | มี referral สำเร็จ 1 คน |
| Referral Hero | referral_coin_bonus | มี referral สำเร็จ 5 คน |
| Shop Scout | cosmetic | ซื้อของใน shop ครั้งแรก |

### Boost Badges (5) — temporary with duration

| Badge | Duration | Effect Type | Description |
|-------|----------|-----------|-------------|
| 4-Week Flow | 30d | weekly_visit_bonus | มา gym ต่อเนื่องครบ 4 สัปดาห์ |
| Comeback Strong | 14d | visit_xp_bonus | กลับมาหลังหายเกิน 30 วัน |
| Shop Supporter | 30d | next_merch_coin_bonus | ซื้อของครบ 3 ออเดอร์ |
| Package Keeper | 30d | renewal_visit_xp_bonus | ต่ออายุแพ็กก่อนหมด 2 รอบติด |
| Off-Peak Hero | 30d | offpeak_coin_bonus | เข้าใช้ช่วง off-peak ครบ 6 ครั้ง/เดือน |

### Access Badges (3) — gate content/rewards

| Badge | Duration | Effect Type | Description |
|-------|----------|-----------|-------------|
| Squad Captain | 90d | quest_access | นำทีมจบ challenge season |
| Community Heart | permanent | shop_access | เข้าร่วม community events ครบ 3 ครั้ง |
| Elite Finisher | permanent | exclusive_reward_access | จบ seasonal challenge ใหญ่ |

---

## 4. Reward Catalog (19 rewards)

| Reward | Type | Coin Cost | Cash Price | Min Level | Required Badge | Daily/Monthly Limit |
|--------|------|-----------|-----------|-----------|---------------|-------------------|
| Quest Reroll 1 ครั้ง | digital | 25 | — | 1 | — | 1/4 |
| Spring Profile Frame | digital | 30 | — | 1 | — | 1/1 |
| น้ำดื่มฟรี 1 ขวด | perk | 35 | — | 1 | — | 1/8 |
| Towel Rental ฟรี 1 วัน | perk | 45 | — | 1 | — | 1/8 |
| Night Energy Theme 30 วัน | digital | 45 | — | 3 | — | 1/1 |
| Locker Upgrade 1 วัน | perk | 60 | — | 2 | — | 1/4 |
| Body Composition Scan | perk | 70 | — | 3 | — | 1/2 |
| Special Shaker | hybrid | 80 | ฿199 | 5 | — | 1/1 |
| คูปอง Merch 50 บาท | coupon | 90 | — | 5 | — | 1/2 |
| Guest Pass Weekday <4PM | perk | 95 | — | 5 | — | 1/2 |
| สิทธิ์ซื้อ Limited Drop ก่อน | access | 120 | — | 8 | — | 1/1 |
| Community Drop Access Item | merch | 140 | ฿250 | 8 | Community Heart | 1/1 |
| สิทธิ์จอง Event ก่อน | access | 150 | — | 10 | — | 1/1 |
| Special Tee | hybrid | 160 | ฿490 | 10 | — | 1/1 |
| คูปอง Merch 100 บาท | coupon | 170 | — | 7 | — | 1/2 |
| Captain-Only Reward | merch | 180 | ฿290 | 12 | Squad Captain | 1/1 |
| คูปอง Merch 10% | coupon | 240 | — | 10 | Shop Supporter | 1/1 |
| คูปอง Package 150 บาท | coupon | 260 | — | 10 | — | 1/1 |
| คูปอง Package 300 บาท | coupon | 500 | — | 18 | — | 1/1 |

---

## 5. Quest Templates (22 quests)

### Daily Quests (8)

| Quest | Goal Type | Goal Value | XP | Coin |
|-------|-----------|-----------|-----|------|
| Come In Today | checkin_count | 1 | 12 | 2 |
| One Class, Done | class_attend_count | 1 | 18 | 3 |
| Floor Time | open_gym_minutes | 45 | 15 | 3 |
| Quiet Hour Hero | offpeak_checkin_count | 1 | 20 | 4 |
| Try Something New | new_class_type_attend_count | 1 | 20 | 4 |
| Stay Ready | next_day_booking_count | 1 | 8 | 2 |
| Recover Right | recovery_task_count | 1 | 10 | 2 |
| Small Upgrade | shop_order_count | 1 | 12 | 3 |

### Weekly Quests (8)

| Quest | Goal Type | Goal Value | XP | Coin | Bonus |
|-------|-----------|-----------|-----|------|-------|
| Two-Day Momentum | visit_days_per_week | 2 | 40 | 8 | — |
| Three-Day Momentum | visit_days_per_week | 3 | 70 | 12 | — |
| Mix It Up | distinct_class_types_weekly | 2 | 55 | 10 | — |
| Hybrid Week | pt_plus_class_combo | 1 | 65 | 12 | — |
| Bring One In | successful_trial_referral_count | 1 | 40 | 10 | Badge: Referral Spark |
| Support the Club | shop_order_count_weekly | 1 | 20 | 6 | — |
| Stay Ahead | early_package_renewal_count | 1 | 25 | 8 | Coupon: Merch 50 THB Off |
| Quiet Winner | offpeak_checkin_count_weekly | 2 | 50 | 10 | — |

### Monthly Quests (4)

| Quest | Goal Type | Goal Value | XP | Coin | Bonus |
|-------|-----------|-----------|-----|------|-------|
| 12 Visits This Month | monthly_checkin_count | 12 | 220 | 40 | Badge: 25 Visits |
| Class Explorer Month | monthly_class_mix_goal | 1 | 240 | 45 | Badge: Explorer |
| PT Momentum | monthly_pt_count | 6 | 300 | 55 | Coupon: Merch 100 THB Off |
| Shop Across Two Categories | monthly_distinct_shop_categories | 2 | 90 | 15 | Badge: Shop Supporter |

### Seasonal Quests (2)

| Quest | Goal Type | XP | Coin | Bonus |
|-------|-----------|-----|------|-------|
| 21-Day Momentum | seasonal_21_day_goal | 260 | 50 | Badge: 4-Week Flow + Coupon: Event 100 THB Off |
| 8-Week Consistency | seasonal_8_week_goal | 450 | 90 | Badge: Elite Finisher + Coupon: Package 150 THB Off |

---

## 6. Gamification Rules (24 action_key → XP/Coin mappings)

### Member Rules (15)

| Action Key | XP | Coin | Cooldown (min) | Daily Cap |
|-----------|-----|------|----------------|-----------|
| `check_in` | 8 | 1 | 720 | 1 |
| `open_gym_45min` | 18 | 3 | 720 | 1 |
| `class_attend` | 25 | 4 | 60 | 5 |
| `pt_session` | 40 | 6 | 60 | 3 |
| `daily_quest_done` | 12 | 2 | 0 | 3 |
| `weekly_quest_done` | 45 | 8 | 0 | 4 |
| `monthly_challenge` | 180 | 25 | 0 | 4 |
| `seasonal_challenge` | 380 | 80 | 0 | 2 |
| `review_monthly` | 20 | 5 | 0 | 1 |
| `referral_trial` | 30 | 15 | 0 | 5 |
| `referral_purchase` | 100 | 80 | 0 | 5 |
| `package_purchase` | 20 | 0* | 0 | 3 |
| `shop_purchase` | 10 | 0* | 0 | 5 |
| `streak_7day` | 30 | 10 | 0 | 1 |
| `streak_30day` | 100 | 30 | 0 | 1 |

*Coin for package/shop comes from `shop_reward_rules` + `economy_guardrails`, not from `gamification_rules`.

### Trainer Rules (9)

| Action Key | Type | XP | Coin | Daily Cap |
|-----------|------|-----|------|-----------|
| `trainer_attendance_ontime` | inhouse | 8 | 1 | 10 |
| `trainer_pt_log_complete` | inhouse | 12 | 2 | 10 |
| `trainer_member_streak_success` | inhouse | 20 | 4 | 5 |
| `trainer_squad_challenge_success` | inhouse | 50 | 10 | 1 |
| `trainer_renewal_influence` | inhouse | 25 | 5 | 3 |
| `partner_session_ontime` | freelance | 6 | 2 | 10 |
| `partner_session_complete` | freelance | 10 | 2 | 10 |
| `partner_repeat_booking` | freelance | 20 | 4 | 5 |
| `partner_clean_month` | freelance | 40 | 8 | 1 |

---

## 7. Shop Reward Rules (4 rules)

| Order Type | XP/Order | XP Cap | Coin/100 THB | Coin Cap | Min Level | Required Badge |
|-----------|---------|--------|-------------|---------|-----------|---------------|
| standard_shop_order | 10 | 20 | 1 | 25 | 1 | — |
| limited_drop_order | 12 | 25 | 1 | 20 | 8 | — |
| community_drop_order | 12 | 22 | 1 | 20 | 8 | Community Heart |
| captain_drop_order | 15 | 30 | 1 | 20 | 12 | Squad Captain |

---

## 8. Economy Guardrails (14 rules)

| Rule Code | Value | Description |
|-----------|-------|-------------|
| `MAX_CHECKIN_REWARD_PER_DAY` | 1 | เช็กอินรับ reward ได้วันละ 1 ครั้ง |
| `MAX_OPENGYM_REWARD_PER_DAY` | 1 | open gym รับ reward ได้วันละ 1 session |
| `MIN_OPENGYM_MINUTES` | 45 | ต้องครบ 45 นาทีจึงรับ reward open gym |
| `MAX_REVIEW_REWARD_PER_MONTH` | 1 | รีวิวรับ reward ได้เดือนละ 1 ครั้ง |
| `MAX_REWARD_REDEMPTION_PER_DAY` | 3 | แลกรางวัลรวมได้สูงสุด 3 รายการ/วัน |
| `MAX_DAILY_QUEST_REROLL_PER_DAY` | 1 | reroll daily quest ได้วันละ 1 ครั้ง |
| `SHOP_COIN_PER_100_THB` | 1 | ซื้อ shop ได้ 1 coin ต่อ 100 บาท |
| `SHOP_COIN_CAP_PER_ORDER` | 25 | coin สูงสุดต่อ order shop |
| `PACKAGE_COIN_PER_150_THB` | 1 | ซื้อ package ได้ 1 coin ต่อ 150 บาท |
| `PACKAGE_COIN_CAP_PER_ORDER` | 30 | coin สูงสุดต่อ order package |
| `SHOP_XP_BASE_PER_ORDER` | 10 | XP ขั้นต่ำต่อ order shop |
| `BOOKING_CANCEL_XP_ROLLBACK` | true | rollback reward หากยกเลิกและยังไม่ attend |
| `REFUND_COIN_ROLLBACK` | true | ถ้าคืนเงินให้ rollback coin |
| `REFUND_XP_ROLLBACK` | conditional | rollback XP กรณี reward มาจาก commerce event |

---

## 9. Trainer Tiers (10 tiers)

### In-House Coach Tiers (5)

| Tier | Min Score | Perk |
|------|----------|------|
| Coach Bronze | 0 | เริ่มต้นระบบ Coach Impact |
| Coach Silver | 300 | ปลดล็อก badge coach ระดับ Silver |
| Coach Gold | 700 | featured coach rotation priority |
| Coach Platinum | 1,200 | สิทธิ์ internal recognition tier สูง |
| Coach Black | 1,800 | coach elite perks + challenge leadership |

### Freelance Partner Tiers (5)

| Tier | Min Score | Perk |
|------|----------|------|
| Partner Bronze | 0 | เริ่มต้นระบบ Partner Reputation |
| Partner Silver | 250 | profile boost ระดับต้น |
| Partner Gold | 600 | discovery priority เพิ่มขึ้น |
| Partner Platinum | 1,000 | priority matching + partner badge เด่น |
| Partner Black | 1,500 | top partner visibility + special perks |

---

## 10. Trainer Action Rewards (11 actions)

### In-House (6)

| Action | Score | Coin | XP |
|--------|-------|------|----|
| ATTENDANCE_SUBMITTED_ON_TIME | 8 | 1 | 8 |
| PT_LOG_COMPLETED | 12 | 2 | 12 |
| MEMBER_4W_STREAK_SUCCESS | 20 | 4 | 20 |
| WEEKLY_RATING_TARGET_HIT | 15 | 3 | 15 |
| SQUAD_CHALLENGE_SUCCESS | 50 | 10 | 40 |
| RENEWAL_INFLUENCE_SUCCESS | 25 | 5 | 20 |

### Freelance (5)

| Action | Score | Coin | XP |
|--------|-------|------|----|
| SESSION_ON_TIME | 6 | 1 | 6 |
| SESSION_COMPLETED | 10 | 2 | 10 |
| REPEAT_BOOKING | 20 | 4 | 15 |
| RATING_TARGET_HIT | 15 | 3 | 12 |
| CLEAN_MONTH | 40 | 8 | 25 |

---

## 11. Economy Balance Summary

### Average Member Monthly Earning

| Activity Pattern | Est. XP/month | Est. Coin/month |
|-----------------|--------------|----------------|
| Light (2x/week, no quests) | ~180 XP | ~20 coin |
| Regular (3x/week, daily+weekly quests) | ~500 XP | ~80 coin |
| Active (4x/week, all quests) | ~900 XP | ~150 coin |
| Power (5x/week, all quests, shop, referral) | ~1,400 XP | ~250 coin |

### Time to Level Estimates

| Target | Regular Member | Active Member |
|--------|---------------|--------------|
| Lv 5 (Mover II) | ~6 weeks | ~3 weeks |
| Lv 10 (Strong IV) | ~5 months | ~3 months |
| Lv 15 (Legend I) | ~10 months | ~6 months |
| Lv 20 (Legend X) | ~18 months | ~10 months |

### Reward Affordability

| Reward | Regular Member Wait | Active Member Wait |
|--------|-------------------|-------------------|
| Water (35 coin) | ~2 weeks | ~1 week |
| Merch 50 coupon (90 coin) | ~5 weeks | ~3 weeks |
| PKG 150 coupon (260 coin) | ~13 weeks | ~7 weeks |
| PKG 300 coupon (500 coin) | ~25 weeks | ~14 weeks |

---

## 12. Phase Scope

### Phase 1 — Launch Now

- ✅ Levels 1-20
- ✅ XP + Coin ledgers
- ✅ 8 daily quests
- ✅ 8 weekly quests
- ✅ 10 core badges: First Step, First Class, Open Gym Soul, Explorer, 25/50/100 Visits, 4-Week Flow, Comeback Strong, Referral Spark
- ✅ 12 core rewards: Quest Reroll, Spring Frame, Night Theme, Water, Towel, Locker, Body Scan, Guest Pass, Merch 50/100, PKG 150, Shaker
- ✅ 4 shop reward rules
- ✅ 14 economy guardrails
- 🔲 Member home widgets + rewards page + badge gallery
- 🔲 Admin gamification overview

### Phase 2 — After Phase 1 Stable

- 4 monthly quests, 2 seasonal quests
- 9 remaining badges (Squad Up, Squad Captain, Referral Hero, Shop Scout/Supporter, Package Keeper, Off-Peak Hero, Community Heart, Elite Finisher)
- 7 remaining rewards (Merch 10%, PKG 300, Early Drop, Event Priority, Special Tee, Captain Drop, Community Drop)
- Squad system
- Trainer economy full UI
- Seasonal campaigns

### Phase 3 — Future

- Dynamic/personalized quests
- Advanced coupon stacking
- Shop segmentation by badge/season
- Trainer-led challenges

---

## 13. Design Principles

1. **Attendance > Spending** — visiting the gym earns more than buying things
2. **No free lunch** — every coin must be earned through real activity
3. **Margin-safe** — coupons have min_spend guards; hybrid items require coin + cash
4. **Anti-abuse** — cooldowns, daily caps, and guardrails enforced server-side
5. **Append-only ledgers** — XP/coin never mutated, only new entries
6. **Badge-gated rewards** — premium items require earning badges first
7. **Gradual unlock** — features unlock with levels, not day-one access

---

*This document is the single source of truth for the MOOM Momentum Club economy. Any changes must be reflected here first, then propagated to database and code.*
