# 🎨 Member Home V1 — Widget Pass (warm visual + 3 new widgets)

ตาม mockup `MOOM_Member_App_v1-2.html` (SVG thumbnail) — เน้น **เพิ่ม widget เข้าไป**, ไม่ลบของเดิม. คุณบอกว่าถ้าไม่ชอบจะลบทีหลัง.

---

## 🔍 อ่าน mockup ออกมาเป็น design language

จาก SVG preview (ไม่สามารถ unpack React bundle ได้, แต่ thumbnail บอก intent ครบ):

| Element | Mockup | สถานะปัจจุบัน |
|---|---|---|
| Warm cream background `#fafaf7` | ✅ | ❌ ใช้ neutral |
| Orange gradient hero `#ff7a1a→#ff9d4a` | ✅ | ✅ NextUpCard มี |
| Decorative circle on hero (top-right) | ✅ | ❌ ยังไม่มี |
| 5 mood circles | ✅ | ✅ MoodCheckinStrip (5 emojis) |
| 4 quick tiles | ✅ | ✅ QuickTilesGrid |
| Clean white list rows | ✅ | ✅ ListCard |
| 1 highlighted/featured row (orange tint) | ✅ | ❌ ยังไม่มี — **เพิ่ม** |
| Bottom nav 4 dots | ✅ | ✅ MemberBottomNav |

---

## 📋 Affected modules + status

| Module | Status | Action |
|---|---|---|
| `MemberHomePage.tsx` | WORKING | **Insert widgets** (additive) |
| `NextUpCard.tsx` | WORKING | **Polish** — add decorative circle, warm-up gradient |
| `MoodCheckinStrip.tsx` | WORKING | **No change** |
| `QuickTilesGrid.tsx` | WORKING | **No change** |
| ทุก data hook (`useQuery`) | WORKING | **No change** ใช้ของเดิม |
| New widgets (4) | NEW | **Create** |

## 🛡️ ต้องรักษาไว้ (must-preserve)

- ทุก query key + useQuery block เดิม
- Onboarding flow + `localStorage` dismissal
- NextUpCard 3 states (has-booking / no-booking / checked-in)
- Momentum card, Daily bonus, Almost There nudge
- Active packages with urgency colors
- Referral + Suggested class cards
- All routes ใน `App.tsx`
- I18n EN+TH ทุก key เดิม

---

## 🆕 Widgets ที่จะเพิ่ม (4 ตัว — ทั้งหมด wire กับ data จริง)

### Widget 1 — `StreakStripCard` (ใหม่)
**ทำไม:** mockup มี "highlighted orange row" + เรามี `currentStreak` data จาก `momentumProfile` พร้อมใช้
**ตำแหน่ง:** ใต้ Greeting, เหนือ NextUpCard
**แสดง:** 🔥 streak counter + "next milestone" + flame icon
**Data:** `momentumProfile.currentStreak` + `longestStreak` (มีอยู่แล้ว)
**Function จริง?:** ✅ มี — `fetchMomentumProfile` คืน `current_streak`/`longest_streak`
**Empty state:** ถ้า streak = 0 → ซ่อน widget (ไม่บังคับโชว์)

### Widget 2 — `TodaySnapshotStrip` (ใหม่)
**ทำไม:** mockup เน้น "day at a glance" + ข้อมูลทั้งหมดมีพร้อม
**ตำแหน่ง:** ใต้ NextUpCard
**แสดง:** 3 mini-stats inline:
- 📅 จำนวน class วันนี้ (`todayBookings.length`)
- ✅ check-in แล้ว/ยัง (`todayCheckin.checkedIn`)
- ⚡ XP วันนี้ (placeholder `0` ถ้าไม่มี — UI shell เหมือน WellnessTipCard)
**Function จริง?:** ⚠️ "XP วันนี้" ยังไม่มี endpoint dedicated — แสดงเป็น `momentumProfile.totalXp` วันนี้แทน หรือ mark "Coming Soon" ตาม guardrail

### Widget 3 — `FriendsPulseCard` (ใหม่ — UI shell + real data ถ้ามี squad)
**ทำไม:** quick tile "เพื่อน" route ไป `/member/squad` แล้ว แต่หน้าหลักยังไม่ tease activity
**ตำแหน่ง:** ใต้ Mood, เหนือ Quick tiles
**แสดง:** "เพื่อน 3 คนเช็คอินวันนี้" + avatar stack (max 3)
**Function จริง?:** ✅ บางส่วน — `SquadActivityFeed.tsx` มีอยู่ใน `features/momentum/` ใช้ data จริง. **Reuse** logic นั้นแบบย่อ. ถ้าไม่มี squad → ซ่อน widget
**Fallback:** ถ้า fetch fail/empty → ไม่แสดง (graceful)

### Widget 4 — `FeaturedClassRow` (ใหม่ — orange-tinted highlight row)
**ทำไม:** mockup มี orange-tint row ชัดเจน — pattern "today's pick"
**ตำแหน่ง:** หัว "Next Up" section, เป็น row แรก (ถ้ามี class แนะนำ)
**แสดง:** ListCard variant ที่ background = `bg-primary/10 border-primary/30`
**Logic:** `upcomingBookings[0]` + flag แสดง "⭐ คลาสถัดไปของคุณ" — ใช้ booking ของเดิมแค่ restyle row แรก
**Function จริง?:** ✅ ใช้ `fetchMyBookings` ของเดิม ไม่มี endpoint ใหม่

---

## 🎨 Visual polish (minimal)

