

# Dashboard Enhancement — จากมุมมองเจ้าของธุรกิจ Gym

## วิเคราะห์สถานะปัจจุบัน

Dashboard ปัจจุบันมีข้อมูลที่ดีแล้ว แต่ขาด **ตัวเลขที่เจ้าของธุรกิจอยากเห็นทันทีที่เปิดหน้าจอ** — รายได้วันนี้ และ active members จำนวนจริง ตอนนี้:

- **ไม่มี "รายได้วันนี้"** — ต้องไปหน้า Finance ถึงจะเห็น
- **StatCard ตัวที่ 4 เป็น GoalProgress** — ซึ่งเป็น card ใหญ่ที่ไม่เหมาะอยู่ใน grid 4 ช่อง (ข้อมูลเยอะเกินสำหรับ compact stat)
- **DashboardWelcome** ไม่ localize วันที่ (hardcoded `en-US`)
- **AI Briefing** ซ่อนอยู่ล่างสุด กดเปิดแล้วยังต้องกด expand อีกชั้น — ซ้อน Collapsible สองชั้น
- **Today's Schedule** ใช้ DataTable 5 columns ที่ compact เกินไปบน mobile
- **Revenue Forecast** แสดงแค่ 3 bars ง่ายๆ ไม่มี % เปลี่ยนแปลง

## แผนการปรับปรุง (5 changes)

### Change 1: เพิ่ม "รายได้วันนี้" StatCard + เปลี่ยน layout เป็น 5 cards
**ทำไม:** เจ้าของ gym เปิด dashboard ทุกเช้า สิ่งแรกที่อยากเห็นคือ "วันนี้ได้เงินเท่าไร"

- เพิ่ม `todayRevenue` ใน `useDashboardStats` — query transactions วันนี้ที่ status=paid
- เพิ่ม StatCard ใหม่ "รายได้วันนี้" สี magenta พร้อม icon `Banknote`
- ย้าย `GoalProgressCard` ออกจาก grid 4 cards → ย้ายไปเป็น row ใหม่ (full-width card เล็กๆ)
- Layout: grid 2x2 บน mobile, 5 cols บน desktop (checkins, in-class, classes, revenue, active members)
- เพิ่ม `activeMembers` stat — count members where status='active'

**Files:** `useDashboardStats.ts`, `Dashboard.tsx`

### Change 2: Localize DashboardWelcome date + เพิ่ม "วันนี้คลาส X, สมาชิก Y" subtitle
**ทำไม:** วันที่แสดงเป็น English เสมอ + Welcome ควรสรุป snapshot ให้ทันที

- ใช้ `getDateLocale` ใน `DashboardWelcome` แทน hardcoded `en-US`
- เพิ่ม prop `stats` เพื่อแสดง quick summary: "วันนี้ X คลาส · Y เช็คอิน"

**Files:** `DashboardWelcome.tsx`, `Dashboard.tsx`

### Change 3: ปรับ Today's Schedule เป็น compact card list (ไม่ใช่ DataTable)
**ทำไม:** DataTable 5 columns อ่านยากบน laptop/tablet — schedule card format อ่านง่ายกว่า

- แทน DataTable ด้วย list ของ schedule items แบบ compact:
  ```
  09:00  Yoga Basics        Coach A    3/15
  10:00  HIIT Training       Coach B    12/20
  ```
- แต่ละ row เป็น clickable → navigate ไปหน้า schedule detail
- แสดงแค่ 4 columns: time, class, trainer, availability (ตัด room)

**Files:** `Dashboard.tsx`

### Change 4: ยุบ AI Briefing double-collapsible เป็นชั้นเดียว
**ทำไม:** ตอนนี้ต้องกด "Show AI Briefing" → แล้ว DailyBriefingCard ข้างในยังมี Collapsible อีกชั้น = UX ซ้ำซ้อน

- ลบ outer Collapsible ออก → ให้ DailyBriefingCard อยู่เป็น row ปกติ (collapsed by default ภายในตัวเอง)
- หรือ: ถ้า briefingStats มีข้อมูล ให้แสดง summary 1 บรรทัดเป็น teaser ก่อนกด expand

**Files:** `Dashboard.tsx`

### Change 5: Revenue Forecast — เพิ่ม % change indicator
**ทำไม:** เห็นแค่ตัวเลขไม่พอ ต้องเห็น "เพิ่มขึ้น/ลดลง กี่%"

- คำนวณ `monthOverMonth` = `(thisMonth - lastMonth) / lastMonth * 100`
- แสดง badge สีเขียว/แดง ข้าง "This Month" bar: `+15%` หรือ `-8%`

**Files:** `RevenueForecastCard.tsx`

---

## สิ่งที่ไม่เปลี่ยน
- BusinessHealthCard — ดีอยู่แล้ว
- NeedsAttentionCard — ดีอยู่แล้ว
- GoalProgressCard component เดิม — แค่ย้ายตำแหน่ง
- ทุก hooks, mutations, DB, RLS, auth, routing อื่นๆ

## i18n Keys เพิ่ม
- `dashboard.revenueToday` / `dashboard.activeMembers`
- `dashboard.todaySummary` (template: "{{classes}} classes · {{checkins}} check-ins")

## Smoke Test
1. Dashboard → เห็น "รายได้วันนี้" StatCard พร้อมตัวเลขจริง
2. Dashboard → เห็น Active Members count
3. Welcome header → วันที่แสดงเป็นภาษาไทย (เมื่อตั้งค่า TH)
4. Welcome header → แสดง quick summary "วันนี้ X คลาส"
5. Today's Schedule → แสดงเป็น compact list ไม่ใช่ table
6. AI Briefing → ไม่ต้องกด 2 ครั้งเพื่อเปิด
7. Revenue Forecast → เห็น % เปลี่ยนแปลง month-over-month
8. GoalProgress → แสดงเป็น row แยกต่างหาก (ไม่อัดใน stat grid)
9. Mobile responsive ยังดี
10. Dark mode ยังแสดงผลถูกต้อง

