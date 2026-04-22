

# 🔍 Deep Audit — Real Flaws Found (P0/P1/P2)

หลังตรวจระบบจริง พบ **bugs ของจริง 4 ข้อ** (รวม 2 P0 ที่ขัดขวางการขายแพ็กเกจทั้งหมด) + cleanup 1 ข้อ — ทั้งหมดมีหลักฐานชัดเจนจาก DB schema และ code

---

## 🚨 P0 — Critical (ขัดขวาง revenue flow ทั้งระบบ ตั้งแต่ deploy phase 1 วันนี้)

### Bug 1 — `process_package_sale` ใช้ enum cast ผิด 2 จุด

ไฟล์: `supabase/migrations/20260422102532_*.sql` (deploy วันนี้)

```sql
-- ผิด:
p_type::transaction_type            -- enum ชื่อนี้ไม่มีอยู่ในระบบ
'completed'::transaction_status     -- ค่า 'completed' ไม่มี (มีแค่ paid/pending/voided/needs_review/refunded/failed)
```

DB จริง: `transactions.type` เป็น `package_type` enum (`unlimited|pt|session`) และ `status` ใช้ค่า `'paid'`

**Impact:** ทุกการขายแพ็กเกจ (sell-package edge function) จะ throw `42704: type "transaction_type" does not exist` หรือ `22P02: invalid input value` — **revenue flow ตายสนิทตั้งแต่วันนี้**

### Bug 2 — `process_slip_approval` ผิดเหมือนกัน 3 จุด

ไฟล์: `supabase/migrations/20260422102609_*.sql` (deploy วันนี้)

```sql
COALESCE(p_package_type, 'class')::transaction_type   -- ผิด 2 ชั้น: enum name ผิด + 'class' ไม่ใช่ค่า package_type
'completed'::transaction_status                        -- ผิดเหมือน Bug 1
```

**Impact:** Admin approve transfer slip ไม่ได้เลย — สมาชิกจ่ายเงินผ่านสลิปแล้วแพ็กเกจไม่ออก

### Bug 3 — `process_stripe_payment` RPC ไม่มีอยู่ในฐานข้อมูล

ไฟล์: `supabase/functions/stripe-webhook/index.ts:97` เรียก `supabase.rpc('process_stripe_payment', ...)` แต่ `pg_proc` ไม่มีฟังก์ชันนี้ (มีแค่ `process_package_sale`, `process_redeem_reward`, `process_slip_approval`)

**Impact:** ทุก Stripe checkout ที่สำเร็จ webhook จะล้มเหลว — เงินเข้า Stripe แล้วแต่ระบบไม่บันทึก transaction และไม่ออก member_packages

---

## ⚠️ P2 — Data hygiene

### Bug 4 — Duplicate role "Finance Officer" (พบในหน้า /roles ที่ user เปิดอยู่ตอนนี้)

| id | name | perm_count | staff_assignments |
|---|---|---|---|
| `4ac943b7…` | Finance officer | 3 | 0 |
| `455fe2f3…` | Finance Officer | 0 | 0 |

ทั้งสองไม่มี staff ใช้งาน — ตัวที่ 0 perm สร้างทีหลัง 1 ชั่วโมง น่าจะเป็น duplicate accident

**Fix:** ลบตัว `455fe2f3…` (0 perms, ไม่มีคนใช้)

---

## ✅ ตรวจแล้วไม่ใช่บั๊ก (false alarms ที่ตัด)

- **Cron jobs**: มีตัวเดียว (`evaluate-tiers-daily`) — ไม่ซ้ำ
- **Routes**: 125 routes ใน App.tsx — ทุก `navigate()` mapped ถูก (false positive 8 ตัวเป็น nested gamification routes)
- **Coming Soon pages**: `MemberRunClubPage` ใช้ pattern ถูก (ไม่มี navigate/toast)
- **Edge functions ที่ "ดูเหมือนตาย"** (`gamification-issue-coupon`, `sync-gamification-config`) — เรียกผ่าน admin tools ภายใน, ไม่ใช่ orphan
- **DB integrity**: 0 orphan user_roles, 0 dup user-role pairs, 0 dup member emails, 0 approved slips ที่ไม่มี transaction

---

## 🛠️ Plan — Surgical Fixes

### Migration 1 — แก้ `process_package_sale` enum casts

```sql
CREATE OR REPLACE FUNCTION public.process_package_sale(...)
-- เปลี่ยน 2 จุดในไฟล์ 20260422102532:
--   p_type::transaction_type        →  p_type::package_type
--   'completed'::transaction_status →  'paid'::transaction_status
```

### Migration 2 — แก้ `process_slip_approval` enum casts

