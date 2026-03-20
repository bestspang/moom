

# สถานะ: โค้ดอัปเดตแล้ว แต่ Preview อาจยังโหลดเวอร์ชันเก่า

## สิ่งที่ตรวจพบ

ไฟล์ `src/apps/member/pages/MemberCheckInPage.tsx` **มีโค้ดใหม่แล้ว** — 3-zone layout (กล้อง + QR + code input) ครบถ้วน 372 บรรทัด ไม่มีโค้ดเดิมที่มีปุ่มส้มกลมใหญ่เหลืออยู่เลย

Screenshot ที่เห็น (ปุ่มส้ม "เช็คอิน" + "Tap the button above to check in for today") **ไม่ตรงกับโค้ดปัจจุบัน** — เป็น UI เดิมที่ถูกแทนที่ไปแล้ว

### สาเหตุที่เป็นไปได้
1. **Build ยังไม่เสร็จ** — การเปลี่ยนแปลงครั้งก่อนอาจยังอยู่ระหว่าง build/deploy
2. **Browser cache** — Preview ยังแสดงเวอร์ชันเก่าจาก cache
3. **Build error ซ่อนอยู่** — อาจมี TypeScript/import error ที่ทำให้ build ล้มเหลวเงียบๆ แล้ว Vite serve เวอร์ชันเก่า

## แผนแก้ไข

| # | สิ่งที่ทำ |
|---|----------|
| 1 | ตรวจ build error โดย force-refresh preview (Cmd+Shift+R / hard reload) |
| 2 | หากยังเหมือนเดิม — เปิด Console ดู error ที่อาจเกี่ยวกับ `html5-qrcode` หรือ `qrcode.react` import |
| 3 | หากมี build error → แก้ไขให้ compile ผ่าน |
| 4 | หากไม่มี error → force re-save ไฟล์ (touch file) เพื่อ trigger rebuild |

### ถ้า Build ผ่านแล้ว สิ่งที่จะเห็น:
- **ด้านบน**: Camera icon + "Tap to scan QR" (ไม่ใช่ปุ่มส้มกลม)
- **กลาง**: QR Code ของสมาชิก + countdown 30 วินาที
- **ด้านล่าง**: ช่องกรอก code + ปุ่ม send

ผมจะ **re-save ไฟล์** (เขียนทับด้วยเนื้อหาเดิม) เพื่อ trigger build ใหม่ และตรวจว่า compile ผ่านไหม

