## ปัญหา
`/support` ไม่ได้อยู่ใน `SHARED_PREFIXES` ที่ `src/apps/shared/hostname.ts:138` ดังนั้น `getRouteHostAffinity('/support')` return `'admin'` ทำให้ตัว redirect guard ส่งผู้ใช้จาก `member.moom.fit/support` ไป `admin.moom.fit/support` โดยอัตโนมัติ

## แก้
เพิ่ม `'/support'` เข้าไปใน `SHARED_PREFIXES` เพื่อให้เข้าถึงได้จากทุก host (member / admin / lovable.app) โดยไม่ redirect

```ts
const SHARED_PREFIXES = ['/login', '/signup', '/forgot-password', '/reset-password', '/checkin', '/liff', '/support', '/diagnostics/surface', '/diagnostics/auth'];
```

เท่านี้ — ไม่แตะไฟล์อื่น ไม่แตะ auth / RLS / route table

## ผลลัพธ์
- `https://member.moom.fit/support` ✅ ใช้ได้ ไม่ redirect
- `https://admin.moom.fit/support` ✅ ยังใช้ได้
- `https://moom.lovable.app/support` ✅ ยังใช้ได้
- หน้า admin inbox `/support-ticket` ไม่ได้รับผลกระทบ (คนละ path)