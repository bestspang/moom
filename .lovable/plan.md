## ทำไมหน้าจริงไม่เหมือนภาพ

หน้า Member Home มี **componentครบทุกตัวแล้ว** แต่ใช้ design language แบบ "minimal-flat" (border บาง, radius เล็ก, สี neutral) ขณะที่ม็อคอัพใช้ **"warm-pastel-card" style**: การ์ดใหญ่, gradient ส้ม/เหลือง/ม่วงพาสเทล, chip-pill เด่น, mascot สิงโตน่ารัก, progress bar ตัวหนาสีเขียว.

ผมจะ **ไม่เปลี่ยน data flow / hooks / routes** ใดๆ — แตะเฉพาะ "ผิวนอก" (markup + tailwind classes) ของการ์ดที่เห็นในม็อคอัพ และเพิ่ม 2 widget ใหม่ที่ยังขาด.

---

## สิ่งที่จะแก้ (ทั้งหมดเป็น additive / visual-only)

### 1. Greeting block — ภาพที่ 1 (เย็นนี้พร้อมลุย! Kongphop)
- **MascotIllustration.tsx**: เปลี่ยนสิงโต SVG (หัวกลม, แผงคอส้ม, หูเล็ก, หน้ายิ้ม) แทนหมีปัจจุบัน — ขนาดใหญ่ขึ้นเป็น 80px
- Heading ใหญ่ขึ้น `text-3xl font-extrabold`, sub-line "Moomu พร้อมซ้อมกับคุณแล้ว 💪"
- เพิ่ม time-based prefix: "เย็นนี้พร้อมลุย!" / "เช้านี้พร้อมลุย!" / "บ่ายนี้พร้อมลุย!" (i18n keys ใหม่)

### 2. MoodCheckinStrip — ภาพที่ 1 (วันนี้รู้สึกยังไง?)
- เปลี่ยนเป็นการ์ดใหญ่ `rounded-2xl` border พาสเทล
- Title `text-base font-extrabold` (เลิกใช้ uppercase 11px)
- Mood แต่ละอันเป็น **ช่อง tile แยก** `bg-muted/40 rounded-xl p-3` มี emoji ใหญ่ + label ไทย ใต้ emoji (ปัจจุบัน label ซ่อนอยู่ใน aria-label เท่านั้น)
- เปลี่ยน 5 mood จาก [low, ok, good, strong, fire] → ใช้ emoji ตามม็อคอัพ: 😴 เหนื่อย / 😐 เฉยๆ / 🙂 ดี / 💪 พร้อม / 🔥 ไฟลุก
- เก็บ logic localStorage เดิม

### 3. Quest List Card (ใหม่) — ภาพที่ 2 ส่วนบน "เควสวันนี้"
- สร้าง **`QuestSummaryCard.tsx`** ใหม่ — wrapper รอบ data จาก `fetchMyQuests` (ที่มีอยู่ใน `features/momentum/api`)
- Header: target icon + "เควสวันนี้" + sub "สำเร็จ 2/4 · รับได้อีก +50 XP" + **ring progress** วงกลมตัวเลข + chevron expand
- Each quest row: ชื่อเควส (strikethrough ถ้า completed) + **XP pill ส้ม** `+20` + **Coin pill เหลือง** + ratio "0/45" + progress bar ตัวหนาเขียว/เทา
- Insert ใน HomePage section หลัง MomentumCard (ปัจจุบัน MomentumCard มี QuestHub แบบลายลึก — เก็บไว้แต่ใช้ summary card แทนการแสดงเต็มที่ home)
- **ไม่ลบ QuestHub** — ยังใช้ในหน้า /member/momentum

### 4. "ใกล้ปลดล็อก" Badge Teaser (ใหม่) — ภาพที่ 2 การ์ดม่วง-ชมพู
- สร้าง **`AlmostUnlockedBadgeCard.tsx`**
- Gradient pastel ม่วง→ชมพู `from-purple-100 to-pink-100`, border `border-purple-200`
- Trophy icon ในกล่อง gradient เข้ม + dot สีส้ม top-right
- Title "ใกล้ปลดล็อก" + ชื่อแบดจ์ + subtitle progress
- **Data source**: ดึงจาก existing `fetchUpcomingMilestones` (มีอยู่แล้ว) → แสดงตัวที่ progress สูงสุด
- ซ่อนถ้าไม่มี milestone

