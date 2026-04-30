# Phase 5C — Admin Shell + Dashboard match Modern.jsx mockup

## Why the previous attempt didn't change anything visible

`src/pages/Dashboard.tsx` ถูกแตะแค่ระดับ wrapper (เปลี่ยน `Card` → `AdminCard` ของ block "Today's Schedule" เท่านั้น) — แต่ structure ทั้งหน้ายังเป็น: `DashboardWelcome → BusinessHealth+RevenueForecast → 5 StatCards → GoalProgress → 3-col grid → DailyBriefing` ซึ่ง**คนละโครงกับ mockup เลย**.

Mockup จาก `MOOM Design System/ui_kits/admin/Modern.jsx` กำหนด:
- **ModernSidebar** (branch switcher + ⌘K search + pinned + collapsible groups + "ต้องดูวันนี้" attention)
- **ModernTopBar** (breadcrumb + center search + date pill + orange Check-in button + bell + avatar dropdown)
- **LivePulseCard** (dark hero: เช็คอินวันนี้ + 12-hr sparkline + กำลังอยู่ในยิม X/60)
- 4 KPI minimal cards
- **RevenueChart** stacked area + tabs (7วัน/30วัน/MTD/YTD) + segment legend
- **ActivityFeed** column ขวา

## Affected modules & status

| Module | Status | Action |
|---|---|---|
| `src/pages/Dashboard.tsx` | WORKING (ครบ widgets) | Restructure top half ให้ตรง mockup, **เก็บ widgets เดิมทั้งหมดไว้ครึ่งล่าง** |
| `src/components/layout/Sidebar.tsx` | WORKING (perms-aware NavLink) | Add: branch switcher, ⌘K search input, pinned section, attention card. **คง NavLink + permission gates เดิม** |
| `src/components/layout/Header.tsx` | WORKING | Restyle: breadcrumb + center search + date pill + orange CTA + bell + avatar dropdown |
| `src/components/dashboard/*` (Business/Revenue/Goal/Briefing/NeedsAttention) | WORKING | **ไม่แตะ** — render ต่อท้ายครึ่งล่าง |
| `useDashboardStats`, `useDashboardTrends`, `useScheduleByDate`, `useTransferSlipStats`, `useExpiringPackages`, `usePermissions` | WORKING | ไม่แตะ |
| `src/components/admin-ds/` | NEW (จาก phase ก่อน) | เพิ่ม 3 components ใหม่ |

## What MUST be preserved
- Routes ทั้งหมดใน Sidebar + permission gates (`canAccess`, `minLevel`, `resource`)
- Real-time badge counts (`useTransferSlipStats`, `useExpiringPackages`)
- ทุก widget ที่ทำงานอยู่: BusinessHealthCard, RevenueForecastCard, GoalProgressCard, NeedsAttentionCard, RecentActivityFeed, DailyBriefingCard, DashboardWelcome
- 5 KPI tiles + vs-last-week comparison + click-to-navigate
- `CheckInDialog` quick check-in
- i18n keys ทุกตัว — ไม่ hardcode raw text
- `MainLayout` structure + responsive mobile sidebar drawer

## What is actually being changed
- **Visual structure ของ Dashboard ครึ่งบน** — เปลี่ยนจาก grid ปนเปกัน เป็น hero + KPIs + chart-row ตาม mockup
- **Sidebar layout** — เพิ่ม sections (branch / search / pins / attention) รอบ ๆ NavLinks เดิม
- **Header layout** — ขยาย topbar ให้มี center search, date pill, orange CTA

## Implementation plan (small chunks, verifiable)

### Chunk A — DS primitives ใหม่ (additive, zero risk)
Files NEW:
1. `src/components/admin-ds/LivePulseCard.tsx` — dark hero + SVG sparkline
   - Props: `checkinsToday: number`, `weekDelta?: number`, `currentlyIn: number`, `capacity: number`, `branchName: string`, `series?: number[]` (12-hr trend)
   - ใช้ `useDashboardStats` (caller pass-in), no new hook
2. `src/components/admin-ds/RevenueAreaChart.tsx` — stacked area chart (recharts) + range tabs (7d/30d/MTD/YTD) + segment legend
   - Use existing `useDashboardTrends` (already returns 7d/30d series); MTD/YTD จาก `useFinance` (มี hook อยู่แล้ว)
   - ถ้า data ยังไม่มี breakdown segment (PT/Drop-in/Shop) → fallback เป็นเส้นเดียวพร้อม TODO comment
3. `src/components/admin-ds/AdminTopBar.tsx` — center search, date pill, orange Check-in CTA, bell, avatar — **wraps existing `Header.tsx` logic**, ไม่สร้าง state ใหม่

