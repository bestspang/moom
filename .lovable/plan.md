## Goal
เพิ่ม "โหมดปิดปรับปรุง / Coming Soon" ที่ admin เปิด-ปิดได้จาก Settings เมื่อเปิดใช้งาน ผู้ใช้ทั่วไป (member/trainer/staff และผู้เยี่ยมชม) จะเห็นหน้า "ปิดปรับปรุง" แทนหน้า login ปกติ ส่วน owner/manager ยังสามารถเข้าระบบได้ผ่าน URL ลับ `/admin`

## Affected modules & status
- `feature_flags` table (WORKING) — reuse, ไม่แก้ schema
- `src/App.tsx` routing (WORKING) — เพิ่ม gate wrapper และ route `/admin`
- `src/pages/Auth/Login.tsx` (WORKING) — reuse, ไม่แตะ
- `src/pages/settings/SettingsGeneral.tsx` (WORKING) — เพิ่ม card toggle
- `src/hooks/useFeatureFlags.ts` (WORKING) — reuse `useIsFeatureEnabled`

## What to preserve
- RLS/policies บน `feature_flags` (มี "Managers can manage" อยู่แล้ว)
- Auth flow, ProtectedRoute, SurfaceGuard, LIFF callbacks
- หน้า `/coming-soon` (roadmap) เดิม — ไม่ทับ ใช้หน้าใหม่ชื่อ `Maintenance`

## Design

### 1. DB (single migration, additive)
Seed 1 row ใน `feature_flags`:
```
key='maintenance_mode', name='Maintenance Mode',
description='When enabled, non-admin visitors see a Coming Soon page instead of login',
scope='global', enabled=false
```
ใช้ `INSERT ... ON CONFLICT (key) DO NOTHING` เพื่อ idempotent

### 2. Public read hook
เพิ่ม `useMaintenanceMode()` ใน `src/hooks/useMaintenanceMode.ts`
- Query `feature_flags` where `key='maintenance_mode'` (policy "All can read" อนุญาต anon อยู่แล้ว)
- Realtime: เพิ่ม `feature_flags` ใน `TABLE_INVALIDATION_MAP` (ถ้ายังไม่มี) เพื่อสลับสถานะสด
- staleTime สั้น (30s), refetchOnWindowFocus true

### 3. Gate component
`src/components/auth/MaintenanceGate.tsx`:
- อ่าน `useMaintenanceMode()` + `useAuth()`
- ถ้า `enabled === false` → render children
- ถ้า `enabled === true`:
  - ผ่าน (render children) เมื่อ path เริ่มด้วย `/admin` **หรือ** user ที่ login แล้วมี `access_level >= level_1_minimum` (staff/trainer/manager/owner) **หรือ** path เป็น `/liff/*` (LINE callback ต้องทำงาน)
  - อื่นๆ → render `<Maintenance />` page
- ระหว่างรอโหลด flag/auth: render null (กัน flash)

### 4. หน้า Maintenance
`src/pages/Maintenance.tsx` — หน้าใหม่ minimal:
- Brand logo, ข้อความ "ระบบกำลังปิดปรับปรุง" (TH default) / "We'll be right back" (EN)
- ไม่มีลิงก์ไป login สาธารณะ (admin เข้า `/admin` เอง)
- ใช้ design tokens ตาม index.css, ไม่ hardcode สี

### 5. Route `/admin` (admin backdoor login)
ใน `src/App.tsx`:
- เพิ่ม `<Route path="/admin" element={<Login />} />` (นอก MaintenanceGate หรือ gate ให้ผ่าน path นี้)
- หลัง login สำเร็จ Login เดิม redirect เข้า `/` ตามปกติ — ไม่ต้องแก้
- Wrap `<Routes>` ทั้งก้อนด้วย `<MaintenanceGate>` — logic ภายใน gate จะปล่อยผ่าน `/admin`, `/liff/*` และ user ที่เป็นทีมงาน

### 6. Admin UI toggle
`src/pages/settings/SettingsGeneral.tsx`: เพิ่ม Card "Maintenance Mode"
- Switch ผูกกับ flag `maintenance_mode` ผ่าน `useToggleFeatureFlag` (มีอยู่แล้ว)
- คำเตือนสีส้ม: "เมื่อเปิด ผู้ใช้ทั่วไปทั้งหมดจะเห็นหน้า Coming Soon ยกเว้น admin ที่เข้าผ่าน /admin"
- แสดง badge สถานะปัจจุบัน
- ปุ่ม toggle ต้องเรียก `logActivity({event_type:'maintenance_mode_toggled', ...})` ตาม convention
- Permission: hide เมื่อ `!can('settings','update')` — RLS เป็น boundary จริง

### 7. i18n
เพิ่ม key ทั้ง `en.ts` และ `th.ts`:
- `maintenance.title`, `maintenance.subtitle`, `maintenance.body`
- `settings.maintenance.card_title`, `.description`, `.enabled`, `.disabled`, `.warning`, `.admin_hint`

## What is actually broken
ยังไม่มีกลไก maintenance — ต้องสร้างใหม่ตามด้านบน

## Minimal-diff file list
สร้างใหม่:
- `supabase/migrations/<timestamp>_seed_maintenance_flag.sql`
- `src/hooks/useMaintenanceMode.ts`
- `src/components/auth/MaintenanceGate.tsx`
- `src/pages/Maintenance.tsx`

แก้:
- `src/App.tsx` — wrap routes ด้วย MaintenanceGate, เพิ่ม route `/admin`
- `src/pages/settings/SettingsGeneral.tsx` — เพิ่ม Maintenance card
- `src/hooks/useRealtimeSync.ts` — เพิ่ม `feature_flags` → invalidate `queryKeys.featureFlags`
- `src/lib/queryKeys.ts` — เพิ่ม key `maintenanceMode()` ถ้ายังไม่มี
- `src/i18n/locales/en.ts`, `src/i18n/locales/th.ts`
- `docs/DEVLOG.md` — บันทึกการเปลี่ยนแปลง

ไม่แตะ: `AuthContext`, `SurfaceGuard`, RLS policies, `Login.tsx`, LIFF, edge functions

## Regression checklist
1. Flag OFF → ทุก surface ทำงานเหมือนเดิม (member/trainer/staff/admin, LIFF, checkin)
2. Flag ON, anon เข้า `/`, `/login`, `/member/*` → เห็นหน้า Maintenance
3. Flag ON, anon เข้า `/admin` → เห็นหน้า Login staff → login สำเร็จ → เข้า Dashboard ได้
4. Flag ON, member ที่ login อยู่แล้ว refresh หน้า `/member/*` → เห็น Maintenance (ไม่ leak ข้อมูล)
5. Flag ON, staff ที่ login อยู่แล้ว → ใช้งาน admin ได้ปกติ
6. Flag ON → toggle OFF จาก Settings → member refresh → กลับเข้าแอปได้ (realtime invalidate)
7. LIFF callback `/liff/callback?...` ยังทำงานได้ตอน flag ON
8. `bun run test` + `bun run build` ผ่านทั้งหมด
9. `activity_log` มี entry เมื่อ toggle

## Cron / infra
ไม่มี cron ใหม่ ใช้ realtime + short staleTime
