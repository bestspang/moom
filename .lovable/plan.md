
# ต้นตอที่แท้จริงของปัญหา: ตอนนี้คุณยังไม่ได้อยู่บน “member surface” จริงตอน runtime

## สิ่งที่ผมตรวจเจอจากโค้ด + runtime
1. โค้ด `MemberCheckInPage.tsx` ปัจจุบันเป็นเวอร์ชันใหม่แล้วจริง  
   - มี 3 โซน: กล้อง / QR ของสมาชิก / ช่องกรอก code
   - ไม่มี UI เก่าแบบปุ่มส้มใหญ่ในไฟล์นี้แล้ว

2. แต่ตอนผมเปิด `/member/check-in` ที่ runtime จริง ระบบพาไปหน้า **MOOM Admin Login** แทน  
   - แปลว่า runtime ตอนนี้ **ไม่ได้ render หน้า check-in ของ member**
   - จึงต่อให้แก้ `MemberCheckInPage.tsx` ดีแค่ไหน ผู้ใช้ก็ยังไม่เห็น

3. ต้นตอหลักอยู่ที่ flow ของ “surface detection + shared login route”
   - `detectSurface()` ใน `src/apps/shared/hostname.ts`
   - บน preview/dev (`*.lovable.app`, `*.lovableproject.com`) จะ **default เป็น `admin`**
   - route `/login` เป็น shared route
   - หน้า `Login.tsx` ตัดสินใจโชว์ `AdminLogin` หรือ `MemberLogin` จาก `detectSurface()`
   - ดังนั้นถ้าหลุด auth จาก `/member/check-in` แล้วถูกส่งไป `/login` บน preview  
     ระบบจะโชว์ **AdminLogin** โดยอัตโนมัติ แม้จริงๆ ผู้ใช้มาจาก member flow

## สรุปปัญหาแบบตรงที่สุด
ปัญหาไม่ใช่แค่ “หน้าเช็คอินไม่อัปเดต” แต่คือ:

```text
แตะเมนู Check-In
→ ควรเข้า /member/check-in
→ แต่ session/member flow ไม่พร้อม หรือ refresh/direct open
→ ถูก redirect ไป /login
→ /login บน preview ตีความ surface = admin
→ แสดงหน้า Admin Login
→ ผู้ใช้ไม่เคยเห็น MemberCheckInPage เวอร์ชันใหม่จริง
```

## ทำไมก่อนหน้านี้เลยดูเหมือน “ทุกอย่างเหมือนเดิม”
มี 2 ชั้นของปัญหาซ้อนกัน:

### A. ชั้น route/auth
บางครั้งคุณไม่ได้ render หน้า member check-in จริง แต่โดนเด้งไป login/admin flow แทน

### B. ชั้น perception/UI
ข้อความเก่าใน i18n เช่น `tapToCheckIn`, `readyToCheckIn`, `scanQrHint` ยังอยู่ใน locale files  
แม้ตอนนี้ไม่ได้ถูกเรียกใช้จาก `MemberCheckInPage.tsx` แล้ว แต่ทำให้การไล่ปัญหาดูสับสน และอาจยังมีหน้าหรือคอมโพเนนต์อื่นใช้ copy เก่าอยู่ภายหลัง

## แผนแก้ที่ถูกต้อง
ผมแนะนำแก้เป็น 3 ส่วนเรียงลำดับนี้

### 1) แก้ shared login ให้ respect “from route” ก่อน detect surface
**ไฟล์:** `src/pages/Auth/Login.tsx`

ตอนนี้หน้า login ใช้ `detectSurface()` เป็นหลัก  
แต่กรณีผู้ใช้ถูกส่งมาจาก `/member/...` ควรถือว่าเป็น member flow ทันที

แนวทาง:
- อ่าน `location.state.from.pathname`
- ถ้า `from` เริ่มด้วย `/member` ให้ render `MemberLogin`
- ถ้า `from` เริ่มด้วย `/trainer` หรือ `/staff` ก็ใช้ member-style auth surface เดียวกัน
- ค่อย fallback ไป `detectSurface()` เฉพาะกรณีไม่มี `from`

