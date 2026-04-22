

# 🛡️ Phase 1 — Security Critical (Revised after re-audit)

## Status Re-check (สำคัญ — scope ลดลงครึ่งหนึ่ง)

หลังตรวจ codebase จริงพบว่า **5 จาก 8 ของ Sprint 1 เสร็จไปแล้ว** ระหว่าง Phase 0:

| # | Issue | สถานะจริง |
|---|---|---|
| S1-1 | CRON_SECRET null bypass (`auto-notifications`, `evaluate-tiers-daily`) | ✅ **แก้แล้ว** — มี `cronSecret &&` guard |
| S1-2 | `sync-gamification-config` RBAC | ✅ **แก้แล้ว** — มี `has_min_access_level` |
| S1-3 | `gamification-redeem-reward` TOCTOU | ⚠️ **ยังไม่ atomic** — มี RBAC แต่ไม่มี SELECT FOR UPDATE |
| S1-4 | `gamification-assign-quests` ownership | ✅ **แก้แล้ว** — มี manager check |
| S1-5 | `gamification-issue-coupon` ownership | ✅ **แก้แล้ว** — มี manager check |
| S1-6 | Ghost `profiles` table refs | ✅ **แก้แล้ว** — ไม่มี ref เหลือ |
| S1-7 | `sell-package` non-atomic | ❌ **ยังไม่ทำ** — ต้องสร้าง RPC |
| S1-8 | `approve-slip` + `stripe-webhook` non-atomic | ⚠️ **ครึ่งทาง** — `stripe-webhook` มี `process_stripe_payment` แล้ว, `approve-slip` ยัง |

**เหลือจริง 3 ข้อ:** S1-3, S1-7, S1-8 (approve-slip)

---

## ทำอะไรใน Phase 1

### Fix 1 — `process_redeem_reward` atomic RPC (แก้ S1-3)

**Root cause:** `gamification-redeem-reward` ทำ 6 ขั้นตอน (check balance → check stock → deduct points → decrement stock → insert redemption → log) แบบไม่ atomic → race condition double-spend ได้

**Fix:**
- สร้าง migration `process_redeem_reward(p_member_id, p_reward_id)` RPC ที่:
  - `SELECT ... FOR UPDATE` ทั้ง `member_gamification_profiles` และ `gamification_rewards` (lock rows)
  - Check balance + stock ภายใน transaction
  - Deduct + decrement + insert ในช็อตเดียว
  - Return `{ success, redemption_id }` หรือ error code
- Refactor edge function ให้เรียก RPC แทน 6 queries — เก็บ logic ที่เหลือ (notification, response envelope) ไว้เดิม

### Fix 2 — `process_sell_package` atomic RPC (แก้ S1-7)

**Root cause:** `sell-package` insert `transactions` + `member_packages` + อัปเดต `members` แยกกัน — fail กลางทาง = state inconsistent

**Fix:**
- สร้าง migration `process_sell_package(p_member_id, p_package_id, p_amount, p_payment_method, p_idempotency_key, p_discount_amount, p_processed_by)` ที่ wrap ทุก write ใน 1 transaction พร้อม idempotency check (`SELECT 1 FROM transactions WHERE idempotency_key = ...`)
- Refactor `sell-package/index.ts` เรียก RPC อย่างเดียว, เก็บ CORS + auth check + gamification fire-and-forget event ไว้เดิม

### Fix 3 — `approve-slip` ใช้ RPC (แก้ S1-8 ส่วนที่ยังเหลือ)

**Root cause:** `approve-slip` ทำ insert `transactions` + create `member_packages` + update `transfer_slips.status` แยก — slip approve แล้วแต่ package ไม่ออก = ลูกค้าจ่ายแล้วใช้ไม่ได้

**Fix:**
- ใช้ `process_sell_package` RPC ที่สร้างใน Fix 2 (re-use เดียวกัน)
- เพิ่ม wrapper `process_approve_slip(p_slip_id, p_approved_by)` ที่เรียก `process_sell_package` ภายใน + update `transfer_slips.status='approved'` ใน transaction เดียว

---

## ⚠️ สิ่งที่ตั้งใจ "ไม่ทำ" ใน Phase นี้

- ❌ ไม่ rewrite edge function ทั้งไฟล์ — เปลี่ยนเฉพาะส่วน DB write เป็น RPC call (minimal diff)
- ❌ ไม่แตะ CORS / auth guard / response envelope (working — ห้ามตามกฎ)
- ❌ ไม่ touch `stripe-webhook` ซ้ำ (มี `process_stripe_payment` ทำงานอยู่แล้ว)
- ❌ ไม่เพิ่ม unit test (out-of-scope — verify ด้วย smoke test)

---

## Files ที่จะแตะ

```
สร้างใหม่:
  supabase/migrations/<ts>_atomic_redeem_reward.sql
  supabase/migrations/<ts>_atomic_sell_package.sql
  supabase/migrations/<ts>_atomic_approve_slip.sql

แก้ minimal:
  supabase/functions/gamification-redeem-reward/index.ts  — replace 6-step block with rpc call
  supabase/functions/sell-package/index.ts                — replace write block with rpc call
  supabase/functions/approve-slip/index.ts                — replace write block with rpc call
```

**Protected files ที่จะไม่แตะ:** `_shared/db.ts`, `_shared/database.types.ts`, integrations/supabase/*, ui/*, AuthContext

---

## Regression Checklist (ก่อน mark Phase 1 done)

1. ✅ `bun run build` เขียว
2. ✅ Edge function deploy logs ทั้ง 3 functions = success
3. ✅ Smoke test:
   - Member redeem reward สำเร็จ (XP balance ลด, stock ลด, redemption row ขึ้น)
   - Member redeem reward ที่ stock=0 → reject พร้อม error code `OUT_OF_STOCK`
   - Staff sell package → transaction + member_package + member.last_purchase_at ครบ
   - Slip approve → transaction + package + slip.status=approved (ดูใน admin TransferSlips page)
4. ✅ DEVLOG entry บันทึก 3 fixes + reason
5. ✅ ไม่มี protected file ถูกแตะ

---

## ขั้นตอนถัดไปหลัง Phase 1 ปิด

- **Phase 2** — S2-1 (slip_file_url 1 line), S2-2 (logActivity ใน 9 hooks), S2-3 (TH translations 75 keys)
- **Phase 3** — UX critical (5 stub buttons, MobilePageHeader fix, i18n hardcoded)
- **Phase 4** — Docs sync (DEVLOG, CONTRACTS, INTEGRATION_NOTES)
- **AI Guardrails** — สร้าง `AI_GUARDRAILS.md` + `PROTECTED_FILES.md` + `mem://ai-regression-prevention`

**Approve เพื่อเริ่ม Phase 1:** ผมจะเริ่มจาก migration `process_redeem_reward` ก่อน (chunk เล็กสุด, low blast radius), verify deploy, แล้วทำ `process_sell_package` + `process_approve_slip` ตามลำดับ

