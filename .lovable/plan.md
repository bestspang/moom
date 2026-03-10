

# เปลี่ยน QR Refresh เป็นทุก 30 วินาที

แก้ค่า `TOKEN_LIFETIME` ใน `src/pages/CheckinDisplay.tsx` จาก `120` เป็น `30`

### File: `src/pages/CheckinDisplay.tsx`
- **Line 13**: `const TOKEN_LIFETIME = 120;` → `const TOKEN_LIFETIME = 30;`

แค่นี้เลย — countdown ring, auto-refresh logic ทั้งหมดอ้างอิงค่านี้อยู่แล้ว

