
## System analysis

ตรวจสอบสถานะปัจจุบัน:

| Area | ไฟล์ | สถานะ |
|---|---|---|
| Surface switcher | `Header.tsx` lines 305-325 + `SurfaceContext.tsx` | ⚠️ มี Member/Trainer App items แต่ surface ตรวจจาก URL/hostname เท่านั้น — **ไม่จำค่าใน session** และ avatar dropdown ไม่ highlight ปัจจุบัน |
| Toast i18n (logout/check-in) | `Header.tsx` + `header.*` keys EN/TH | ✅ ครบจากรอบก่อน (`logoutSuccess/Error`, `checkinDenied`, `notificationError`) |
| Lobby check-in monitor | `pages/Lobby.tsx` + `useLobby.ts` | ⚠️ มี table แล้ว แต่ **ไม่มี KPI realtime** (currently in / today total / walk-in vs package), ไม่มี realtime visual indicator, ไม่มี auto-refresh แม้ `useRealtimeSync` จะ invalidate cache อยู่แล้ว |
| Realtime sync | `useRealtimeSync.ts` | ✅ subscribed `member_attendance` → invalidates `check-ins` keys |
| RBAC | `Header.tsx` check-in ✅, `Lobby.tsx` write buttons ✅, `Sidebar.tsx` ✅ items gated by `can(resource, 'read')` + `minLevel` | ⚠️ ต้อง audit รอบสุดท้าย: notifications dropdown "View all" → `/notifications`, language toggle, profile link (low risk แต่ควรเช็ค) |

## Problem list

1. **Surface switcher ไม่ persist** — refresh แล้วลืม preference (เช่น user เลือก `?surface=member` แต่กลับมา default detection); ไม่ highlight current surface ใน dropdown
2. **Lobby ไม่มี realtime KPI strip** — แม้ data จะ auto-refresh ก็ตาม user มองไม่เห็น "currently active" จำนวนทันที
3. **Lobby ไม่มี visual cue ของแถวที่เพิ่งเข้ามา** (newly-arrived highlight)
4. **RBAC audit** — sidebar "Trainers" link ใน `people` group point ไป `/admin` (เดียวกับ Staff page) → ทุก manager เห็นซ้ำซ้อน; ไม่ใช่ regression แต่ออปชั่นจะ noted
5. (ตรวจแล้ว) check-in/logout toast keys → ครบ ไม่ต้องแก้

## Design

**1. Surface switcher persistence** — เพิ่ม localStorage key `moom-surface-preference` (read in `SurfaceContext` เป็น tie-breaker ก่อน fallback detection, ไม่ override hostname production). Avatar dropdown แสดง ✓ ข้าง surface ปัจจุบัน + เมนูปัจจุบัน disabled (กดไม่ได้ ป้องกัน loop)

**2. Lobby realtime monitor enhancements**
- เพิ่ม **KPI strip** ด้านบนตาราง: `Today total | Currently in (last 4h) | Walk-in | Package use` ใช้ data จาก `useCheckIns(today)` คำนวณ client-side (ไม่ต้อง query เพิ่ม)
- เพิ่ม **"LIVE" badge** เล็ก ๆ ข้าง title (pulse animation) แสดงว่า realtime ทำงาน
- เพิ่ม **newly-arrived highlight**: เก็บ `lastSeenIds` ใน `useRef`, แถวใหม่ flash `bg-primary/10` 3 วินาที (transient highlight, ใช้ Tailwind animation token)

**3. RBAC final audit**
- Header: ปุ่ม "Member App" — ปัจจุบัน gate ด้วย `hasAdminAccess || hasTrainerAccess` แต่ **ทุก authenticated user น่าจะเข้า member app ได้** (เพราะ `handle_new_user` ทำ member record). → เปลี่ยน gate: แสดง Member App เสมอถ้า login (เหมือน `MemberHeader.tsx` แสดง Admin Portal เฉพาะมีสิทธิ์)
- Sidebar: ตรวจซ้ำว่า `hasAccess(minLevel, resource)` ครอบทุก group → ✅ ตามโครงสร้างปัจจุบัน
- ไม่แตะ RLS / DB

