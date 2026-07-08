## เพิ่มระบบให้คะแนนสมาชิกที่ส่ง Support Ticket

### สิ่งที่จะทำ

**1. หน้า Public Support (`/support`)**
- เพิ่มตัวสลับภาษา (TH/EN) ที่มุมขวาบน — default เป็นภาษาไทย (ตาม LanguageContext ที่มีอยู่แล้ว)
- เพิ่มข้อความ hint ใต้ช่อง "เบอร์โทร":  
  *"📱 ใส่เบอร์ที่ใช้สมัครสมาชิก รับ +10 XP และ +5 Coin (สูงสุด 1 ครั้ง / 2 สัปดาห์)"*
- หลัง submit สำเร็จ ถ้าได้รับคะแนน แสดงข้อความยืนยันในหน้า success (เช่น "ได้รับ +10 XP, +5 Coin แล้ว!")

**2. Backend — จับคู่เบอร์กับสมาชิก + ให้คะแนน**
- แก้ trigger/logic หลัง insert `support_tickets`: ถ้า `phone` ตรงกับ `members.phone` (normalize เบอร์) → ผูก `member_id` เข้ากับ ticket และ fire gamification event
- สร้าง gamification rule ใหม่: `action_key = 'support_ticket_submit'`, XP=10, Coin=5, cap 1 ครั้ง / 14 วัน (ผ่าน `cooldown_minutes = 20160`)
- Idempotency key: `support:{ticket_id}` — cap 14 วันบังคับด้วย cooldown ใน `gamification_rules` (edge function เช็คอยู่แล้ว)

**3. Response ให้ frontend ทราบว่าได้คะแนนหรือไม่**
- หลัง insert ticket, frontend query `members` เพื่อดูว่าเบอร์นี้ match member ไหม (ถ้า match ก็ยิง edge function `gamification-process-event` จากฝั่ง client ผ่าน RPC สาธารณะ หรือ)
- **ทางที่ปลอดภัยกว่า:** สร้าง edge function ใหม่ `submit-support-ticket` ที่:
  1. รับ payload, insert ticket
  2. ถ้าเบอร์ match member → set `member_id`, ยิง gamification event
  3. return `{ ticket_no, points_awarded: {xp, coin} | null }`
- Frontend เรียก edge function นี้แทน `supabase.from('support_tickets').insert()`

### รายละเอียดทางเทคนิค

**Migration:**
```sql
INSERT INTO gamification_rules (action_key, xp_amount, coin_amount, sp_amount, 
  cooldown_minutes, daily_cap, is_active, description)
VALUES ('support_ticket_submit', 10, 5, 0, 20160, 1, true, 
  'Feedback/complaint from verified member (max 1 per 2 weeks)');
```

**Edge function `submit-support-ticket`:**
- CORS: admin.moom.fit, member.moom.fit, moom.lovable.app
- ใช้ service role เพื่อ (a) insert ticket, (b) lookup member by phone (normalize: strip non-digits), (c) invoke gamification-process-event
- Response envelope: `{ data: { ticket_no, points_awarded }, error: null }`

**Frontend `PublicSupportPage.tsx`:**
- แทนที่ `supabase.from('support_tickets').insert()` ด้วย `supabase.functions.invoke('submit-support-ticket')`
- เพิ่ม language toggle button (ปุ่มเล็กมุมขวาบน) เรียก `setLanguage('en' | 'th')`
- แสดง `points_awarded` ใน success screen ถ้ามี

**i18n keys ใหม่ (EN + TH):**
- `support.public.phoneRewardHint`
- `support.public.pointsAwarded` (with `{xp}`, `{coin}` interpolation)
- `support.public.langToggle`

### สิ่งที่ต้องรักษาไว้
- LanguageContext default = 'th' อยู่แล้ว ✓
- ไม่แตะ RLS ของ `support_tickets`
- ไม่เปลี่ยน schema ของ `support_tickets` (member_id column มีอยู่แล้วหรือไม่ — ต้องเช็คใน exploration ก่อน implement)
- ระบบ throttle 60 วินาที ฝั่ง client ยังคงอยู่

### Regression checklist
- ผู้ใช้ไม่ใช่สมาชิก / ไม่ใส่เบอร์ → ส่ง ticket ได้ตามปกติ ไม่มีคะแนน
- สมาชิกส่ง ticket ครั้งที่ 2 ภายใน 14 วัน → ได้ ticket แต่ไม่ได้คะแนน (cooldown จับ)
- Anonymous submit → ไม่ผูก member_id ไม่ได้คะแนน
- Admin inbox / detail page แสดง ticket ปกติ (ถ้ามี member_id ควรแสดงชื่อสมาชิกด้วย — optional enhancement)

### คำถามก่อน implement
1. คอลัมน์ `member_id` ใน `support_tickets` มีอยู่แล้วหรือไม่? (ต้องเช็คตอน build mode) ถ้าไม่มีจะเพิ่มใน migration เดียวกัน
2. ต้องการให้ admin inbox แสดงป้าย "Member" เมื่อ ticket ผูกกับสมาชิกไหม? (แนะนำให้แสดง แต่ optional)
