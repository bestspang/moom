
# แผนแก้ปัญหา: กดปุ่ม Check-In แล้ว runtime ยังขึ้นหน้าเดิม

## สิ่งที่ยืนยันได้จากโค้ดตอนนี้
- ปุ่มล่างของ member app ชี้ไปที่ `/member/check-in` ถูกต้อง (`MemberBottomNav.tsx`)
- route `/member/check-in` ผูกกับ `MemberCheckInPage` ถูกต้อง (`App.tsx`)
- ไฟล์ `MemberCheckInPage.tsx` ปัจจุบันเป็นเวอร์ชันใหม่ 3 โซนแล้วจริง
- ข้อความเก่าแบบ “Tap the button above to check in for today” ไม่มีอยู่ในโค้ดที่ถูกค้นเจอแล้ว
- ผู้ใช้ยืนยันว่ากดจากหน้า `/member` จริง

## ข้อสรุปเบื้องต้น
ดังนั้นปัญหาหลัก **ไม่น่าใช่ navigation path ผิด** แต่เป็นว่า **runtime ที่แสดงอยู่ยังไม่ได้ render โมดูล `MemberCheckInPage` เวอร์ชันปัจจุบันจริง**  
สาเหตุที่เป็นไปได้มากที่สุดมี 2 กลุ่ม:

1. **Preview/build cache mismatch**
   - source code เปลี่ยนแล้ว แต่ bundle ที่ preview เสิร์ฟยังเป็นของเก่า

2. **มี runtime branch/redirect ที่ยังพาไปหน้า check-in เก่า**
   - แม้ route หลักดูถูกต้อง แต่ยังอาจมีเงื่อนไข runtime หรือ component tree อื่นที่แทรกหน้าเดิม

## แนวทางที่ควรทำ
### 1) ใส่ “runtime fingerprint” ที่มองเห็นชัดใน `MemberCheckInPage`
เพิ่ม marker ชั่วคราวที่ไม่มีทางสับสน เช่น:
- badge บนหน้า: `CHECKIN_V3`
- แสดง pathname ปัจจุบันแบบ dev-only
- log `console.info('[MemberCheckInPage] mounted v3')`

เป้าหมาย:
- แยกให้ชัดว่า runtime render หน้าใหม่จริงหรือไม่
- ถ้ายังไม่เห็น marker แปลว่าไม่ได้เข้า component นี้จริง

### 2) ใส่ fingerprint ที่ `MemberBottomNav` ตอนกดปุ่มกลาง
เพิ่ม log ชั่วคราวก่อน/หลัง navigation เช่น:
- current pathname
- target pathname `/member/check-in`

เป้าหมาย:
- ยืนยันว่าการกดปุ่มสีส้มวิ่งไป route ไหนจริง
- ตัดประเด็นว่า `<Link>` พาไปผิดหน้าหรือถูก overlay/intercept

### 3) ใส่ fingerprint ระดับ route ใน `App.tsx`
ห่อ element ของ `/member/check-in` ด้วย wrapper ชั่วคราวที่ log ตอน render เช่น:
```text
/member/check-in route matched
```
เป้าหมาย:
- แยกให้ได้ว่า “route match แล้ว แต่ component เก่าโผล่” หรือ “route ยังไม่ match ตามที่คิด”

### 4) ตรวจและตัด runtime redirect/guard ที่อาจพาออกจากหน้า
ทบทวนอีกครั้งเฉพาะ flow นี้:
- `MemberLayout`
- `SurfaceGuard`
- auth loading/redirect
- any `Navigate` ที่อาจเกิดหลัง route match

แม้ตอนนี้โค้ดดูไม่น่าพาไปหน้าเก่าแล้ว แต่ควรยืนยันด้วย marker เพื่อปิดเคสนี้

### 5) ถ้าพิสูจน์แล้วว่า route ถูก แต่ยังได้ UI เก่า → แก้ที่ preview invalidation
ถ้า marker ไม่ขึ้นทั้งที่ source ถูก:
- กระตุ้น rebuild จาก dependency chain ที่ route ใช้จริง เช่น `App.tsx` หรือ import path ที่เกี่ยวข้อง
- เปลี่ยน import graph เล็กน้อยเพื่อบังคับให้ bundle route นี้ถูกสร้างใหม่
- ถ้าจำเป็น เพิ่ม version constant ในไฟล์ route/page เพื่อทำให้ chunk เปลี่ยนแน่นอน

นี่จะปลอดภัยกว่าการเดาสุ่มแก้ UI เพิ่ม เพราะตอนนี้ปัญหาอยู่ที่ “runtime ไหนถูก render” มากกว่า “หน้าตาในไฟล์”

## ลำดับ implementation ที่แนะนำ
1. เพิ่ม visible marker ใน `MemberCheckInPage`
2. เพิ่ม console marker ใน `MemberBottomNav`
3. เพิ่ม route marker ใน `App.tsx`
4. ตรวจผลจาก preview ว่าเห็น marker ไหนบ้าง
5. ถ้า route ใหม่ไม่ถูก renderจริง → บังคับ invalidation/rebuild ของ route chunk
6. เมื่อ runtime ตรงแล้ว ค่อยลบ marker debug ออก

## ผลลัพธ์ที่คาดหวัง
หลังทำรอบนี้ เราจะตอบได้แบบชัดเจนว่า:
- ปุ่มสีส้มล่างพาไป `/member/check-in` จริงหรือไม่
- runtime render `MemberCheckInPage` เวอร์ชันใหม่จริงหรือไม่
- ถ้ายังไม่ใช่ เป็นปัญหา redirect logic หรือ preview bundle cache กันแน่

## Technical details
```text
/member
  └─ tap bottom check-in
      └─ should navigate to /member/check-in
          └─ App route should mount MemberCheckInPage
              └─ page should show CHECKIN_V3 marker
```

ถ้า chain นี้ขาดตรงไหน เราจะแก้ตรงนั้นโดยตรง แทนการเดาว่าเป็นปัญหา UI อย่างเดียว