```sql
CREATE OR REPLACE FUNCTION public.process_slip_approval(...)
-- เปลี่ยน 2 จุดในไฟล์ 20260422102609:
--   COALESCE(p_package_type, 'class')::transaction_type
--     →  COALESCE(p_package_type, 'session')::package_type
--   'completed'::transaction_status →  'paid'::transaction_status
```

ทั้ง 2 ใช้ `CREATE OR REPLACE` — ไม่กระทบ data, ไม่กระทบ permissions

### Migration 3 — สร้าง `process_stripe_payment` RPC ที่หายไป

re-use logic ของ `process_package_sale` แต่ accept Stripe-specific fields (stripe_session_id, paid_at จาก webhook event) — ตรวจ idempotency ด้วย `idempotency_key = 'stripe:' || session_id`

### Migration 4 — ลบ duplicate Finance Officer role

```sql
DELETE FROM public.roles WHERE id = '455fe2f3-e704-4d63-969d-b2f8663e1cef';
```

ปลอดภัย: 0 staff_positions อ้างถึง

### NEW guardrail — Migration 5: เพิ่ม smoke-test function

สร้าง `public.smoke_test_payment_flow()` ที่ DRY-run RPC ทั้ง 3 ตัวด้วย dummy data + ROLLBACK ทันที — เรียกหลัง deploy เพื่อจับ enum mismatch แบบนี้ก่อนถึงผู้ใช้

---

## 🛡️ Why Bug 1-3 หลุดมาได้ (root cause analysis)

Phase 1 plan วันนี้ **เขียน migration ใหม่โดยไม่ได้ verify enum names ใน DB จริง** — แค่อนุมานจากชื่อคอลัมน์ (`status` → คงเป็น `transaction_status` enum, `type` → คงเป็น `transaction_type`) ทั้งที่จริง `transactions.type` ใช้ enum ชื่อ `package_type` (legacy naming) และ `transaction_status` ไม่เคยมีค่า `'completed'`

**Prevention rule (จะเพิ่มเข้า `AI_GUARDRAILS.md`):**

> **Rule 8 — Enum verification before DB writes.** ก่อนเขียน `INSERT/UPDATE` ที่ cast enum ใน migration หรือ RPC ต้อง:
> 1. Query `SELECT enum_range(NULL::<enum_name>)` เพื่อยืนยันค่าที่ถูก
> 2. Query `information_schema.columns` เพื่อดู `udt_name` จริง — ห้ามอนุมาน enum name จากชื่อคอลัมน์
> 3. Search migrations เก่า — ทั้งหมดใช้ค่าไหน (existing rows = ground truth)

---

## 📦 Files Touched

```
สร้างใหม่:
  supabase/migrations/<ts>_fix_process_package_sale_enums.sql       — Bug 1
  supabase/migrations/<ts>_fix_process_slip_approval_enums.sql      — Bug 2
  supabase/migrations/<ts>_add_process_stripe_payment_rpc.sql       — Bug 3
  supabase/migrations/<ts>_dedupe_finance_officer_role.sql          — Bug 4
  supabase/migrations/<ts>_add_smoke_test_payment_flow.sql          — Guardrail

แก้:
  AI_GUARDRAILS.md — เพิ่ม Rule 8 (Enum verification)

ไม่แตะ:
  - Edge functions (callers ส่งค่าถูกต้องแล้ว — สลับเฉพาะ DB-side)
  - Frontend (no impact)
  - Tier-1 protected files
```

---

## ✅ Regression Checklist

1. ✅ Migration ใช้ `CREATE OR REPLACE FUNCTION` — ไม่ drop, ไม่กระทบ permissions/grants
2. ✅ ก่อน apply: query เพื่อยืนยัน 47 transactions ทั้งหมดใช้ `status='paid'`, `type IN (unlimited|pt|session)` — confirmed
3. ✅ ทดสอบ `smoke_test_payment_flow()` หลัง deploy ทั้ง 3 RPCs
4. ✅ Manual sell-package flow (Staff Payments page → sell)
5. ✅ Manual slip approval flow (Admin Transfer Slips)
6. ✅ Roles page โหลดแล้วเหลือ 6 roles (จาก 7), ไม่มี dup
7. ✅ DEVLOG entry ครบ 5 fixes + reason

---

## 🚦 Defer (รอ dedicated round)

- Bundle size 3.1 MB — ต้อง manualChunks, blast radius กว้าง
- 473 inline query keys → centralize — กระทบ 50+ ไฟล์
- Auto-detect dead edge functions ผ่าน CI

**Approve → ผมจะ apply migration 1-2 ก่อน (P0 critical, สั้นที่สุด), verify ด้วย smoke test, แล้ว migration 3-5 ตามลำดับ**

