# 🎨 Member V2 — Schedule + Rewards Refresh (รอบต่อจาก Home)

ทำต่อตาม plan ที่ approve ไว้แล้วใน `.lovable/plan.md` — เหลือ **2 หน้า**: Schedule + Rewards. รอบนี้ **ไม่แตะ data layer เลย**, refresh เฉพาะ UI ตาม V2 design.

---

## 📋 Affected modules + status

| Module | Status | Action |
|---|---|---|
| `MemberSchedulePage.tsx` | WORKING (basic chips + grouped list) | **Refresh** — เพิ่ม sticky search + date strip |
| `MemberRewardsPage.tsx` | WORKING (balance + grid + history) | **Refresh** — เพิ่ม gradient hero + 3 tabs |
| `fetchSchedule`, `fetchMyBookings`, `fetchMomentumProfile`, `fetchRewards`, `fetchPointsHistory`, `fetchMyRedemptions`, `fetchMyBadges` | WORKING | **No change** ใช้ของเดิมทุกตัว |
| `useGamificationBadges` | WORKING | **Reuse** ใน Badges tab |
| Routes ใน `App.tsx` | WORKING | **No change** |

## 🛡️ ต้องรักษาไว้ (must-preserve)

- query keys ทั้งหมด (`['member-schedule']`, `['momentum-profile']`, `['gamification-rewards-member']`, `['my-redemptions']`, `['points-history']`, `['my-badges']`)
- redeem flow ใน `RewardDropCard` (server handles all logic)
- empty / loading / error states ของเดิม
- `MobilePageHeader` pattern + i18n keys ที่มีอยู่
- Realtime invalidation behavior
- Date locale via `useDateLocale()`

## 🐛 ที่จริงๆควรแก้

ไม่มี bug — เป็นการเสริม UX ตาม design V2 ที่ user approve ไว้แล้ว

---

## 🔧 Minimal-diff plan

### 1. `MemberSchedulePage.tsx` — sticky search + date strip

**Layout (V2):**
```text
┌──────────────────────────────┐
│ MobilePageHeader (เหมือนเดิม)│
├──────────────────────────────┤  ← STICKY (top-0 z-20 bg-background)
│ 🔍 Search input              │
│ [Mon 4][Tue 5][Wed 6]…(scroll)│
│ [All][Cardio][Strength]…     │
│ ◯ My bookings only           │
├──────────────────────────────┤
│ Grouped class list (เดิม)    │
└──────────────────────────────┘
```

**Logic ใหม่ (client-only filter, ไม่แตะ query):**
- `searchQuery` state → filter `className` หรือ `trainerName` (case-insensitive, includes)
- `selectedDate` state → default = today, click chip filters `scheduledDate === selectedDate`; click ซ้ำ → reset เป็น "all dates"
- `myBookingsOnly` toggle → ใช้ `fetchMyBookings(memberId)` ที่มีอยู่แล้ว, filter `data` ให้เหลือเฉพาะ schedule_id ที่ตรง booking
- **Date strip**: 7 วัน เริ่มจากวันนี้ — `Array.from({length: 7}, (_, i) => addDays(today, i))`. แสดง `EEE` + วันที่. Active = `bg-primary text-primary-foreground`
- ใช้ `class_categories` จาก data เดิม (ไม่ fetch เพิ่ม) — `categoryFilters` เดิมยังทำงาน

**Files:**
- `src/apps/member/pages/MemberSchedulePage.tsx` — rewrite return JSX, **เก็บ `useQuery` block เดิม**
- `src/apps/member/components/ScheduleDateStrip.tsx` (ใหม่) — pure presentational, props: `dates: Date[]`, `selected: Date | null`, `onSelect`
- `src/i18n/locales/{en,th}.ts` — keys ใหม่: `searchClasses`, `myBookingsOnly`, `today`, `tomorrow`, `noResultsForSearch`

### 2. `MemberRewardsPage.tsx` — gradient hero + 3 tabs

