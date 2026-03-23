
เป้าหมายคือแก้ “ถาวร” ไม่ใช่แค่บังคับ rebuild ชั่วคราวอีกครั้ง

## สิ่งที่ผมตรวจเจอจากโค้ด
- `src/App.tsx` route `/member/check-in` ชี้ไป `MemberCheckInPage` ถูกแล้ว
- `MemberBottomNav.tsx` ปุ่มเช็คอินก็ลิงก์ไป `/member/check-in` ถูกแล้ว
- `src/apps/shared/hostname.ts` ตอนนี้แก้ดีขึ้นแล้ว: ถ้า path ขึ้นต้นด้วย `/member` จะ detect เป็น member
- `src/pages/Auth/Login.tsx` ก็มี fallback จาก `location.state.from` แล้ว
- `src/apps/member/pages/MemberCheckInPage.tsx` เป็นหน้าใหม่จริง และยังมี `data-version="v3"` ค้างอยู่

ดังนั้นปัญหาหลักตอนนี้ไม่ใช่ route logic เดิมที่เคยสงสัย แต่เป็นว่า “หน้า published ที่ผู้ใช้เห็น” ยังไม่ได้ใช้ build ชุดที่มี redesign อย่างเสถียร หรือผู้ใช้ยังไม่มีตัวบอกชัดว่าหน้าไหนคือ runtime จริง

## ต้นตอที่น่าจะแท้จริง
มี 2 จุดที่ควรแก้ถาวร:

1. **Frontend publish drift**
   - หน้า preview / code เปลี่ยนแล้ว
   - แต่หน้า published อาจยังไม่ได้อัปเดต build ล่าสุด
   - การแก้แบบเพิ่ม comment `force-rebuild` ช่วยแค่ preview/HMR ไม่ใช่วิธีถาวรสำหรับ production

2. **หน้า check-in ไม่มี identity ที่ชัดเจนใน UX**
   - ต่อให้ runtime หลงไปคนละ build หรือคนละหน้า ผู้ใช้แยกไม่ออกทันที
   - ทำให้ทุกครั้งต้อง debug ด้วย marker ชั่วคราว

## แผนแก้ถาวร

### 1) ทำหน้า Check-In ใหม่ให้ “มีเอกลักษณ์ถาวร” แบบไม่ดูเป็น debug
แก้ `src/apps/member/pages/MemberCheckInPage.tsx`

สิ่งที่จะทำ:
- เพิ่ม hero/section title ที่ต่างจากหน้าเก่าอย่างชัดเจน เช่น
  - หัวข้อ: “Check in”
  - subtitle: “Show your QR to staff or scan the gym QR”
- ทำโครงหน้าใหม่ให้ signature ชัด:
  - การ์ด QR ด้านบน
  - divider + code input
  - ปุ่ม CTA ด้านล่างเต็มความกว้าง
- เพิ่ม copy ที่เฉพาะหน้าใหม่ เช่น “Show this to staff”
- เอา `data-version="v3"` ออกหลังยืนยันแล้ว แต่คง visual identity ใหม่ไว้

เหตุผล:
- ถ้าหน้าไหนยังเป็นหน้าเก่า จะเห็นทันทีโดยไม่ต้องใช้ debug marker

### 2) ตัดวิธีแก้แบบ cache-busting comment ออกจาก flow ปกติ
แก้ `src/App.tsx`

สิ่งที่จะทำ:
- ลบ `// force-rebuild: ...`
- ไม่ใช้ comment เพื่อบังคับ HMR เป็นแนวทางหลักอีก

เหตุผล:
- นี่ไม่ใช่วิธีแก้ถาวร
- ถ้าต้องพึ่ง comment แปลว่ากระบวนการ verify/publish ยังไม่ชัดพอ

### 3) ทำ publish-safe verification ให้ชัดเจนในงานทุกครั้ง
ไม่ใช่แก้ logic เพิ่ม แต่เป็นแนว implementation/QA รอบนี้:
- ใช้ถ้อยคำและ layout ที่เห็นแล้วแยกจากหน้าเก่าได้ทันที
- ถ้ามีการ redesign หน้า member สำคัญ ให้มี visual anchor ถาวร
- หลีกเลี่ยงการอาศัย marker ซ่อนอย่างเดียว

### 4) เก็บกวาดข้อความ i18n เก่าที่ทำให้สับสน
แก้ `src/i18n/locales/en.ts` และ `src/i18n/locales/th.ts`

สิ่งที่จะทำ:
- ลบ/เลิกใช้ keys เก่าที่ชวนให้เข้าใจว่าเป็น flow เดิม เช่น
  - `tapToScan`
  - `startingCamera`
  - `myQrCode`
  - คำ copy เก่าที่ไม่อยู่ใน layout ใหม่
- คงไว้เฉพาะชุดคำที่ตรงกับหน้าใหม่จริง

เหตุผล:
- ตอนนี้ search ยังเจอ copy เก่าหลายตัวใน locale
- ถึงไม่ได้ render ทุกตัว แต่ทำให้ maintain/debug สับสน และเสี่ยงมี component อื่นหยิบไปใช้ผิด

### 5) ถ้าต้องแก้ให้ชัดขึ้นอีก: แยก component โครงหน้าใหม่ออกจากไฟล์เก่า
ทางเลือกที่แนะนำถ้าต้องการความเสถียรเพิ่ม:
- แยก UI หลักของ check-in ออกเป็น component ใหม่ เช่น `MemberCheckInV2Layout`
- ให้ `MemberCheckInPage` เป็น container ที่ประกอบ logic + render component ใหม่นี้

เหตุผล:
- ช่วยลดความรู้สึกว่าเป็น “ไฟล์เดิมที่โดนแก้ภายใน”
- เวลา route render ผิด/ถูก จะ trace ง่ายขึ้น
- ดีต่อการ maintain และ QA รอบถัดไป

## ลำดับทำงานที่แนะนำ
1. ปรับ `MemberCheckInPage.tsx` ให้มี visual identity ถาวรและชัดเจน
2. ลบ `force-rebuild` comment ใน `App.tsx`
3. เก็บกวาด i18n keys เก่าที่เกี่ยวกับหน้าเช็คอิน
4. ถ้าต้องการความเสถียรเพิ่ม แยก UI เป็น component ใหม่
5. จากนั้นค่อย publish frontend update เพื่อให้หน้า live ใช้ build ล่าสุดจริง

## ผลลัพธ์ที่คาดหวัง
หลังแก้รอบนี้:
- ไม่ต้องพึ่ง debug marker เพื่อแยกหน้าใหม่/หน้าเก่า
- ไม่ต้องพึ่ง cache-busting comment เป็นวิธีหลัก
- หน้า check-in ใหม่จะมีเอกลักษณ์ชัดเจน ใช้งานง่ายขึ้น และตรวจสอบบน published site ได้ทันที
- ลดโอกาสวนลูป “โค้ดเปลี่ยนแล้วแต่เหมือนเดิม” ในรอบถัดไป

## Technical details
ไฟล์หลักที่ควรแตะ:
- `src/apps/member/pages/MemberCheckInPage.tsx`
- `src/App.tsx`
- `src/i18n/locales/en.ts`
- `src/i18n/locales/th.ts`

แนวคิดสำคัญ:
```text
Permanent fix ≠ force rebuild
Permanent fix = clear runtime identity + cleanup old copy + publish the latest frontend build
```
