

# แก้ Celebration ไม่บัง QR Code

## ปัญหา
Celebration overlay ใช้ `absolute inset-0 z-50 bg-background/95` ปิดทับทั้งหน้าจอ ทำให้คนอื่นสแกน QR ไม่ได้

## แก้ไข: `src/pages/CheckinDisplay.tsx`
- เปลี่ยน celebration จาก full-screen overlay เป็น **banner ด้านบน** ของ QR code
- ใช้ fixed top banner แสดงชื่อสมาชิก + ไอคอน ✓ โดย QR code ยังคงมองเห็นได้ตลอด
- แสดง 3 วินาทีแล้วหายไปเหมือนเดิม

### Before (lines 311-316)
```jsx
<div className="absolute inset-0 z-50 flex ... bg-background/95">
  // full screen overlay blocking QR
</div>
```

### After
```jsx
<div className="absolute top-0 left-0 right-0 z-50 p-4 bg-green-500 text-white text-center animate-in slide-in-from-top duration-300">
  <div className="flex items-center justify-center gap-2">
    <CheckCircle2 className="h-6 w-6" />
    <span className="text-lg font-bold">Check-in สำเร็จ! — {celebration.memberName}</span>
  </div>
</div>
```

QR code จะแสดงตลอดเวลา ไม่มีอะไรบัง

