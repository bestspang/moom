# MOOM Momentum Club — Economy v2 Spec

> **Status:** ACTIVE — Production  
> **Replaces:** ECONOMY_V1.md  
> **Last updated:** 2026-03-11

---

## Design Principles

1. **Attendance > Spending** — visiting the gym earns more than buying things
2. **4-Layer Benefit Model**: Pride (0 cost) → Convenience (low) → Low-cost perks (controlled) → Savings (minimal)
3. **Levels 18–20 are prestige tiers** — require XP + extra criteria, not just grinding
4. **Margin-safe** — coupons have min_spend guards; hybrid items require coin + cash
5. **Anti-abuse** — cooldowns, daily caps, and guardrails enforced server-side
6. **Append-only ledgers** — XP/coin never mutated, only new entries

---

## 1. Level Tiers (20 levels)

| Lv | Name | XP Required | Tier | Benefit Summary |
|----|------|-------------|------|-----------------|
| 1 | Starter I | 0 | Starter | เข้าระบบ Momentum Club, Daily/Weekly quest, Progress wallet |
| 2 | Starter II | 100 | Starter | Weekly summary, streak history เบื้องต้น |
| 3 | Starter III | 240 | Starter | Badge slot 1, Starter frame |
| 4 | Mover I | 420 | Mover | Quest reroll ฟรี 1 ครั้ง/เดือน, Mini challenge access |
| 5 | Mover II | 650 | Mover | น้ำเปล่าฟรี 1 ครั้ง/เดือน, ปลดล็อกแลก Merch Coupon Tier 1 |
| 6 | Mover III | 930 | Mover | Mover frame, เห็นของใหม่ใน shop ก่อน 6 ชม. |
| 7 | Strong I | 1,260 | Strong | Waitlist priority tier 1, Early access challenge 12 ชม. |
| 8 | Strong II | 1,650 | Strong | Towel ฟรี 1 ครั้ง/เดือน, Members-only shop items |
| 9 | Strong III | 2,100 | Strong | Profile title, Badge showcase 3 อัน |
| 10 | Strong IV | 2,620 | Strong | Body scan ฟรี 1 ครั้ง/เดือน, ปลดล็อก Package Coupon Tier 1 |
| 11 | Elite I | 3,210 | Elite | Priority booking 6 ชม. ก่อน, Elite-only challenge pool |
| 12 | Elite II | 3,870 | Elite | Badge slot 2, Selected class pass ฟรี 1 ครั้ง/เดือน |
| 13 | Elite III | 4,600 | Elite | น้ำเปล่าฟรี 2 ครั้ง/เดือน, Priority support |
| 14 | Elite IV | 5,400 | Elite | Guest pass off-peak 1 ครั้ง/เดือน, Early access drops 24 ชม. |
| 15 | Legend I | 6,280 | Legend | Perk Wallet Standard 1/เดือน (เลือก 1: น้ำ/towel/locker/class/merch 50) |
| 16 | Legend II | 7,240 | Legend | Waitlist priority tier 2, Renewal booster, Event queue priority |
| 17 | Legend III | 8,280 | Legend | Limited drop presale 24 ชม., Legend-only merch, Perk Wallet ต่อ |
| 18 | Apex Access | 9,400 | Prestige | Premium perk wallet 1/เดือน, Early access 36 ชม., Apex frame |
| 19 | Inner Circle | 10,900 | Prestige | Premium perk wallet 2 choices/เดือน, Quarterly guest pass premium |
| 20 | Legend Circle | 12,600 | Prestige | Premium perk token/เดือน, Early access 48 ชม., Annual Legend gift |

---

## 2. Prestige Tier Criteria (Levels 18–20)

### Level 18 — Apex Access
- XP ≥ 9,400
- Confirmed visits ≥ 60
- Complete monthly quest ≥ 4 จาก 6 เดือนล่าสุด
- Account standing ปกติ

### Level 19 — Inner Circle
- XP ≥ 10,900
- Confirmed visits ≥ 100
- อย่างน้อย 1: seasonal badge / referral conversion / 6 เดือนต่อเนื่อง
- Account standing ดี

### Level 20 — Legend Circle
- XP ≥ 12,600
- Confirmed visits ≥ 140
- Active tenure ≥ 12 เดือน
- อย่างน้อย 2 จาก 4: Elite Finisher / Community Heart / Package Keeper / Referral Hero
- Mode: Hybrid (auto-qualify + admin review)

---

## 3. XP Economy — Activity Rewards

