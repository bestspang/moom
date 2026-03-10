

# Feature Recommendations — Startup Founder Perspective

หลังจากสำรวจ codebase ทั้งหมดแล้ว นี่คือ 5 features ที่จะ **สร้าง impact สูงสุด** ต่อ retention, revenue, และ user satisfaction — เรียงตาม ROI (ผลลัพธ์ต่อความซับซ้อน):

---

## 1. ⭐ Class Rating & Feedback (ง่ายสุด, impact สูงสุด)

**ทำไม:** ทุก successful fitness app มี rating system — มันสร้าง feedback loop ระหว่าง member กับ trainer โดยตรง ทำให้ trainer ปรับปรุงคลาส และ owner เห็น quality metrics แบบ real-time

**ทำอะไร:**
- หลัง check-in คลาสเสร็จ → แสดง bottom sheet ให้ rate 1-5 ดาว + optional comment
- Trainer เห็น average rating ใน Impact page
- Admin เห็น class quality report

**ง่ายแค่ไหน:** 1 table ใหม่ (`class_ratings`), 1 component ใหม่, update 2-3 pages — ไม่มี external dependency

---

## 2. 📊 Member Journey / Personal Stats Dashboard

**ทำไม:** Members ที่เห็น progress ของตัวเอง → กลับมาใช้งานมากขึ้น 3x (industry benchmark) ตอนนี้ member home มี momentum card แต่ไม่มี "your journey over time"

**ทำอะไร:**
- หน้า "My Stats" ใน member profile:
  - Total check-ins (with monthly chart)
  - Longest streak ever vs current
  - Favorite class / trainer
  - XP growth curve
- ใช้ data ที่มีอยู่แล้ว (`member_attendance`, `class_bookings`, `member_gamification_profiles`) — ไม่ต้องสร้าง table ใหม่

**ง่ายแค่ไหน:** 1 RPC + 1 page ใหม่ — pure read, zero risk

---

## 3. 🔔 Waitlist Auto-Promotion + Notification

**ทำไม:** `class_waitlist` table มีอยู่แล้วแต่ยังไม่มี flow ที่ทำงานจริง — เมื่อคนยกเลิก booking → slot ว่าง → คนใน waitlist ควรได้รับ notification อัตโนมัติ

**ทำอะไร:**
- DB trigger: เมื่อ booking ถูก cancel → promote waitlist #1 → insert notification
- Member เห็น "You've been promoted from waitlist!" ใน notification page
- ทำให้ class เต็มตลอด → revenue ดีขึ้น

**ง่ายแค่ไหน:** 1 DB function/trigger + update notification UI ที่มีอยู่แล้ว

---

## 4. 🏋️ Member Workout Log (Sticky Feature)

**ทำไม:** นี่คือ feature ที่ทำให้คน "เปิด app ทุกวัน" — log น้ำหนัก, reps, sets หลังเทรน มี workout templates จาก trainer อยู่แล้ว แต่ member ยังไม่สามารถ log ได้

**ทำอะไร:**
- Member เลือก workout template → log sets/reps/weight
- ดู history ของตัวเอง: "Bench Press: 40kg → 60kg ใน 3 เดือน"
- Trainer เห็น member progress ใน roster page

**ง่ายแค่ไหน:** 1 table ใหม่ (`member_workout_logs`), 2 pages ใหม่ — moderate effort แต่ sticky สุดๆ

---

## 5. 📅 Trainer Availability / Schedule Preferences

**ทำไม:** ตอนนี้ trainer schedule เป็น read-only — trainer ดูได้แต่ไม่สามารถ set "วันไหนว่าง" ได้ Admin ต้อง manage ทุกอย่าง → bottleneck

**ทำอะไร:**
- Trainer set availability slots (e.g., "จันทร์-ศุกร์ 09:00-17:00")
- Admin เห็น trainer availability ตอนสร้าง schedule → ลด scheduling conflicts
- Simple weekly grid UI

**ง่ายแค่ไหน:** 1 table ใหม่, 1 page ใหม่ — independent feature, ไม่กระทบ existing flow

---

## Recommended Order

```text
Priority  Feature                    Effort   Impact   Revenue
───────── ────────────────────────── ──────── ──────── ────────
  1       Class Rating & Feedback    Low      ★★★★★   Indirect
  2       Personal Stats Dashboard   Low      ★★★★☆   Retention
  3       Waitlist Auto-Promotion    Medium   ★★★★★   Direct
  4       Member Workout Log         Medium   ★★★★★   Retention
  5       Trainer Availability       Medium   ★★★☆☆   Efficiency
```

ทั้ง 5 features นี้ใช้ data และ infrastructure ที่มีอยู่แล้วเป็นหลัก — ไม่ต้อง external API, ไม่ต้อง 3rd-party service

**เลือก feature ที่อยากเริ่มก่อนได้เลยครับ** — หรือจะให้ทำทั้ง 5 ตามลำดับก็ได้