**4. Toast i18n** — ไม่ต้องแก้เพิ่ม

## Plan (files + risks)

### 1. `src/apps/shared/SurfaceContext.tsx`
- เพิ่ม `getStoredSurface()` อ่าน `localStorage.moom-surface-preference`
- ใน `detectSurface` flow: hostname (production) → URL query (`?surface=`) → **stored preference (dev/preview เท่านั้น)** → fallback
- `setSurfacePreference(surface)` เขียน localStorage
- Risk: ต่ำ — ไม่กระทบ production hostname routing

### 2. `src/components/layout/Header.tsx`
- Import `useSurface` + `setSurfacePreference`
- Surface dropdown items: เพิ่ม `Check` icon ข้าง current; `Member App` แสดงเมื่อ user logged-in (ไม่ขึ้นกับ role); `Trainer App` คงไว้แค่ `hasTrainerAccess`
- กดเมนูใด → `setSurfacePreference(target)` ก่อน redirect

### 3. `src/pages/Lobby.tsx`
- เพิ่ม `<LobbyKpiStrip data={checkInData} />` (4 cards: total / currently in / walk-in / package)
- เพิ่ม "LIVE" pulse badge ใน `PageHeader` actions slot หรือใต้ title
- เพิ่ม row highlight logic: `useEffect` track new ids → set `recentIds` state → clear after 3s; pass `rowClassName` to `DataTable` (ถ้ารองรับ; ถ้าไม่รองรับ → wrap rows ด้วย custom render)

### 4. `src/components/lobby/LobbyKpiStrip.tsx` (ใหม่)
- Pure presentation, รับ array → คำนวณ memoized stats
- ใช้ DS tokens (`bg-card`, `text-primary`, etc.) — ไม่ hardcode

### 5. `src/i18n/locales/{en,th}.ts`
เพิ่ม keys ใต้ `lobby.*`:
- `kpiTotal` / `kpiCurrentlyIn` / `kpiWalkIn` / `kpiPackage`
- `liveBadge`
- `newCheckin` (sr-only announce)

### 6. `src/components/common/DataTable.tsx` — **อ่านก่อน** ว่ามี `rowClassName` prop หรือไม่
- ถ้าไม่มี → เพิ่มแบบ optional `rowClassName?: (row) => string` (backward compatible)

### 7. (ไม่แตะ) `useLobby.ts`, `useRealtimeSync.ts`, DB, edge functions, sidebar, command palette

## Regression checklist

- [ ] `bun run build` ผ่าน
- [ ] Production: admin.moom.fit ยังเข้า admin surface; member.moom.fit ยัง member
- [ ] Dev preview: เลือก surface ใน avatar → refresh → ยัง surface เดิม (จาก localStorage)
- [ ] Lobby KPI strip แสดงตัวเลขตรงกับตาราง
- [ ] เมื่อมี check-in ใหม่ (เปิดอีก tab เพิ่ม) → row ใหม่ flash + KPI อัปเดต ภายใน <3s
- [ ] Check-in/QR button ยังซ่อนสำหรับ user ไม่มี `lobby.write`
- [ ] ปุ่ม Member App แสดงให้ทุก authenticated user; Trainer App เฉพาะ trainer/freelance_trainer
- [ ] EN/TH locale sync (`scripts/compare-i18n.mjs`)
- [ ] ไม่มี hardcoded color ใน LobbyKpiStrip

## Doc updates

- `docs/DEVLOG.md`: append "Surface preference persistence + Lobby realtime monitor"
- Memory: เพิ่ม note ใหม่ `mem://ux/lobby-realtime-monitor` (KPI strip + LIVE badge + 3s row flash)

---

**Scope**: 1 ไฟล์ใหม่ (LobbyKpiStrip), 5 ไฟล์แก้, ไม่แตะ DB/edge/realtime config. Surface preference เป็น additive ที่ fallback last (ไม่ override hostname).
