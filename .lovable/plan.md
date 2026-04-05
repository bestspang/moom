

# Phase 5: Form Pages Header Consistency

## สิ่งที่เสร็จแล้ว ✅
- Phase 1: Critical fixes (i18n, fake buttons, spacing, dead code)
- Phase 2: Member Packages (icons, progress bar, urgency colors)
- Phase 3: Staff + Trainer polish (recent check-ins, tap hints)
- Phase 4: Detail Pages (MobilePageHeader for class/booking detail)

## สิ่งที่ยังเหลือ — Form pages ยังใช้ inline BackButton

ตรวจทุกหน้าทุก surface แล้ว เหลือแค่ 2 หน้าที่ยังไม่ consistent:

| # | ปัญหา | ไฟล์ |
|---|-------|------|
| 1 | **MemberEditProfilePage** ใช้ inline `ArrowLeft` back button + `pt-4 pb-2` แทน MobilePageHeader | `MemberEditProfilePage.tsx` |
| 2 | **MemberUploadSlipPage** เหมือนกัน — inline `ArrowLeft` + `pt-4 pb-2` | `MemberUploadSlipPage.tsx` |

ทุกหน้าอื่น (Schedule, Bookings, Rewards, Attendance, Notifications, Security, Referral, Coupons, Momentum, Leaderboard, Badge Gallery, Run Club, Squad, Check-In, Trainer ทุกหน้า, Staff ทุกหน้า) ใช้ `MobilePageHeader` แล้ว

### แผนแก้ไข

**5.1 MemberEditProfilePage**
- ลบ inline back button div (`px-4 pt-4 pb-2`)
- เพิ่ม `MobilePageHeader` พร้อม title + back action (เหมือน Pattern ใน Phase 4)

**5.2 MemberUploadSlipPage**
- เหมือนกัน — ลบ inline back button, ใช้ MobilePageHeader
- ย้าย title "Upload Transfer Slip" จาก `<h1>` ภายใน Section ขึ้นไปเป็น MobilePageHeader title

## ไฟล์ที่แก้

| # | ไฟล์ | การเปลี่ยนแปลง |
|---|------|----------------|
| 1 | `src/apps/member/pages/MemberEditProfilePage.tsx` | ลบ inline back button, ใช้ MobilePageHeader |
| 2 | `src/apps/member/pages/MemberUploadSlipPage.tsx` | เหมือนกัน |

## สิ่งที่ไม่เปลี่ยน
- Logic ทั้งหมด (form validation, mutation, file upload)
- Backend / DB / Auth
- i18n keys (ใช้ keys ที่มีอยู่แล้ว)
- หน้าที่แก้ไปใน Phase 1-4

## Smoke Test
1. Edit profile: MobilePageHeader แสดง title + back button
2. Edit profile: กรอกฟอร์ม + save ยังทำงานได้
3. Upload slip: MobilePageHeader แสดง title + back button
4. Upload slip: เลือกไฟล์ + กรอกข้อมูล + submit ยังทำงานได้
5. Dark mode ทั้ง 2 หน้ายังดูดี