| Action Key | XP | Coin | Cooldown | Daily Cap |
|-----------|-----|------|----------|-----------|
| `check_in` | 6 | 1 | 720 min | 1 |
| `open_gym_45min` | 16 | 3 | 720 min | 1 |
| `class_attend` | 22 | 4 | 60 min | 5 |
| `pt_session` | 34 | 6 | 60 min | 3 |
| `daily_quest_done` | 13 | 2 | 0 | 3 |
| `weekly_quest_done` | 45 | 8 | 0 | 4 |
| `monthly_challenge` | 180 | 25 | 0 | 4 |
| `seasonal_challenge` | 350 | 80 | 0 | 2 |
| `review_monthly` | 15 | 5 | 0 | 1 |
| `referral_trial` | 25 | 15 | 0 | 5 |
| `referral_purchase` | 80 | 80 | 0 | 5 |
| `package_purchase` | formula | formula | 0 | 3 |
| `shop_purchase` | formula | formula | 0 | 5 |
| `streak_7day` | 30 | 10 | 0 | 1 |
| `streak_30day` | 100 | 30 | 0 | 1 |

---

## 4. Package Purchase Formulas

### XP
```
XP = floor(net_paid / 300) + term_bonus_xp
```

| Term | Bonus XP |
|------|----------|
| 1 mo | +8 |
| 3 mo | +18 |
| 6 mo | +35 |
| 12 mo | +55 |

### Coin
```
Coin = floor(net_paid / 180) + term_bonus_coin
Cap: 100 coin/order
```

| Term | Bonus Coin |
|------|------------|
| 1 mo | +1 |
| 3 mo | +5 |
| 6 mo | +12 |
| 12 mo | +25 |

### Examples

| Price | Term | XP | Coin |
|-------|------|----|------|
| 900 | 1m | 11 | 6 |
| 1,200 | 1m | 12 | 7 |
| 3,000 | 3m | 28 | 21 |
| 6,000 | 6m | 55 | 45 |
| 10,000 | 12m | 88 | 80 |
| 12,000 | 12m | 95 | 91 |

---

## 5. Shop/Merch Purchase Formulas

### XP
```
XP = 6 + floor(net_paid / 180)
Cap: 16 XP/order
```

### Coin
```
Coin = floor(net_paid / 120)
Cap: 18 coin/order
```

### Examples

| Spend | XP | Coin |
|-------|----|------|
| 300 | 7 | 2 |
| 500 | 8 | 4 |
| 990 | 11 | 8 |
| 1,490 | 14 | 12 |
| 2,500+ | 16 (cap) | 18 (cap) |

---

## 6. Reward Catalog (Coin Pricing)

| Reward | Coin | Cash | Min Level |
|--------|------|------|-----------|
| น้ำดื่มฟรี 1 ขวด | 40 | — | 1 |
| Towel Rental ฟรี 1 วัน | 60 | — | 1 |
| Locker Upgrade 1 วัน | 70 | — | 2 |
| Body Composition Scan | 110 | — | 3 |
| Selected Class Pass | 220 | — | 12 |
| Guest Pass Off-Peak | 260 | — | 5 |
| คูปอง Merch 50 บาท | 140 | — | 5 |
| คูปอง Merch 100 บาท | 260 | — | 7 |
| คูปอง Package 150 บาท | 380 | — | 10 |
| คูปอง Package 300 บาท | 620 | — | 18 |
| Early Limited Drop Access | 120 | — | 8 |
| Event Priority Access | 150 | — | 10 |
| Special Shaker | 120 | ฿199 | 5 |
| Special Tee | 220 | ฿490 | 10 |

---

## 7. Time-to-Level Estimates

### Light Member (~180–280 XP/mo)
- Level 10: 10–14 เดือน
- Level 15: 24+ เดือน

### Core Member (~500–700 XP/mo)
- Level 10: 4–6 เดือน
- Level 15: 10–13 เดือน
- Level 18: 15–19 เดือน

### Power Member (~800–1,000 XP/mo)
- Level 15: 7–9 เดือน
- Level 18: 10–12 เดือน
- Level 20: 14–18 เดือน

---

## 8. Economy Guardrails

| Rule Code | Value |
|-----------|-------|
| `PACKAGE_XP_PER_300_THB` | 1 |
| `PACKAGE_COIN_PER_180_THB` | 1 |
| `PACKAGE_COIN_CAP_PER_ORDER` | 100 |
| `PACKAGE_XP_TERM_BONUS_1M/3M/6M/12M` | 8/18/35/55 |
| `PACKAGE_COIN_TERM_BONUS_1M/3M/6M/12M` | 1/5/12/25 |
| `SHOP_XP_BASE_PER_ORDER` | 6 |
| `SHOP_XP_PER_180_THB` | 1 |
| `SHOP_XP_CAP_PER_ORDER` | 16 |
| `SHOP_COIN_PER_120_THB` | 1 |
| `SHOP_COIN_CAP_PER_ORDER` | 18 |
| `MAX_REWARD_REDEMPTION_PER_DAY` | 3 |
| `MAX_DAILY_QUEST_REROLL_PER_DAY` | 1 |

---

*This document is the single source of truth for the MOOM Momentum Club economy v2.*
