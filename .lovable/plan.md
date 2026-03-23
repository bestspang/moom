

# วิเคราะห์ปัญหาและแผนแก้ถาวร

## ปัญหาที่ 1: Preview ไม่แสดงหน้า Check-In ใหม่
**สาเหตุ**: Preview อยู่ที่ route `/` (Admin Dashboard) ไม่ใช่ `/member/check-in` — เป็นเรื่อง surface detection ที่ default เป็น admin ใน preview environment เสมอ หน้า published ใช้งานได้ปกติแล้ว ดังนั้น **โค้ดถูกต้อง ไม่มีบั๊ก** แค่ preview แสดง admin route

## ปัญหาที่ 2: ปุ่ม "Scan QR" ถูกซ่อนใต้จอ ต้องเลื่อน
**สาเหตุ**: Layout ใช้ `min-h-[calc(100dvh-4rem)]` ซึ่งคิดแค่ header 56px แต่จริงๆ มี bottom nav อีก 80px (`pb-20` ใน MemberLayout) รวมหักไป 136px แถม QR 200px + padding ทำให้เนื้อหารวมสูงเกิน viewport

## แผนแก้

### 1. `src/apps/member/pages/MemberCheckInPage.tsx`
ทำให้หน้าพอดีจอ ไม่ต้องเลื่อน:

- เปลี่ยน container เป็น `h-[calc(100dvh-8.5rem)] overflow-hidden` (หัก header 56px + bottom nav 80px = 136px ≈ 8.5rem)
- ลด QR size จาก 200px เป็น 160px
- ลด padding รอบๆ ให้กระชับขึ้น: header `pt-3 pb-1`, QR section `pt-1 pb-2`, code input `py-2`
- ลบ spacer `flex-1 min-h-4` เพราะไม่จำเป็นเมื่อใช้ fixed height
- ปุ่ม Scan CTA ใช้ `mt-auto` ให้ดันลงล่างสุดของพื้นที่ที่เหลือ แต่ยังเห็นได้โดยไม่ต้องเลื่อน

### ไฟล์ที่แก้

| # | ไฟล์ | การเปลี่ยนแปลง |
|---|------|----------------|
| 1 | `src/apps/member/pages/MemberCheckInPage.tsx` | ปรับ container height, ลด QR size, กระชับ spacing, ลบ spacer |

### สิ่งที่ไม่เปลี่ยน
- Logic ทั้งหมด (camera, validation, gamification)
- MemberLayout, MemberBottomNav
- i18n keys
- Backend

### ผลลัพธ์
หน้า Check-In แสดงครบทั้ง 3 โซนในจอเดียว ไม่ต้องเลื่อน ปุ่ม Scan อยู่ในระยะนิ้วโป้ง