ผลลัพธ์:
- ต่อให้ preview default เป็น admin
- ถ้าผู้ใช้มาจาก `/member/check-in`
- login ก็ยังต้องเป็น **MemberLogin** ไม่ใช่ AdminLogin

### 2) บังคับคง member surface ใน preview/dev ให้เสถียรกว่าเดิม
**ไฟล์:** `src/apps/shared/hostname.ts`

ตอนนี้ dev default = admin ทำให้ member flow เปราะมากใน preview

แนวทางที่ควรทำ:
- ถ้า path เริ่มด้วย `/member` ให้ `detectSurface()` คืน `member` ทันทีใน dev/preview
- ถ้า path เริ่มด้วย `/trainer` คืน `trainer`
- ถ้า path เริ่มด้วย `/staff` คืน `staff`
- ค่อย default เป็น admin เฉพาะ route กลุ่ม admin จริงๆ

ผลลัพธ์:
- refresh ที่ `/member/...` จะยังถูกมองเป็น member surface
- `/login` ที่มาจาก member journey จะไม่หลุดไป admin branding ง่ายๆ

### 3) เก็บกวาด copy/keys เก่าที่ทำให้หลอนว่าหน้าเดิมยังอยู่
**ไฟล์:** `src/i18n/locales/en.ts`, `src/i18n/locales/th.ts`

ลบหรือเลิกใช้ข้อความเก่าที่เป็น flow แบบเดิม เช่น:
- `readyToCheckIn`
- `tapToCheckIn`
- `scanQrHint`
- `scanQr`
- `orTypeCode`
- `memberCodePlaceholder`
- `checkInEarnXp`
- `checkingIn`  
ถ้าไม่ได้ใช้แล้วจริง

ผลลัพธ์:
- ลดความสับสนระหว่าง UI ใหม่กับ copy เก่า
- ง่ายต่อการ QA ว่าหน้าใหม่ถูกใช้งานจริง

## หลังแก้แล้ว flow ที่ควรเป็น
```text
ผู้ใช้อยู่ใน member app
→ แตะ bottom nav Check-In
→ เข้า /member/check-in
→ ถ้ายังไม่ auth:
   redirect ไป /login พร้อม state.from=/member/check-in
→ Login page render แบบ MemberLogin
→ หลัง login กลับมาที่ /member/check-in
→ เห็นหน้าใหม่ 3 โซนจริง
```

## ลำดับ implementation ที่ผมแนะนำ
1. แก้ `Login.tsx` ให้ใช้ `location.state.from` เป็นตัวตัดสิน surface ก่อน
2. แก้ `detectSurface()` ให้ path-based ใน dev/preview
3. ทดสอบ refresh ที่ `/member`
4. ทดสอบ direct open `/member/check-in`
5. ทดสอบกรณี not logged in → login → กลับมาหน้าเดิม
6. เก็บกวาด i18n keys เก่า

## ความเสี่ยง
ต่ำและคุมได้ เพราะเป็นการแก้ที่ logic routing/auth display เป็นหลัก  
ไม่ต้องแตะ backend และไม่ต้องเปลี่ยน route structure หลัก

## ผลที่คาดหวัง
หลังแก้ คุณจะไม่เจออาการ “แก้หน้า check-in แล้วแต่ยังเห็นเหมือนเดิม” อีก เพราะระบบจะพาไป render member flow ที่ถูกต้องจริง ไม่หลุดไป admin surface/runtime คนละชุดกับหน้าที่เราแก้

## จุดที่น่าจะเป็นต้นตอที่สุด
ถ้าต้องชี้ “ตัวการหลักสุด” เพียงจุดเดียว ผมชี้ที่นี่:
- `src/apps/shared/hostname.ts` → `detectSurface()` default admin ใน preview/dev
ร่วมกับ
- `src/pages/Auth/Login.tsx` → เลือกหน้า login จาก surface ปัจจุบัน มากกว่าจาก route ที่ผู้ใช้ตั้งใจจะไป

2 จุดนี้คือรากของอาการที่คุณเห็น