Verify: typecheck + import ใหม่ใน `index.ts`

### Chunk B — Dashboard restructure (preserve all widgets)
Edit `src/pages/Dashboard.tsx`:
```text
NEW LAYOUT:
┌──────────────────────────────────────────────┐
│  LivePulseCard (dark hero, full width)       │  ← NEW
├──────────────────────────────────────────────┤
│  5 KPI StatCards (existing — visual unchanged) │
├──────────────────────────────────────────────┤
│  RevenueAreaChart (2/3) │ RecentActivity (1/3)│  ← chart NEW, feed existing
├──────────────────────────────────────────────┤
│  ─────  เครื่องมือเชิงลึก (collapsible)  ─── │  ← divider
├──────────────────────────────────────────────┤
│  DashboardWelcome (existing)                 │
│  BusinessHealth + RevenueForecast (existing) │
│  GoalProgressCard (existing)                 │
│  NeedsAttentionCard + Today's Schedule       │
│  DailyBriefingCard (existing)                │
└──────────────────────────────────────────────┘
```
- All existing imports, hooks, perms checks ไม่ลบสักบรรทัด
- เพียงจัดลำดับใหม่ + แทรก 2 components ใหม่ไว้ครึ่งบน

### Chunk C — Sidebar uplift (additive sections)
Edit `src/components/layout/Sidebar.tsx`:
- เพิ่ม **BranchSwitcher** ด้านบน (ใช้ `useLocations` — มี hook อยู่แล้ว); ถ้า user มี location เดียว → ไม่แสดง
- เพิ่ม **⌘K search input** (filter ภายใน NAV_GROUPS เดิม — pure client-side, no new state machine)
- เพิ่ม **Pinned section** เหนือ groups (default: dashboard, lobby, schedule, members) — เก็บใน localStorage
- เพิ่ม **AttentionCard** ก่อน user footer (ใช้ `useTransferSlipStats` + `useExpiringPackages` ที่ import อยู่แล้ว)
- NavLink rendering, perms gates, badge logic เดิม — **ไม่แตะ**

### Chunk D — Header/topbar restyle
Edit `src/components/layout/Header.tsx`:
- เพิ่ม center search bar (uses existing global command palette ถ้ามี — ถ้าไม่มี → input พร้อม ⌘K kbd)
- เพิ่ม date pill (วันนี้, DD MMM) — `useDateLocale()`
- เพิ่ม orange "เช็คอิน" CTA (ใช้ existing `CheckInDialog` trigger จาก Dashboard — promote เป็น global ผ่าน event หรือ context)
- คง bell + avatar dropdown เดิม (เพียง restyle)

### Chunk E — i18n + DEVLOG
- เพิ่ม keys ที่จำเป็น (TH/EN) สำหรับ "ต้องดูวันนี้", "สลับสาขา", "ค้นหาหรือกด ⌘K", "รายได้รายวัน", "ประวัติสด" — ถ้ายังไม่มี
- DEVLOG entry สรุปการเปลี่ยนแปลง

## Regression checklist (ต้องเช็คทุกข้อก่อน done)
- [ ] Typecheck pass (`bun run build`)
- [ ] Sidebar: ทุก NavLink ยังกดได้ + permission gates ยังทำงาน + active highlight ถูกต้อง + mobile drawer ยังเปิด/ปิดได้
- [ ] Header: bell, avatar dropdown, logout, language toggle ยังทำงาน
- [ ] Dashboard: ทุก KPI tile กดแล้ว navigate ถูกต้อง + vs-last-week badge ยังโชว์
- [ ] BusinessHealth, RevenueForecast, GoalProgress, NeedsAttention, RecentActivity, DailyBriefing ยัง render data จริง
- [ ] CheckInDialog เปิดได้จากทั้ง Dashboard เดิมและ topbar ใหม่
- [ ] i18n: TH/EN switch แล้วไม่มี raw English
- [ ] Mobile (≤768px): topbar ใหม่ collapse properly, sidebar ยัง drawer

## Doc updates
- `docs/DEVLOG.md` — entry "Phase 5C: Admin shell + Dashboard match Modern.jsx mockup"
- `mem://design/visual-language-phase-2` — เพิ่ม note ว่า Admin shell อิง `Modern.jsx`
- `.lovable/plan.md` — บันทึก phase นี้

## Risk & rollback
- เสี่ยงต่ำ: ทุก change เป็น **additive layout** — logic/hooks/permissions เดิมไม่แตะ
- Rollback: revert 4 files (Dashboard, Sidebar, Header, admin-ds/index) → กลับสู่สถานะปัจจุบันได้ทันที
- ไม่มี DB migration, ไม่มี breaking API change
