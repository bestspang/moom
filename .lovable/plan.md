
# Phase 5C (revised) — Design System เป็นระบบ ไม่ใช่ hard-code

## ทำไมตอนนี้ทุกหน้ายังเหมือนเดิม (root cause)

DS tokens (orange, cream, radius 12, density 13px, font Anuphan) ถูกเขียนไว้ใน `src/index.css` ครบแล้ว และ `MainLayout` ก็แปะ class `surface-admin` ที่บังคับ `font-admin` แล้วด้วย — **แต่ทุกหน้ายังใช้ shadcn `<Card>` / `<Button>` / `<Input>` ดิบๆ ที่อ้างถึง token เดียวกัน** เลยไม่มี delta visual ให้ตามองเห็น

สิ่งที่ขาด ไม่ใช่ "การไปแก้ไขทีละหน้า" แต่คือ **DS-aware primitive layer** ที่ทุกหน้าจะ "อัตโนมัติได้หน้าตาแบบ DS" โดยไม่ต้องแก้แต่ละหน้า และ **โครงสำหรับให้หน้า "แบรนด์ยิม" override ได้ในอนาคต** (แค่ไป toggle/เปลี่ยนค่า CSS variable ไม่กี่ตัว)

นี่คือเหตุผลว่าทำไมการแก้ ClassCategories + Promotions ใน Chunk 1 ถึง "ดูดี" แต่หน้าอื่นยังเหมือนเดิม — เพราะ Chunk 1 ไปแก้ที่ระดับ **page-level** ไม่ใช่ **system-level**

---

## หลักการใหม่ (ที่จะใช้ตลอดทุก chunk ถัดไป)

1. **Token-first** — ทุก visual decision (สี, radius, ระยะ, font weight, KPI accent) ผ่าน CSS variable เพียงชุดเดียว
2. **Brand-tunable** — variable ที่ user เปลี่ยนได้จากหน้า "แบรนด์ยิม" จะอยู่ใน scope เดียว (`:root` overrides) เพื่อให้อนาคตทำ live preview ได้ทันที
3. **Primitive-first** — ใช้ `AdminCard / AdminKpiCard / AdminPageHeader / AdminSectionHeader` (มีอยู่แล้ว) + เพิ่มอีก 3 ตัว ครอบคลุมทุก pattern จาก DS HTML kit
4. **No new pages** — แก้ไฟล์เดิมเท่านั้น, ไม่สร้าง route ใหม่, ไม่แตะ logic / hook / RLS
5. **Surgical** — diff ต้องน้อยที่สุดต่อหน้า (ส่วนใหญ่คือเปลี่ยน import + แทน wrapper)

---

## ขั้นตอน step-by-step

### Step 1 — ขยาย DS primitive layer (ครั้งเดียว, ใช้ได้ทุกหน้า)

ใน `src/components/admin-ds/` เพิ่ม 3 ตัว + token utility 1 ชุด:

| ไฟล์ใหม่ | ทำอะไร |
|---|---|
| `BrandTokens.ts` | Single source ของ CSS var ที่ "แบรนด์ยิม" จะมา override ได้ (primary, radius, accent set) + helper `applyBrandTokens(partial)` |
| `AdminToolbar.tsx` | wrapper สำหรับ search + filter chips + view-mode toggle (pattern ซ้ำใน Lobby/Categories/Classes/Trainers/Rooms) |
| `AdminStatusDot.tsx` | จุดสถานะ + pulse animation (`animate-admin-pulse` มีอยู่แล้วใน index.css) — ใช้ได้ทั้ง trainer on-shift, room occupied, lead hot |
| `AdminAvatar.tsx` | initials avatar + status dot + tier ring (ใช้ได้กับ member, trainer, staff) |

ไม่แตะ `src/components/ui/*` (shadcn primitives) — มี risk สูง

### Step 2 — Dashboard (หน้าแรกตามที่ user ขอ)

ไฟล์เป้า: `src/pages/Dashboard.tsx` + `src/components/dashboard/*`

แก้แบบ surgical:
- `<Card>` → `<AdminCard>` ใน "Today's Schedule" + รอบ section ที่ทำเอง
- ปรับ section title style ให้ match (`AdminSectionHeader`) — ตอนนี้ใช้ `CardTitle text-base` ดิบ
- KPI strip: ตอนนี้ใช้ `StatCard variant="ds-chip"` อยู่แล้ว → **คงไว้** (ทำงานดีแล้ว ห้ามพัง) แต่เพิ่ม subtle motion `animate-admin-pulse` บน status dot ของ "currently in class"
- Today's Schedule list: เพิ่ม coach color dot + status dot 6px (เลียนจาก DS Lobby preview)
- Live Activity Feed: wrap ใน AdminCard เดียวกัน (ตอนนี้ใช้ Card)
- **ไม่แก้** `BusinessHealthCard / RevenueForecastCard / GoalProgressCard / DailyBriefingCard / NeedsAttentionCard / DashboardWelcome` — อันนี้เป็น working composite ที่ user เห็นแล้ว ห้ามพัง (มี chart/AI logic) จะแก้ที่ระดับ wrapper เท่านั้น (เปลี่ยนพื้น Card → AdminCard ถ้าจำเป็น)

