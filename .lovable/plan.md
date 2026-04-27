# 🎨 Member App V2 — UI/UX Refresh (Surgical, Per-Page)

นำ Design ใหม่จาก `MOOM_Member_App_v1.html` มาใช้กับ Member App **โดยใช้ data จริงเท่าที่มี** และวาง UI shell สำหรับ feature ใหม่แบบชัดเจน (มี ribbon "เร็วๆ นี้") ตามกฎ `live-ui-action-policy`

---

## ✅ Audit: Feature ที่มี vs ไม่มีจริง (Verified)

| Element ใน design V2 | มีใน app แล้ว? | Source |
|---|---|---|
| Greeting + time-based | ✅ มี | `getTimeGreeting()` |
| Onboarding checklist | ✅ มี | `localStorage moom-onboarding-dismissed` |
| Next Up booking card | ✅ มี | `TodayCard` + `fetchMyBookings` |
| Momentum / Level / XP | ✅ มี | `MomentumCard`, `useMomentumProfile` |
| Status Tier badge | ✅ มี | `StatusTierBadge`, `fetchMemberStatusTier` |
| Daily Quests | ✅ มี | `QuestHub` + `useGamificationQuests` |
| Active Packages w/ urgency | ✅ มี | `MemberHomePage` activePackages |
| Referral | ✅ มี | `ReferralCard` |
| Suggested classes | ✅ มี | `SuggestedClassCard` |
| Streak flame | ✅ มี | `StreakFlame` |
| Badges grid | ✅ มี | `BadgeGrid`, `useGamificationBadges` |
| Rewards catalog | ✅ มี | `MemberRewardsPage` + `useGamificationRewards` |
| Schedule + filter | ✅ มี | `MemberSchedulePage` |
| Squad / Friends activity | ✅ มี | `SquadActivityFeed`, `MemberSquadPage` |
| Coupons | ✅ มี | `MemberCouponsPage` |
| **Mood check-in** (5 emoji) | ❌ **ไม่มี** | — design only |
| **Mascot "Moomu"** | ❌ **ไม่มี** | — design only |
| **Wellness Tip** card | ❌ **ไม่มี** | — design only |
| **Daily Spin** wheel | ❌ **ไม่มี** | — design only |
| **NEXT UP card 3 states** (no-booking / checked-in) | ⚠️ **มีแค่ has-booking** | TodayCard renders only when booking exists |
| **Quick Tile 4-grid** (book/history/friends/rewards) | ⚠️ มีแค่ 2 ปุ่ม | only check-in + book |
| **Sticky search + date strip** ใน Schedule | ⚠️ มีแค่ tabs ธรรมดา | needs upgrade |
| **Achievement teaser** | ❌ ไม่มี | design only |

---

## 🎯 Scope (3 หน้า, surgical)

### 1. **MemberHomePage** — รื้อ visual hierarchy ตาม V2

**เก็บไว้ทั้งหมด** (data + logic):
- Greeting, onboarding checklist, latestAnnouncement
- TodayCard (booking), MomentumCard, DailyBonusCard
- ActivePackages, ReferralCard, SuggestedClassCard

**เปลี่ยน visual + เพิ่ม shell**:
1. **`NextUpCard`** (ใหม่) — hero gradient card 3 states:
   - `has-booking` → ใช้ data จาก `nextTodayBooking` (มีอยู่)
   - `no-booking` → ใช้ `upcomingBookings.length === 0` 
   - `checked-in-today` → ตรวจจาก `member_attendance` วันนี้ (เพิ่ม query เล็กๆ ใน `services.ts`)
   - แทนที่ส่วน "Quick actions" + "TodayCard" รวมเป็นการ์ดเดียว
2. **`QuickTilesGrid`** (ใหม่) — 4 tiles: จองคลาส / ประวัติ / เพื่อน / รางวัล
   - จองคลาส → `/member/schedule` ✅
   - ประวัติ → `/member/attendance` ✅ (มี route)
   - เพื่อน → `/member/squad` ✅ (มี route)
   - รางวัล → `/member/rewards` ✅
3. **`MoodCheckinStrip`** (ใหม่, **UI shell only**) — 5 emoji, state เก็บใน `localStorage` (`moom-mood-${todayStr}`) — ไม่ส่ง backend, เพราะยังไม่มี table. มี subtle "บันทึกในเครื่อง" microcopy
4. **`WellnessTipCard`** (ใหม่, **UI shell**) — แสดง tip สุ่มจาก array hardcoded 6 tips (TH); ribbon "เร็วๆ นี้" ที่มุม + `pointer-events-none` บน CTA "ดูเพิ่ม"
5. **`MascotIllustration`** (ใหม่) — inline SVG 64x64 จาก design (ไม่ใช้ image; pure SVG path); decorative only
6. **`MomentumStrip`** (compact) — option เพิ่มเติม สำหรับเวอร์ชัน collapsed ของ MomentumCard

**ไม่แก้** :
- `useMemberSession`, query keys, realtime sync
- Onboarding storage key, dismissal logic
- `MomentumCard`, `DailyBonusCard` ภายใน

---

### 2. **MemberSchedulePage** — เพิ่ม sticky search + date strip

