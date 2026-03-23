

# Cleanup: ลบ Debug Markers ออกจาก Check-In Page

หน้า CHECKIN_V3 ทำงานถูกต้องแล้ว — ต้องลบ debug elements ออก

## Changes

### 1. `src/apps/member/pages/MemberCheckInPage.tsx`
- ลบแถบแดง `CHECKIN_V3` debug banner (div with `bg-destructive`)
- ลบ `console.info` module loaded log
- ลบ `console.info` component mounted log
- เก็บ `CHECKIN_VERSION` constant ไว้เป็น comment เฉยๆ หรือลบออก

### 2. `src/apps/member/components/MemberBottomNav.tsx`
- ลบ `console.info` debug log ใน `handleNavClick`

ไม่มีการเปลี่ยน logic — แค่ลบ debug code ชั่วคราว

