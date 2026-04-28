## เป้าหมาย

จัดลำดับ render ใน `MemberHomePage.tsx` ใหม่ให้ตรงกับ mockup ที่ส่งมา (A) **และ** เก็บ widget เดิมที่ทำงานอยู่ทุกตัวไว้ (B) — แค่ย้ายลงด้านล่างเป็น "secondary stack" ไม่ลบ ไม่แก้ logic ใดๆ

## ลำดับใหม่ (ตาม mockup ก่อน → ของเดิมต่อท้าย)

```
═══ HERO ═══
1.  Greeting + Lion mascot           (เดิม — บนสุดเสมอ)
2.  StreakStripCard                  (เดิม — hide ถ้า streak=0)
3.  Onboarding checklist             (เดิม — hide ถ้าทำครบ/dismissed)
4.  NextUpCard                       (เดิม — hero card สำคัญ ต้องอยู่บน)

═══ MOCKUP ORDER (ดันขึ้น) ═══
5.  QuickTilesGrid                   ← จองคลาส / ประวัติ / เพื่อน / รางวัล
6.  QuestSummaryCard                 ← เควสวันนี้ + ring
7.  AlmostUnlockedBadgeCard          ← ใกล้ปลดล็อก (ม่วง-ชมพู)
8.  WellnessTipCard                  ← เคล็ดลับเวลเนส (เขียว)
9.  FriendsPulseCard                 ← 4 คน เช็คอินวันนี้
10. ReferralCard                     ← ชวนเพื่อน รับแต้ม! (ส้ม)

═══ MORE (เดิมทั้งหมด — เลื่อนลง) ═══
11. TodaySnapshotStrip
12. MoodCheckinStrip
13. DailySpinCard                    (Coming Soon)
14. Announcement
15. DailyBonusCard
16. MomentumCard
17. AlmostThere level nudge
18. Next Up bookings list (+ FeaturedBookingRow)
19. Active packages
20. SuggestedClassCard
```

## เหตุผลการจัดวาง

- **Greeting + NextUp อยู่บนสุด** — ตาม Core memory `member-home-hierarchy` (Greeting → Next Up Bookings เป็น priority สูงสุด); ไม่ขัด mockup เพราะ mockup screenshot เริ่มกลางหน้า
- **6 widget mockup ดันขึ้นกลางหน้า** — ผู้ใช้เห็นทันทีหลัง scroll เล็กน้อย ตรงกับภาพ
- **Mood / TodaySnapshot / DailySpin / Momentum / Bookings list** ลงล่าง — ยัง working อยู่, ไม่กระทบใคร, ผู้ใช้ scroll เจอได้

## สิ่งที่จะ **ไม่** แตะ

- `MemberHomePage.tsx` data hooks, query keys, navigation handlers, props ของแต่ละ component
- ทุก component file (`QuickTilesGrid`, `QuestSummaryCard`, `AlmostUnlockedBadgeCard`, `WellnessTipCard`, `FriendsPulseCard`, `ReferralCard`, ฯลฯ) — ใช้แบบเดิม 100%
- i18n, DB schema, edge functions, routes, RLS

## Files

**แก้ไข (1)**
- `src/apps/member/pages/MemberHomePage.tsx` — re-order JSX blocks ตามลำดับใหม่ (ย้าย markup เท่านั้น)

**Doc**
- `docs/DEVLOG.md` — append entry "Member Home: re-order to match V2 mockup, no widget removed"

## Regression Checklist

- [ ] `bun run build` ผ่าน
- [ ] ทุก widget ยัง render เมื่อมี data และยัง hide เมื่อไม่มี data (StreakStrip, FriendsPulse, AlmostUnlocked, Onboarding, AlmostThere, Announcement)
- [ ] NextUpCard ปุ่ม primary/secondary ยังนำทางถูก
- [ ] Mood pick → save localStorage ยังทำงาน
- [ ] Referral copy/share ยังเปิด modal และคัดลอก URL ถูก
- [ ] FeaturedBookingRow ใน Bookings list ยังนำทางไป `/member/bookings/{id}` ถูก

## Estimate

- 1 file, 1 commit, ~80 บรรทัด JSX ย้ายตำแหน่ง (ไม่มี logic ใหม่)
- เวลา ≈ 1 รอบ implement + verify build