**Layout (V2):**
```text
┌──────────────────────────────┐
│ MobilePageHeader             │
├──────────────────────────────┤
│ 💰 Gradient hero balance     │  (orange→pink, lg shadow)
│   1,250 coins                │
│   Tier badge | Lvl 7         │
│   "✨ แลกได้ 5 รายการ"        │  (count rewards where cost <= balance)
├──────────────────────────────┤
│ [Rewards][History][Badges]   │  (Tabs from shadcn)
├──────────────────────────────┤
│ Tab content                  │
└──────────────────────────────┘
```

**Tabs:**
- **Rewards** (default) → existing `RewardDropCard` grid
- **History** → existing points history list (move out of bottom)
- **Badges** → ใช้ `BadgeGrid` ที่มีอยู่แล้ว (`memberId`); ถ้าไม่มี badge → "ทำเควสต์เพื่อปลดล็อก"

**Logic:**
- เพิ่ม `useState<'rewards' | 'history' | 'badges'>('rewards')`
- คำนวณ `redeemableCount = rewards?.filter(r => r.pointsCost <= profile.availablePoints && profile.level >= r.levelRequired).length ?? 0`

**Files:**
- `src/apps/member/pages/MemberRewardsPage.tsx` — restructure return JSX, ใช้ `Tabs` จาก `@/components/ui/tabs` (มีอยู่แล้ว). **คง `useQuery` ทั้ง 4 ตัวเดิม**
- `src/i18n/locales/{en,th}.ts` — keys ใหม่: `rewardsTab`, `historyTab`, `badgesTab`, `redeemableNow`, `unlockBadgesHint`

---

## 🚦 Defer (ตั้งใจ ตามเดิม)

- Daily Spin
- Mood backend persistence  
- Wellness tips dynamic
- Featured reward banner (รอ `is_featured` flag จริง — column ยังไม่มีใน `gamification_rewards`)

---

## ✅ Regression checklist

1. `bun run build` ต้องเขียว
2. Schedule page → กรอง category เดิมยังทำงาน
3. Schedule page → search "yoga" → list filter ตาม
4. Schedule page → คลิก date chip → list เหลือเฉพาะวันนั้น
5. Schedule page → toggle "My bookings only" → เห็นเฉพาะ class ที่จองไว้
6. Schedule page → คลิก class card → navigate `/member/schedule/:id` (เดิม)
7. Rewards page → balance + tier + level แสดงถูก
8. Rewards page → tab "ประวัติ" → history list เหมือนเดิม
9. Rewards page → tab "แบดจ์" → ใช้ `BadgeGrid` แสดง badges
10. Rewards page → redeem flow ยังทำงาน (ไม่แตะ `RewardDropCard`)
11. EN + TH translation ครบทุก key ใหม่
12. Mobile 360–414px → no horizontal scroll, no clipped text

---

## 📦 Files touched

```
แก้ (2):
  src/apps/member/pages/MemberSchedulePage.tsx    (return JSX rewrite)
  src/apps/member/pages/MemberRewardsPage.tsx     (return JSX rewrite + Tabs)
  src/i18n/locales/en.ts                          (+ ~10 strings)
  src/i18n/locales/th.ts                          (+ ~10 strings)

สร้างใหม่ (1):
  src/apps/member/components/ScheduleDateStrip.tsx (pure presentational)

ไม่แตะ (PROTECTED / WORKING):
  - All `useQuery` calls + query keys
  - fetchSchedule, fetchRewards, fetchPointsHistory, fetchMyRedemptions, fetchMyBadges
  - RewardDropCard (redeem mutation untouched)
  - BadgeGrid (reuse as-is)
  - MobilePageHeader, Section, FilterChips
  - App.tsx routes
  - Auth, RLS, edge functions
```

---

## 📝 Doc updates

- Append entry to `docs/DEVLOG.md`: "Member V2 — Schedule + Rewards refresh (continuation of V2 home redesign)"

---

**Approve → ผม implement Schedule ก่อน (เพิ่ม component ใหม่ 1 ตัว), verify build; แล้ว Rewards (refactor JSX อย่างเดียว) ตามมา. Total ~2 file edits + 1 file new + i18n.**
