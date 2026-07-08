## ปัญหา
`moom.fit/support` ขึ้น 404 เพราะโดเมน `moom.fit` (apex) ไม่ได้ชี้มาที่แอป Lovable นี้เลย — โดเมนที่ผูกไว้จริงมีแค่:
- `admin.moom.fit` (Admin surface)
- `member.moom.fit` (Member/Trainer/Staff surface)
- `moom.lovable.app` (published)

ตัวโค้ด route `/support` ถูกสร้างและทำงานอยู่แล้ว ทดสอบได้ที่:
- https://moom.lovable.app/support
- https://member.moom.fit/support
- https://admin.moom.fit/support

## ทางเลือกในการแก้ (ขอให้เลือก)

**A. ใช้ subdomain ที่มีอยู่แล้ว (แนะนำ, ไม่ต้องตั้งค่า DNS)**
เปลี่ยนลิงก์ที่จะแจกลูกค้าเป็น `member.moom.fit/support` — พร้อมใช้งานทันที ไม่ต้องทำอะไรเพิ่ม

**B. เพิ่ม apex domain `moom.fit` เป็น custom domain ของโปรเจกต์นี้**
- ต้องไปตั้งค่าใน Lovable → Project → Domains เพิ่ม `moom.fit`
- แก้ DNS ที่ผู้ให้บริการโดเมน (A/ALIAS record ตามที่ Lovable แจ้ง)
- หลังผูกเสร็จ ผมจะอัปเดต `src/apps/shared/hostname.ts` ให้รู้จัก apex host และ route `/support` จะถูกจับโดย SPA fallback อัตโนมัติ
- ข้อควรระวัง: apex `moom.fit` ปัจจุบันอาจถูกใช้เป็นเว็บ marketing/landing อื่นอยู่ ถ้าย้ายมาที่แอปนี้จะทับของเดิม — ต้องยืนยันก่อน

**C. ทำ redirect ฝั่ง DNS/hosting ของ `moom.fit` เดิม**
ถ้า `moom.fit` เป็นเว็บอื่น ให้เจ้าของเว็บนั้นตั้ง redirect `/support` → `https://member.moom.fit/support` แทน (งานนี้อยู่นอกโปรเจกต์ Lovable)

## สิ่งที่ผมจะทำในโค้ด
- **ถ้าเลือก A:** ไม่ต้องแก้โค้ด — แค่แจ้งลิงก์ที่ถูกต้อง
- **ถ้าเลือก B:** เพิ่ม `moom.fit` (และ `www.moom.fit` ถ้าต้องการ) ลง host map ใน `src/apps/shared/hostname.ts` เพื่อให้ surface detection รู้จัก และตรวจว่า `/support` อยู่ใน shared route list อยู่แล้ว
- **ถ้าเลือก C:** ไม่ต้องแก้โค้ด

กรุณาเลือก A / B / C ครับ (ค่าเริ่มต้นที่ผมแนะนำคือ A เพราะพร้อมใช้ทันที)