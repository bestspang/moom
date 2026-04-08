

# System Audit Round 3: Admin Pages Date Localization + UX Fixes

## ตรวจสอบแล้ว
อ่านครบทุกหน้า Admin surface (Dashboard, Lobby, Members, Leads, Finance, Schedule, Packages, Promotions, PromotionDetails, TransferSlips, Classes, Locations, Staff, Gamification, Settings, Profile, Notifications) + ทุกหน้า Member/Trainer/Staff ที่แก้ไขไปแล้ว

## ปัญหาที่พบจริง

### 🔴 Date Localization ขาดหาย — Admin Pages (5 จุดที่แสดงผลบนหน้าจอ)

| # | File | จุดที่ขาด locale | ประเภท |
|---|------|-----------------|--------|
| 1 | `Members.tsx` L195 | `format(new Date(row.member_since), 'dd MMM yyyy')` | UI Display |
| 2 | `Members.tsx` L207 | `format(new Date(d), 'dd MMM yyyy')` (last attended) | UI Display |
| 3 | `Promotions.tsx` L90 | `fmtDate` → `format(new Date(d), 'd MMM yyyy')` | UI Display |
| 4 | `GamificationChallenges.tsx` L74 | `format(new Date(c.start_date), 'dd MMM')` (2 calls) | UI Display |
| 5 | `GamificationRisk.tsx` L44, L70 | `format(new Date(entry.created_at), ...)` (2 calls) | UI Display |

**ไม่ต้องแก้** (เหตุผล):
- `Lobby.tsx` — `format(..., 'HH:mm')` ← เวลาไม่ขึ้นกับ locale
- `Packages.tsx` L119 — CSV export only, ไม่แสดงบนหน้าจอ
- `SettingsImportExport.tsx` — CSV export only
- `PromotionDetails.tsx` — ใช้ `getDateLocale` ถูกต้องแล้ว
- `TransferSlips.tsx` — ใช้ `getDateLocale` ถูกต้องแล้ว
- `Leads.tsx` — ใช้ `getDateLocale` ถูกต้องแล้ว
- `Profile.tsx` — ใช้ `getDateLocale` ถูกต้องแล้ว
- Finance components — ใช้ `getDateLocale` ถูกต้องแล้ว

### 🟡 Hardcoded English Status Labels — Classes.tsx
`CLASS_STATUS_OPTIONS` L15-18 ใช้ hardcoded English labels `'Active', 'Drafts', 'Archive'` แทน i18n

### 🟡 Hardcoded English Status Labels — Packages.tsx
`PACKAGE_STATUS_OPTIONS` L22-27 ใช้ hardcoded English labels แทน i18n

### 🟢 Verified OK (ไม่ต้องแก้)
- ✅ Member surface pages — locale ครบหมดแล้ว (รอบก่อน)
- ✅ Trainer surface pages — locale ครบหมดแล้ว
- ✅ Staff surface pages — locale ครบหมดแล้ว
- ✅ Profile pages — มี Language/Theme toggle ครบทุก surface
- ✅ Dashboard, Schedule, Lobby, Leads, Finance — ทำงานดี
- ✅ Routing, Auth, RLS — ไม่มีปัญหา

## แผนแก้ไข (5 surgical fixes)

### Fix 1: `Members.tsx` — เพิ่ม locale ใน format calls
- Import `getDateLocale` + ใช้ `{ locale }` ใน 2 format calls (L195, L207)

### Fix 2: `Promotions.tsx` — เพิ่ม locale ใน fmtDate  
- L90: `fmtDate` function เพิ่ม `{ locale }` (ใช้ `locale` ที่ declare อยู่แล้วที่ L31)

### Fix 3: `GamificationChallenges.tsx` — เพิ่ม locale
- Import `getDateLocale` + ใช้ `{ locale }` ใน 2 format calls (L74)

### Fix 4: `GamificationRisk.tsx` — เพิ่ม locale
- Import `getDateLocale` + ใช้ `{ locale }` ใน 2 format calls (L44, L70)

### Fix 5: Status Labels i18n — `Classes.tsx` + `Packages.tsx`
- ย้าย `CLASS_STATUS_OPTIONS` เข้าไปใน component function เพื่อใช้ `t()` (เหมือนที่ Staff.tsx ทำอยู่แล้ว)
- ย้าย `PACKAGE_STATUS_OPTIONS` เข้าไปใน component function เพื่อใช้ `t()`

## สิ่งที่ไม่เปลี่ยน
- DB schema / RLS / Edge Functions / Auth / Routing
- Member, Trainer, Staff pages (แก้ไขดีหมดแล้ว)
- Components library / shared components
- CSV export format calls (ไม่ใช่ UI display)
- Finance components (ถูกต้องอยู่แล้ว)
- Any mutation hooks or API services

## Smoke Test
1. Members page → "สมาชิกตั้งแต่" column แสดงเป็นภาษาไทย (เมื่อตั้งค่า TH)
2. Members page → "เข้าล่าสุด" column แสดงเป็นภาษาไทย
3. Promotions page → วันที่ start/end แสดง localized
4. Gamification Challenges → วันที่ start/end แสดง localized
5. Gamification Risk → audit log date แสดง localized
6. Classes page → status options แสดงเป็นภาษาไทย
7. Packages page → status options แสดงเป็นภาษาไทย
8. เปลี่ยนภาษา EN↔TH → ทุกจุดเปลี่ยนตาม
9. ทุกหน้าอื่นยังทำงานเหมือนเดิม