### 5. WellnessTipCard — ภาพที่ 2 การ์ดเขียวอ่อน
- Restyle: gradient พาสเทลเขียว `from-emerald-50 to-teal-50` border `border-emerald-200`
- Icon: emoji 🧘 ในกล่อง gradient (แทน Lightbulb)
- Tag pill เล็กสีเขียว "เคล็ดลับเวลเนส · หายใจ" บนสุด แทน "DAILY TIP" uppercase
- Title ตัวหนาดำใหญ่ "หายใจลึกๆ 5 ครั้งก่อนเริ่มคลาส"
- เก็บ Coming Soon ribbon (ตาม policy live-ui-action-policy)

### 6. FriendsPulseCard — ภาพที่ 2 การ์ดล่าง "4 คน เช็คอินวันนี้"
- เพิ่ม **avatar circles สีต่างกัน** (gradient เขียว/ฟ้า/ม่วง/ส้ม) แทนวงเดียวสีเหมือนกัน — ใช้ hash ของ member id เลือกสี
- Title ตัวหนาใหญ่ "4 คน เช็คอินวันนี้ 💪"
- Subtitle เล็ก "เพื่อนคุณอยู่ในสาขา…" (ใช้ location_name ถ้ามี / fallback "วันนี้")
- เปลี่ยน layout: avatar stack ซ้าย, text ขวา (ตอนนี้กลับด้าน)

### 7. ReferralCard — ภาพที่ 2 การ์ดส้มอ่อนล่างสุด
- Restyle: bg `bg-orange-50` border `border-orange-200` (แทน bg-card)
- Icon gift ในกล่อง `bg-orange-100 text-orange-600`
- Title ตัวหนาใหญ่ "ชวนเพื่อน รับแต้ม!" + sub "แชร์โค้ด ทั้งคู่ได้ 200 Coin"
- ปุ่ม "แชร์" สีขาว `bg-white border-orange-200 text-orange-700` มี Copy icon
- เก็บ logic copy/share เดิม 100%

### 8. Daily Spin Card (ใหม่ — placeholder) — ภาพที่ 3
- สร้าง **`DailySpinCard.tsx`** — gradient warm `from-amber-400 to-orange-500`
- Gift box 🎁 ในวงกลม dashed border ขาว
- Tag "DAILY SPIN" uppercase ขาว + title "หมุนรับรางวัลฟรี" + sub "วันละ 1 ครั้ง"
- ปุ่มขาว "หมุน!" — **disabled + opacity-60 pointer-events-none + Coming Soon badge** ตาม live-ui-action-policy (ยังไม่มี backend daily-spin)
- Insert บน HomePage หลัง NextUpCard (เป็น hook ดึงดูดสายตา)
- หมายเหตุใน DEVLOG: feature นี้ยังเป็น UI shell, ต้องเพิ่ม `daily_spins` table + edge function `gamification-daily-spin` ภายหลัง

### 9. i18n keys ใหม่ (en + th)
```
member.greetingEvening   → "เย็นนี้พร้อมลุย!" / "Ready for tonight!"
member.greetingMorning   → "เช้านี้พร้อมลุย!" / "Ready this morning!"
member.greetingAfternoon → "บ่ายนี้พร้อมลุย!" / "Ready this afternoon!"
member.mascotTagline     → "Moomu พร้อมซ้อมกับคุณแล้ว 💪"
member.mood.tired/ok/good/ready/onfire → ป้ายไทย
member.questsToday       → "เควสวันนี้"
member.questsProgress    → "สำเร็จ {{done}}/{{total}} · รับได้อีก +{{xp}} XP"
member.almostUnlocked    → "ใกล้ปลดล็อก"
member.dailySpinTitle    → "หมุนรับรางวัลฟรี"
member.dailySpinSub      → "วันละ 1 ครั้ง"
member.dailySpinCta      → "หมุน!"
member.referralBigTitle  → "ชวนเพื่อน รับแต้ม!"
member.referralBigSub    → "แชร์โค้ด ทั้งคู่ได้ 200 Coin"
member.checkedInToday    → "{{n}} คน เช็คอินวันนี้ 💪"
```

