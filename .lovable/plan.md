

# สถานะ: โค้ดถูกต้องแล้ว — ปัญหาคือ Preview Cache

## สิ่งที่ยืนยันได้

1. **โค้ด `MemberCheckInPage.tsx` เป็นเวอร์ชันใหม่ถูกต้อง** — 3 โซน (QR บน, code input กลาง, ปุ่ม scan ล่าง), imports อยู่บนสุด, ไม่มี syntax error
2. **Route ถูกต้อง** — `/member/check-in` ผูกกับ `MemberCheckInPage` ใน `App.tsx`
3. **Published site ใช้งานได้** — คุณเคยยืนยันแล้วว่าเห็นหน้าใหม่บน moom.lovable.app
4. **ตอนนี้คุณอยู่ที่ route `/`** (Admin Dashboard) ในหน้า Preview — ไม่ใช่หน้า member check-in

## ต้นตอ

Preview environment มี Vite HMR cache ที่ยังเก็บ bundle เก่า สำหรับ member routes โดยเฉพาะ ทำให้แม้โค้ดถูกแก้แล้ว preview ยังเสิร์ฟเวอร์ชันเก่า

## แผนแก้ไข

### 1. Force rebuild โดยแตะ import chain ของ member routes
เพิ่ม comment ที่มี timestamp ใน `App.tsx` บรรทัดที่ import `MemberCheckInPage` เพื่อบังคับให้ Vite invalidate module cache ของ route นี้:

```typescript
// force-rebuild: 2026-03-23T09
import MemberCheckInPage from "@/apps/member/pages/MemberCheckInPage";
```

### 2. เพิ่ม version marker ชั่วคราว (อีกครั้ง) เพื่อยืนยัน
ใส่ `data-version="v3"` attribute ที่ root div ของ `MemberCheckInPage` — ไม่แสดงผลใน UI แต่ตรวจสอบได้จาก DevTools

### ไฟล์ที่แก้

| # | ไฟล์ | การเปลี่ยนแปลง |
|---|------|----------------|
| 1 | `src/App.tsx` | เพิ่ม comment timestamp ที่ import line |
| 2 | `src/apps/member/pages/MemberCheckInPage.tsx` | เพิ่ม `data-version` attribute |

### หลังแก้แล้ว
- เปิด Preview ไปที่ `/member/check-in`
- ถ้าเห็น UI ใหม่ (QR บน, ปุ่ม scan ล่าง) = สำเร็จ
- ถ้ายังเหมือนเดิม = ต้อง hard refresh preview (Cmd+Shift+R)

