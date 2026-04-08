

# System Audit: Project Knowledge Compliance Check

## ตรวจสอบแล้ว
อ่านทุก surface page ทั้ง Member, Trainer, Staff, Admin routing, profile pages, schedule pages, booking pages, home pages, check-in page

---

## ปัญหาที่พบจริง (Verified)

### 🔴 Date Localization ขาดหาย — 7 จุด
**Project Knowledge Rule**: `useDateLocale` ต้องใช้ทุก `date-fns` format call

| # | File | Line | Issue |
|---|------|------|-------|
| 1 | `MemberHomePage.tsx` | 241 | `format(parseISO(...), 'EEE, d MMM')` — ไม่มี locale |
| 2 | `MemberBookingsPage.tsx` | 75 | `format(parseISO(...), 'EEE, d MMM')` — ไม่มี locale |
| 3 | `MemberBookingDetailPage.tsx` | 116, 133, 139 | 3 จุด `format(parseISO(...))` — ไม่มี locale |
| 4 | `MemberClassDetailPage.tsx` | 93, 152 | 2 จุด — ไม่มี locale |
| 5 | `MemberAttendancePage.tsx` | 75 | `format(parseISO(...), 'PPp')` — ไม่มี locale |
| 6 | `MemberPackagesPage.tsx` | 154 | `format(parseISO(...), 'd MMM yyyy')` — ไม่มี locale |
| 7 | `TrainerHomePage.tsx` | 128 | `format(new Date(...), 'd MMM')` — ไม่มี locale |
| 8 | `TrainerBadgesPage.tsx` | 97 | `format(new Date(...), 'MMM d, yyyy')` — ไม่มี locale |
| 9 | `StaffPaymentsPage.tsx` | 48 | `format(parseISO(...), 'd MMM yyyy')` — ไม่มี locale |

**Impact**: วันที่แสดงเป็นภาษาอังกฤษเสมอแม้ user ตั้งค่าเป็นไทย

### 🟡 TrainerProfilePage — ไม่มี Language/Theme Toggle
**Project Knowledge Rule**: `ux/staff-profile-refinement` — ทุก profile ต้องมี language + theme toggle

TrainerProfilePage มีเฉพาะ Coming Soon items + surface switcher แต่ **ไม่มี** language/theme toggle ตรง profile page เอง (ต้องไปกดที่ TrainerHeader dropdown ซึ่ง UX ไม่ consistent กับ StaffProfilePage ที่มีแล้ว)

### 🟡 MemberProfilePage — ไม่มี Language/Theme Toggle
เหมือน Trainer — member ต้องไปหาใน bottom nav หรือ header ซึ่ง member surface ไม่มี header dropdown

### 🟢 Verified OK (ไม่ต้องแก้)
- ✅ `ADMIN_CAPABLE_ROLES` — ครบทุก profile page (Member, Trainer, Staff)
- ✅ `buildSessionTransferUrl` — ใช้ถูกต้องทุก surface switcher  
- ✅ StaffHomePage — "View Schedule" disabled ถูกต้อง
- ✅ Coming Soon items — มี subtitle + opacity pattern ถูก
- ✅ `MemberSchedulePage` + `TrainerSchedulePage` — มี locale แล้ว
- ✅ `MemberRewardsPage` + `MemberCouponsPage` — มี locale แล้ว
- ✅ Gamification event keys — ใช้ `check_in` ถูกต้อง
- ✅ Check-In page — thumb-zone layout ถูกต้อง
- ✅ Routing — ไม่มี duplicate, ProtectedRoute ครบ
- ✅ MobilePageHeader — ใช้ทุกหน้า mobile surface
- ✅ Auth — ไม่มี anonymous signup, ใช้ standard form

---

## แผนแก้ไข

### Change 1: Add `useDateLocale` to 7 files ที่ขาด
เพิ่ม `import { useDateLocale } from '@/hooks/useDateLocale'` + `const dateLocale = useDateLocale()` + `{ locale: dateLocale }` ในทุก format call

Files: `MemberHomePage.tsx`, `MemberBookingsPage.tsx`, `MemberBookingDetailPage.tsx`, `MemberClassDetailPage.tsx`, `MemberAttendancePage.tsx`, `MemberPackagesPage.tsx`, `TrainerHomePage.tsx`, `TrainerBadgesPage.tsx`, `StaffPaymentsPage.tsx`

### Change 2: Add Language + Theme toggle to TrainerProfilePage
เพิ่ม Section เหมือน StaffProfilePage — Globe toggle + Moon/Sun toggle ก่อน Coming Soon section

### Change 3: Add Language + Theme toggle to MemberProfilePage
เพิ่ม Settings section พร้อม language + theme toggle ก่อน Sign Out — ใช้ pattern เดียวกับ StaffProfilePage

---

## สิ่งที่ไม่เปลี่ยน
- DB schema / RLS / Edge Functions
- Auth / Routing / ProtectedRoute  
- Admin pages ทั้งหมด
- StaffProfilePage (แก้ไขดีอยู่แล้ว)
- Component library / shared components
- Any mutation hooks or API services

## Smoke Test
1. MemberHomePage → booking date แสดงเป็นภาษาไทย
2. MemberBookingsPage → date localized
3. MemberBookingDetailPage → วันที่ทั้ง 3 จุด localized
4. MemberClassDetailPage → date localized
5. MemberAttendancePage → check-in time localized
6. MemberPackagesPage → expiry date localized
7. TrainerHomePage → announcement date localized
8. TrainerBadgesPage → earned date localized
9. StaffPaymentsPage → slip date localized
10. TrainerProfilePage → เห็น Language + Theme toggle
11. MemberProfilePage → เห็น Language + Theme toggle
12. เปลี่ยนภาษา TH↔EN → วันที่เปลี่ยนตาม
13. ทุกหน้าที่ไม่ได้แก้ → ยังทำงานเหมือนเดิม