---

## สิ่งที่จะ **ไม่** แตะ

- `MemberHomePage.tsx` data hooks, query keys, navigation handlers
- `fetchMyBookings / fetchMyPackages / fetchMomentumProfile / fetchMyQuests`
- DB schema (ไม่มี migration)
- `NextUpCard`, `TodaySnapshotStrip`, `QuickTilesGrid`, `StreakStripCard`, `MomentumCard`, `DailyBonusCard`, `FeaturedBookingRow`, `AlmostThereCard` — ทำงานดีอยู่แล้ว
- routes, edge functions, RLS

---

## ลำดับการ render หน้า Home หลังแก้

```
1. Greeting + Lion mascot (refreshed)
2. StreakStripCard (เดิม, hide if 0)
3. Onboarding (เดิม, hide if done)
4. NextUpCard (เดิม)
5. TodaySnapshotStrip (เดิม)
6. DailySpinCard (ใหม่ — UI shell)
7. MoodCheckinStrip (refreshed — tile layout)
8. FriendsPulseCard (refreshed — colored avatars)
9. QuickTilesGrid (เดิม)
10. Announcement (เดิม)
11. DailyBonusCard (เดิม)
12. MomentumCard (เดิม)
13. QuestSummaryCard (ใหม่ — เควสวันนี้)
14. AlmostUnlockedBadgeCard (ใหม่)
15. AlmostThereCard / level nudge (เดิม)
16. WellnessTipCard (refreshed — green pastel)
17. Next Up bookings list (เดิม)
18. Active packages (เดิม)
19. ReferralCard (refreshed — orange)
20. Suggested class (เดิม)
```

---

## Files

**สร้างใหม่ (3)**
- `src/apps/member/components/QuestSummaryCard.tsx`
- `src/apps/member/components/AlmostUnlockedBadgeCard.tsx`
- `src/apps/member/components/DailySpinCard.tsx`

**แก้ไข (6)**
- `src/apps/member/components/MascotIllustration.tsx` — สิงโต SVG
- `src/apps/member/components/MoodCheckinStrip.tsx` — tile layout + ป้ายไทย
- `src/apps/member/components/WellnessTipCard.tsx` — green pastel + emoji
- `src/apps/member/components/FriendsPulseCard.tsx` — colored avatars + new layout
- `src/apps/member/features/referral/ReferralCard.tsx` — orange pastel skin
- `src/apps/member/pages/MemberHomePage.tsx` — insert 3 widgets, refresh greeting block, render order
- `src/i18n/locales/en.ts`, `src/i18n/locales/th.ts` — keys ใหม่
- `docs/DEVLOG.md` — log entry "Member Home V2 visual refresh + Daily Spin shell"

---

## Regression Checklist (จะ verify หลัง implement)

- [ ] `bun run build` ผ่าน
- [ ] Mood pick → save localStorage `moom-mood-YYYY-MM-DD` ยังทำงาน
- [ ] Referral copy/share modal ยังเปิดและคัดลอก URL ถูก (`/signup?ref=`)
- [ ] FriendsPulseCard ยัง hide เมื่อไม่มี squad / feed ว่าง
- [ ] Quest summary ดึง data จาก `fetchMyQuests` ไม่ duplicate กับ QuestHub
- [ ] AlmostUnlocked hide เมื่อไม่มี milestone ใกล้
- [ ] DailySpin ปุ่มกดไม่ได้จริง (opacity-60 pointer-events-none) + มี "Coming Soon" badge
- [ ] No new English-only strings — ทุกข้อความผ่าน i18n
- [ ] Lion mascot SVG render ที่ 64–80px ไม่เพี้ยน

---

ถ้า approve ผมจะ implement ครั้งเดียวทั้งหมด แล้ว verify build. ถ้าอยากเอาออก/ปรับชิ้นไหน บอกชื่อ widget ผมเอาออก 1 file + 1 slot บรรทัดใน HomePage.