ผลที่ user จะเห็น: density กระชับขึ้น, card มี border + shadow แบบ DS, status dot กระพริบ, schedule row มี coach dot + fill bar แบบ DS

### Step 3 — Staff/Trainers (`/staff`)

- KPI strip ด้านบน: `AdminKpiCard` x4 (Total · On-shift now · PT today · Avg rating) — query เดิม, แค่ map ใหม่
- Toolbar: search + role filter + grid/list toggle ผ่าน `AdminToolbar`
- Roster: เปลี่ยนจาก table → grid ของ `AdminCard` มี `AdminAvatar` + role badge + status dot + spec chips
- **คงไว้**: `useStaff`, mutation, permission gate, `StaffDetails` route
- ถ้า role/spec ยังไม่มีในตาราง → render badge แบบ neutral (ไม่บังคับเพิ่ม schema)

### Step 4 — Classes (`/classes`)

- KPI strip: Active · Paused · Draft · Avg fill rate
- Toolbar: search + type filter + level chips + grid/list toggle
- Card grid: ใช้ `AdminCard` มี top accent bar (สีตาม category ผ่าน `getCategoryVisual`), coach stack, fill rate badge, rating
- **คงไว้**: `useClasses`, `ClassDetails` drawer/page, status mutation

### Step 5 — Rooms (`/rooms`)

- KPI strip: Total rooms · Avg utilization · Peak hour · Conflicts
- Card grid: room icon chip (สีของ room), capacity, equipment count, "ใช้งานสัปดาห์นี้ X คลาส", `AdminStatusDot` สำหรับ occupied
- **เลื่อน** heatmap visual ออกไปก่อน (DS แสดงไว้ แต่เป็น feature ใหม่ที่ต้องประมวลผล data จริง — จะเสนอใน chunk แยกเมื่อ user อยาก)
- **คงไว้**: `useRooms`, `RoomDetails`, schedule integration

---

## ไฟล์ที่จะแตะ

**ใหม่ (4)**
- `src/components/admin-ds/BrandTokens.ts`
- `src/components/admin-ds/AdminToolbar.tsx`
- `src/components/admin-ds/AdminStatusDot.tsx`
- `src/components/admin-ds/AdminAvatar.tsx`
- update `src/components/admin-ds/index.ts` (export)

**แก้ surgical (4 หน้า)**
- `src/pages/Dashboard.tsx` (Step 2)
- `src/pages/Staff.tsx` (Step 3)
- `src/pages/Classes.tsx` (Step 4)
- `src/pages/Rooms.tsx` (Step 5)

**ห้ามแตะ**
- `src/components/ui/*` (shadcn)
- `src/contexts/AuthContext.tsx`, `src/App.tsx` (routing)
- ทุก `src/hooks/use*.ts` (data layer)
- `BusinessHealthCard / RevenueForecastCard / GoalProgressCard / DailyBriefingCard / NeedsAttentionCard / DashboardWelcome` (composite ที่ทำงานอยู่ดี)
- `src/integrations/supabase/*`, migrations, RLS

---

## เตรียมพร้อมหน้า "แบรนด์ยิม" ในอนาคต (ไม่ทำตอนนี้)

`BrandTokens.ts` จะ expose 6 ตัวแปรหลักที่ user override ได้ทีหลัง:
```
--primary, --primary-hover, --accent, --radius, --font-admin, --shadow-md
```
หน้า Branding (DS มี `Branding.jsx`) ในอนาคตจะแค่:
1. โหลดค่าจาก DB (ตาราง `org_branding` — เพิ่มทีหลัง)
2. เรียก `applyBrandTokens(values)` ตอน mount
3. live preview ใช้ `setProperty` บน `<html>` ทันที

ตอนนี้แค่วาง interface ไว้ — **ยังไม่สร้างหน้าจริง ยังไม่แตะ DB** เพราะ user บอกว่าจะทำ "ในอนาคต"

---

## Regression checklist (จะรันท้าย Step 2 และ Step 5)

- [ ] Dashboard load ไม่ error, KPI ตัวเลขเดิม, schedule item คลิกไป `/calendar` ได้
- [ ] AI Daily Briefing ยังเรียก edge function ได้ (ไม่แตะ logic)
- [ ] Quick check-in dialog ยังเปิดได้
- [ ] `/staff` list ครบ จำนวนเดิม, คลิก card → StaffDetails ได้
- [ ] `/classes` filter + status toggle (active/paused) ยัง mutate ได้
- [ ] `/rooms` คลิก card → RoomDetails, capacity ตรง DB
- [ ] permission gate (`can(...)`) ยังซ่อน/แสดงปุ่มถูกต้อง
- [ ] i18n EN/TH สลับได้ทุกหน้า
- [ ] dark mode ไม่พัง (ทุก primitive ใหม่ใช้ token, ไม่ hard-code สี)

---

## คำถามก่อนเริ่ม

อนุมัติให้เริ่ม **Step 1 + Step 2 (DS primitive layer + Dashboard)** ในรอบนี้เลยไหมครับ? 

หลังจากนั้นรออ confirm ว่า Dashboard "หน้าตาเปลี่ยนจริง" แล้วค่อยเดินหน้า Step 3–5 ต่อเนื่อง — แบบนี้จะปลอดภัยกว่าทำ 4 หน้าพร้อมกันแล้วเจอ regression ลึกๆ