**เก็บ**: data fetching, booking mutations
**เพิ่ม**:
- Sticky header (search input + location selector chip)
- Horizontal date strip (7 วัน, scrollable)
- Filter chips (cardio/strength/mobility/combat/all) — **map กับ class_categories จริง** ที่มี (ใช้ `useClassCategories` ที่มีอยู่)
- "My bookings only" toggle
- Class card visual ใหม่ (filled bar, capacity indicator)

---

### 3. **MemberRewardsPage** — Refresh visual

**เก็บ**: `useGamificationRewards` data + redeem flow
**เพิ่ม**:
- Hero coin balance card (gradient orange)
- Tab navigation: แลกของรางวัล / ประวัติ / แบดจ์ (3 tabs; badges ใช้ `useGamificationBadges`)
- Featured reward banner (ถ้ามี `is_featured` flag)
- Category chips
- "แลกได้ตอนนี้ N รายการ" indicator (จำนวน rewards ที่ `cost <= balance`)

---

## 🛡️ Stability Guarantees

1. **Zero data layer changes** — ใช้ hooks/queries เดิมทุกตัว; เพิ่มแค่ 1 query เล็ก (`hasCheckedInToday`) ใน `services.ts`
2. **Mood + Wellness + Mascot = pure UI shells** — ไม่มี Supabase call, ไม่มี mutation; mood เก็บใน localStorage
3. **Coming Soon ribbons** ตาม `live-ui-action-policy`:
   - `WellnessTipCard` "ดูเพิ่ม" → `opacity-60 pointer-events-none` + ribbon "เร็วๆ นี้"
   - Daily Spin (ตัดออก ไม่ใส่ใน V1 รีลีสนี้ — กลัว expectation)
4. **Routes ทั้งหมดมีอยู่แล้ว** — ไม่ต้องแก้ `App.tsx`
5. **Translation** — ทุก string ใหม่ใส่ `t()` + เพิ่มเข้า `src/i18n/locales/{en,th}.ts`
6. **Visual tokens** — ใช้ semantic Tailwind classes (`primary`, `muted-foreground`, ฯลฯ) ไม่ hardcode HSL values; design tokens ใหม่จาก V2 (orange brand, status tier colors) อยู่ใน Tailwind theme อยู่แล้ว

---

## 📦 Files Touched

```
แก้:
  src/apps/member/pages/MemberHomePage.tsx       (rewrite layout, keep all data hooks)
  src/apps/member/pages/MemberSchedulePage.tsx   (add sticky search + date strip)
  src/apps/member/pages/MemberRewardsPage.tsx    (add tabs + hero balance card)
  src/apps/member/api/services.ts                (+1 query: hasCheckedInToday)
  src/i18n/locales/en.ts                         (+ ~20 strings)
  src/i18n/locales/th.ts                         (+ ~20 strings)

สร้างใหม่:
  src/apps/member/components/NextUpCard.tsx           (3-state hero)
  src/apps/member/components/QuickTilesGrid.tsx       (4-tile nav)
  src/apps/member/components/MoodCheckinStrip.tsx     (UI shell, localStorage)
  src/apps/member/components/WellnessTipCard.tsx      (UI shell, hardcoded tips)
  src/apps/member/components/MascotIllustration.tsx   (inline SVG)
  src/apps/member/components/MomentumStripCompact.tsx (compact alt of MomentumCard)

ไม่แตะ (PROTECTED / WORKING):
  - All hooks in src/hooks/
  - MomentumCard, DailyBonusCard, QuestHub, BadgeGrid (working)
  - MemberLayout, MemberBottomNav, MemberHeader
  - Routes / App.tsx
  - Auth, RLS, edge functions
```

---

## ✅ Regression Checklist

1. ✅ `bun run build` ต้องเขียว
2. ✅ Member Home → ยังเห็น booking, momentum, packages, referral ครบ
3. ✅ NextUpCard fallback ถูก state (no-booking) ตอนยังไม่จอง
4. ✅ Mood check-in → กดแล้วเก็บใน localStorage; refresh ยังเห็น
5. ✅ Schedule → search filter ทำงานจริง (filter list)
6. ✅ Rewards → tab "แบดจ์" โหลด badges จาก `useGamificationBadges`
7. ✅ ทุก translation key มีทั้ง EN + TH (run `bun scripts/compare-i18n.mjs` ถ้ามี)
8. ✅ Coming Soon elements มี `opacity-60 pointer-events-none` + ribbon
9. ✅ Mobile viewport 360-414px → no horizontal scroll, no clipped text
10. ✅ DEVLOG entry บันทึก mapping table

---

## 🚦 Defer (ตั้งใจ)

- ❌ **Daily Spin** — ต้องมี table + cron job + reward grants → BIG; ไม่ใส่รอบนี้
- ❌ **Mood check-in → backend** — ต้อง table `member_mood_log` + analytics → ทำเป็น dedicated round
- ❌ **Wellness Tips dynamic** — ต้องมี content table หรือ AI generate → ใช้ hardcoded ก่อน
- ❌ **Achievement teaser** dynamic — ต้องมี logic match badge progress → ใช้ static placeholder
- ❌ Profile / CheckIn / Bookings detail pages — รอ feedback หลังเห็น Home/Schedule/Rewards ก่อน

**Approve → ผม implement Home page ก่อน (largest impact, most components new), verify build + visual; แล้ว Schedule + Rewards ตามลำดับ**