- `NextUpCard`: เพิ่ม decorative circle absolute top-right (`absolute top-4 right-4 h-12 w-12 rounded-full bg-white/20`) ตาม mockup
- ไม่แตะ background สี global (`#fafaf7` cream) — รอ user feedback. ถ้าชอบค่อยเปลี่ยน CSS variable รอบหน้า

---

## 🔧 Minimal-diff plan

### Files ใหม่ (4)
```
src/apps/member/components/StreakStripCard.tsx        (~50 lines)
src/apps/member/components/TodaySnapshotStrip.tsx     (~60 lines, "Coming Soon" badge ตาม guardrail)
src/apps/member/components/FriendsPulseCard.tsx       (~70 lines, reuse fetcher)
src/apps/member/components/FeaturedBookingRow.tsx     (~40 lines, restyle ListCard)
```

### Files แก้ (3)
```
src/apps/member/pages/MemberHomePage.tsx    (insert 4 widget slots, ~20 lines เพิ่ม)
src/apps/member/components/NextUpCard.tsx   (เพิ่ม decorative circle, ~3 lines)
src/i18n/locales/{en,th}.ts                 (~12 keys ใหม่)
```

### ลำดับ render ใหม่ (additive)
```
1. Greeting + Mascot                   (เดิม)
2. StreakStrip                         🆕 (ถ้า streak > 0)
3. Onboarding                          (เดิม)
4. NextUpCard + decorative circle      ✏️ polish
5. TodaySnapshotStrip                  🆕
6. Mood                                (เดิม)
7. FriendsPulseCard                    🆕 (ถ้ามี squad activity)
8. QuickTilesGrid                      (เดิม)
9. Announcement                        (เดิม)
10. DailyBonus + Momentum              (เดิม)
11. Almost There                       (เดิม)
12. WellnessTip                        (เดิม)
13. Next Up section:                   (เดิม)
    - FeaturedBookingRow (row แรก)    🆕 highlight
    - ListCard rows ที่เหลือ
14. Active packages                    (เดิม)
15. Referral + Suggested               (เดิม)
```

---

## ✅ Function reality-check (ตามที่ user ขอ "เช็คดีๆ")

| Widget | Data hook | มีจริง? | ถ้าไม่มี → ทำอะไร |
|---|---|---|---|
| StreakStripCard | `momentumProfile.currentStreak` | ✅ มี | — |
| TodaySnapshot: วันนี้กี่คลาส | `todayBookings.length` (compute) | ✅ มี | — |
| TodaySnapshot: check-in แล้ว | `todayCheckin.checkedIn` | ✅ มี | — |
| TodaySnapshot: XP วันนี้ | ❌ ไม่มี endpoint | — | แสดง icon + "Coming Soon" badge ตาม policy `opacity-60 pointer-events-none` |
| FriendsPulseCard | `fetchSquadActivity` ใน `momentum/api.ts` | ✅ ตรวจแล้วมี `SquadActivityFeed` | reuse fetcher; ถ้า empty → ซ่อน |
| FeaturedBookingRow | `bookings[0]` | ✅ ใช้ของเดิม | — |

---

## 🚦 Defer (ตั้งใจ)

- เปลี่ยน background เป็น cream `#fafaf7` global → รอ user approve รอบถัดไป (touches `index.css` — blast radius)
- Bottom nav restyle → ไม่ใช่ home scope
- Avatar pill ใน header → ต้องเปลี่ยน MobilePageHeader — defer

---

## 📋 Regression checklist

1. `bun run build` เขียว
2. หน้า `/member` render ครบ ไม่มี layout shift
3. Onboarding ยังโผล่/ซ่อนตาม localStorage เดิม
4. NextUpCard 3 states ยังทำงาน (book today, no book, checked in)
5. Mood pick + persist ยังทำงาน
6. Quick tiles 4 ปุ่ม navigate ถูก
7. Streak strip โผล่เฉพาะ `streak > 0`
8. Friends pulse โผล่เฉพาะมี squad activity (ไม่มี → ซ่อนสนิท)
9. Featured booking row ใช้ `bookings[0]` — ถ้าไม่มี booking → ไม่ render
10. Today snapshot — XP slot โชว์ "Coming Soon" + opacity-60 pointer-events-none
11. EN + TH key ครบ (run `bun scripts/compare-i18n.mjs` ถ้าต้องการ)
12. Mobile 360–414px — ไม่มี horizontal scroll, ไม่ clip text

---

## 📦 Files touched สรุป

```
ใหม่ (4):
  src/apps/member/components/StreakStripCard.tsx
  src/apps/member/components/TodaySnapshotStrip.tsx
  src/apps/member/components/FriendsPulseCard.tsx
  src/apps/member/components/FeaturedBookingRow.tsx

แก้ (3):
  src/apps/member/pages/MemberHomePage.tsx        (+ ~25 lines)
  src/apps/member/components/NextUpCard.tsx       (+ 3 lines: decorative circle)
  src/i18n/locales/en.ts                          (+ ~12 keys)
  src/i18n/locales/th.ts                          (+ ~12 keys)

ไม่แตะ (PROTECTED):
  - All useQuery + query keys
  - All API services + fetchers
  - Auth, RLS, edge functions
  - App.tsx routes
  - DB schema
  - shadcn/ui components
```

---

## 📝 Doc updates

- Append `docs/DEVLOG.md`: "Member Home V1 widget pass — Streak/Snapshot/Friends/Featured"

---

**Approve → ผม implement 4 widgets + insert ใน HomePage + i18n + decorative polish ครั้งเดียว, verify `bun run build`. ถ้าไม่ชอบ widget ไหน คุณบอกชื่อมา ผมลบ component file + slot 1 บรรทัดออกใน 1 รอบ.**
