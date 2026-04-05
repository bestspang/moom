

# Phase 2 + 3: Surface Polish — Member Packages, Staff Home, Trainer Home

## สิ่งที่เสร็จแล้ว (Phase 1) ✅
- StaffProfilePage i18n + ลบ fake buttons
- MemberHomePage ลด sections + จัดลำดับใหม่
- MemberProfilePage visual grouping
- QuickMenuStrip reorder
- Spacing fixes, dead code cleanup
- TrainerProfilePage disabled styling
- Sidebar version update

## Phase 2: Member Packages Polish

### MemberPackagesPage.tsx
- เพิ่ม icon ใน tab toggle: `Package` icon สำหรับ My, `ShoppingBag` สำหรับ Browse
- เพิ่ม session progress bar ใน My Packages cards — แสดง visual bar ของ sessions used/remaining (เช่น 3/10 sessions)
- เพิ่ม urgency color สำหรับ packages ใกล้หมดอายุ (< 7 วัน = orange, < 3 วัน = red)

### StaffProfilePage.tsx
- เพิ่ม `opacity-60 pointer-events-none` ให้ Coming Soon items (Notifications/Preferences/Help) ให้ชัดเจนว่ากดไม่ได้

## Phase 3: Staff + Trainer Polish

### StaffHomePage.tsx
- เพิ่ม "Recent Check-ins" section: query 5 ล่าสุดจาก `member_attendance` วันนี้
- เพิ่มปุ่ม quick link: Payments + Schedule (ข้าง Check-in + Members)

### TrainerHomePage.tsx
- เพิ่ม hint text "Tap to see details →" ใต้ Impact card
- เพิ่ม visual cue ว่า Impact card กดได้ (border + active state)

## ไฟล์ที่แก้

| # | ไฟล์ | การเปลี่ยนแปลง |
|---|------|----------------|
| 1 | `src/apps/member/pages/MemberPackagesPage.tsx` | Tab icons, session progress bar, expiry urgency |
| 2 | `src/apps/staff/pages/StaffProfilePage.tsx` | Disabled styling สำหรับ Coming Soon items |
| 3 | `src/apps/staff/pages/StaffHomePage.tsx` | Recent check-ins section, extra quick link buttons |
| 4 | `src/apps/trainer/pages/TrainerHomePage.tsx` | Tap hint + clickable styling on Impact card |
| 5 | `src/i18n/locales/en.ts` | New keys |
| 6 | `src/i18n/locales/th.ts` | New keys (Thai) |

## สิ่งที่ไม่เปลี่ยน
- Backend / DB / Edge Functions / Auth / RLS
- Admin Dashboard (เพิ่ง redesign)
- Check-In Page (เพิ่ง redesign)
- MemberHomePage / MemberProfilePage (Phase 1 เสร็จแล้ว)
- Routing structure / Shared components

## Smoke Test
1. Member Packages: My tab มี icon + progress bar แสดง sessions used/total
2. Member Packages: Browse tab มี icon, cards ยังกดซื้อได้
3. Member Packages: package ใกล้หมดอายุแสดง urgency color
4. Staff Profile: Coming Soon items มี disabled styling ชัดเจน
5. Staff Home: แสดง recent check-ins (หรือ empty state ถ้าไม่มี)
6. Staff Home: มีปุ่ม 4 ตัว (checkin/members/payments/schedule)
7. Trainer Home: Impact card มี hint text + กดแล้วไปหน้า impact
8. Dark mode ทุกหน้าที่แก้ยังดูดี
9. Published site ทำงานปกติทุก surface

