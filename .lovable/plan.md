# Admin DS Motion + Per-Page Parity (Phase 4)

## Goal
Continue admin DS alignment by porting **motion/animation tokens** จาก DS และตรวจหน้าทีละหน้าให้ตรงกับ DS โดยไม่แตะ logic/hooks/RLS/i18n

## What I found in DS
DS ใช้ animations ชุดเล็กๆ ซ้ำกันทั่วทั้ง 17+ หน้า:
- `admin-pulse` (1.6s ease-in-out infinite) — live indicators ใน Lobby/Schedule/Modern/Promos/Branding/Announcements
- `admin-fade` (0.18s) — modal/sheet backdrop
- `admin-slide-in` (0.22s cubic-bezier) — side sheets ใน Schedule/Announcements/ClassesMain/Programs/Rooms
- `admin-pop` — modal pop-in
- KPI hover lift (`translateY(-1px)` + shadow ลึกขึ้น) — มีใน wrapper `AdminKpiCard` แล้ว แต่ `StatCard` (ที่หน้า admin ใช้จริง) ยังไม่มี

## Changes I will make

### 1. `src/index.css` — เพิ่ม DS motion keyframes (additive, ไม่ลบของเดิม)
```css
@keyframes admin-pulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.3)} }
@keyframes admin-fade   { from{opacity:0} to{opacity:1} }
@keyframes admin-slide-in { from{transform:translateX(100%)} to{transform:translateX(0)} }
@keyframes admin-pop    { from{opacity:0;transform:translate(-50%,-48%) scale(.96)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
.animate-admin-pulse / .animate-admin-fade / .animate-admin-slide-in / .animate-admin-pop
```
+ `prefers-reduced-motion` guard

### 2. `src/components/common/StatCard.tsx` — DS KpiCardV2 parity (scoped to admin)
ปัจจุบัน StatCard ใช้ `border-l-4` (DS เก่า). DS ใหม่ใน `Theme.jsx` (KpiCardV2) ใช้:
- ไม่มี left bar — ใช้ tinted icon chip มุมซ้ายบนแทน
- delta pill มุมขวาบน (success/destructive bg)
- 28px tabular-nums value
- hover lift `-translate-y-px` + shadow
- soft border + rounded-xl

**Approach (zero risk):** เพิ่ม CSS rules ใต้ `.surface-admin .stat-card-ds` หรือ ปรับ `StatCard` ให้ใช้ tinted-chip layout เมื่อมี `icon` prop **เฉพาะใน admin surface** (detect ผ่าน CSS scope)
- ทาง CSS-only: เพิ่ม `.surface-admin [data-stat-card] { ... hover lift ... }`
- ทาง TSX: เพิ่ม optional `variant?: 'default' | 'ds-chip'` prop, default คงเดิม → ไม่กระทบ member/trainer/staff
จะใช้แบบ TSX variant prop (ปลอดภัยกว่า, ชัดเจน)

จากนั้นใน `src/pages/Dashboard.tsx` (5 KPIs) เพิ่ม `variant="ds-chip"` ให้ทั้ง 5 ใบ

### 3. Live indicators ใน Dashboard — ใช้ `.animate-admin-pulse`
ตรวจ:
- `LiveActivityFeed`, `RecentActivityFeed` — ถ้ามี dot status ให้เปลี่ยนเป็น admin-pulse
- `Lobby.tsx` — สมาชิกที่อยู่ในยิม dot status
- `Schedule.tsx` — คลาสที่กำลังจัด dot status
ตรวจก่อนแก้ ถ้าไม่มี dot ก็ข้าม

### 4. Per-page audit (ทีละหน้า, อ่านก่อนแก้)
สำหรับแต่ละหน้าที่ map กับ DS — เปิดไฟล์ DS อ่านโครง, เปิดหน้าปัจจุบัน, แก้เฉพาะ visual elements ที่ขาดหาย:
- **Dashboard** ✅ (Phase 3 done) — เพิ่ม ds-chip KPI + live pulse
- **Lobby** — ตรวจ live dot indicator + KPI strip
- **Schedule** — ตรวจ class card live state + side sheet animation
- **Members** — ตรวจ KPI strip + table row hover
- **Leads** — ตรวจ KPI strip + status pills
- **Finance** — ตรวจ KPI + transaction row chrome
- **Packages / Promotions** — ตรวจ card grid spacing
- **Insights / Analytics / Reports** — ตรวจ KPI + chart card chrome
- **Classes / Categories / Rooms / WorkoutList** — ตรวจ list chrome
- **Staff / Announcements** — ตรวจ list chrome + announcement live dot
- **Settings** — ตรวจ tab/sidebar layout
- **Gamification** — ตรวจ progress/tier visuals (ระวังของเดิมเยอะ)

**กฎ:** ถ้าหน้าเดิมไม่มี element ที่จะปรับ (เช่นไม่มี live dot) — ข้าม ไม่เพิ่มของใหม่ที่ไม่มีฟังก์ชัน

### 5. หน้าใน DS ที่ไม่มีใน app — ไม่สร้าง (ตามที่ user สั่ง)
`Branding.jsx`, `Programs.jsx` (เฉพาะ shell), `GamificationB.jsx` — บันทึกไว้ใน DEVLOG แล้ว ไม่ทำอะไรเพิ่ม

### 6. หน้า app ที่ไม่อยู่ใน DS — ไม่แตะ
`MemberDetails`, `StaffDetails`, `*Details`, `Create*`, `TransferSlips`, `Notifications`, `Profile`, `ActivityLog`, `Locations`, `Roles`, `RoleEditor`, `Auth/*`, `liff/*`, `CheckinDisplay`, `CheckinRedeem`, `*Preview`, `DiagnosticsDataAudit`, `ComingSoon`, `NotFound` — ปล่อยตามเดิม (จะได้ DS title styling อัตโนมัติจาก PageHeader ที่อัปแล้ว)

## Order
1. index.css — เพิ่ม admin-* keyframes + utility classes
2. StatCard — เพิ่ม `variant="ds-chip"` (back-compat)
3. Dashboard — apply ds-chip ให้ 5 KPIs + ตรวจ live dot
4. Lobby — live dot pulse
5. Schedule — live class dot pulse
6. ตรวจหน้าอื่นทีละหน้า, แก้เฉพาะที่จำเป็น
7. Update DEVLOG

## Hard rules (ไม่เปลี่ยน)
- ไม่แตะ logic/hooks/mutations/RLS/i18n/routes/realtime
- ไม่แตะ shadcn `ui/*`, AuthContext, hostname.ts, App.tsx, useRealtimeSync
- ไม่ลบ chip/card/column/action ที่มีอยู่
- ไม่เพิ่ม dependency
- DS motion scope ใต้ `.surface-admin` หรือ admin-only utility classes — member/trainer/staff ไม่กระทบ
- StatCard variant ใหม่ default = legacy → zero regression

อนุมัติแล้วผมเริ่ม Phase 4 ทันที
