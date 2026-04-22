

# 🔍 Deep Re-Audit — เจอจริง 4 จุด, ตัด False Alarms 6 จุด

หลังตรวจ **DB linter, cron jobs, edge functions, routes, RPCs, RLS, storage, smoke test, build** — ระบบเสถียรกว่าเดิม **แต่เจอ 4 จุดที่ควรแก้รอบนี้** (แบบ surgical, ไม่กระทบของเดิม)

---

## ✅ ตัด false alarms (ตรวจแล้วไม่ใช่บั๊ก)

| สิ่งที่ดูเหมือนซ้ำ/พัง | ผลตรวจ |
|---|---|
| Cron jobs ซ้ำ | มีตัวเดียว `evaluate-tiers-daily` (jobid=1, 0 20 * * *) — runs สำเร็จ 5 ครั้งล่าสุด ✅ |
| `process_stripe_payment` columns ผิด | `member_packages.purchase_transaction_id` + `package_name_snapshot` มีอยู่จริง ✅ |
| RPC ทั้ง 4 ตัว | มีครบใน `pg_proc`: `process_package_sale, process_slip_approval, process_stripe_payment, process_redeem_reward` ✅ |
| Routes `/analytics`, `/report` | เป็น `<Navigate>` redirect → `/insights` (ตั้งใจ) ✅ |
| Build | เขียว 3856 modules ✅ |
| Cron repeated `auto-notifications` | ไม่มี cron — เป็น on-demand only (ไม่ซ้ำ) ✅ |

---

## ❌ จุดจริงที่ควรแก้รอบนี้ (4 issues)

### 🔴 P1-1 — Stripe webhook: idempotency ไม่ครบ

**ไฟล์:** `supabase/functions/stripe-webhook/index.ts:97`

ปัญหา: webhook เรียก `process_stripe_payment` แต่ไม่ส่ง idempotency key — ถ้า Stripe retry webhook (เกิดได้บ่อย) → อาจสร้าง `member_billing` + `member_packages` ซ้ำ
- ใน RPC มีเช็ก `v_tx.status = 'paid'` แล้ว return idempotent ✅ — **แต่** ถ้า 2 webhooks มาพร้อมกัน race condition จะหลุด
- มี `FOR UPDATE` lock อยู่แล้ว แต่ยังขาด unique constraint บน `member_billing(transaction_id)` → 2 row ได้ถ้า lock release ก่อนตรวจ

**Fix:** เพิ่ม partial unique index `member_billing(transaction_id) WHERE transaction_id IS NOT NULL` — additive, zero impact

### 🔴 P1-2 — `Public Bucket Allows Listing` (Linter WARN)

**Storage:** `slip-images` bucket = `public: true` + RLS policy `(bucket_id = 'slip-images')` = **anyone can list ALL slip images URLs**
- ผลกระทบ: รูปสลิปการโอนเงิน (มีชื่อ, เลขบัญชี, จำนวนเงิน) ถูก enumerate ได้

**Fix:** เปลี่ยน read policy เป็น "เฉพาะเจ้าของ + staff" — จาก:
```sql
USING (bucket_id = 'slip-images')
```
เป็น:
```sql
USING (
  bucket_id = 'slip-images'
  AND (
    has_min_access_level(auth.uid(), 'level_1_minimum')
    OR EXISTS (
      SELECT 1 FROM transfer_slips ts
      WHERE ts.slip_file_url LIKE '%' || storage.objects.name
        AND ts.member_id = get_my_member_id(auth.uid())
    )
  )
);
```
- Bucket ยังคง `public: true` (ลิงก์ที่ผู้ใช้/staff ที่รู้ URL อยู่แล้วยังเปิดได้) — แต่ **list/enumerate ไม่ได้**
- Risk: ถ้า frontend ใช้ `list()` API → ตรวจแล้วไม่มีโค้ด list bucket นี้ใน frontend ✅

### 🟡 P2-1 — `smoke_test_payment_flow()` ใช้งานไม่ได้สำหรับ master/owner ที่ไม่มี user_roles

ปัญหา: `has_min_access_level(auth.uid(), 'level_3_manager')` คืน false ตอนเรียกผ่าน Studio (auth.uid() = null) — function ตาย FORBIDDEN

**Fix:** เปลี่ยน guard เป็นรองรับทั้ง user manager **และ** service_role context:
```sql
IF auth.uid() IS NOT NULL AND NOT has_min_access_level(auth.uid(), 'level_3_manager') THEN
  RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
END IF;
```
- เรียกจาก SQL Editor (no JWT) → ผ่าน, เรียกจาก client ด้วย user ปกติ → ยังบล็อก ✅

### 🟡 P2-2 — Empty tables ใน DB (3 ตัว) อาจกลายเป็น dead code

ตาราง 0 rows ที่ตรวจพบ:
- `gamification_rewards` (0 rows) — แต่มี code referencing → **ต้องเพิ่ม seed data** (ไม่ใช่ลบ)
- `member_referrals` (0 rows) — feature live, ยังไม่มีคน redeem → keep
- `quest_templates` (0 rows) — gamification ยังไม่ได้ seed → **ต้องเพิ่ม seed data หรือแสดงป้าย "ยังไม่มี"**

**Fix:** ไม่แตะ schema, แค่ **เช็คว่า UI handle empty state ดี** (`MemberRewardsPage` แสดงเป็น empty state ถูก)
- → **No code change needed** — แต่จะเพิ่มเข้า DEVLOG เป็น "known empty, needs seed in production"

---

## 🛡️ Prevention Layer ใหม่ (เพิ่มเติม)

### Rule 9 — Storage bucket policy verification (เพิ่มเข้า `AI_GUARDRAILS.md`)

> ก่อนสร้าง public bucket ใหม่ต้อง:
> 1. Query `storage.buckets WHERE public=true` — list ทุกตัวที่ public
> 2. ตรวจ `storage.objects` policies ว่า SELECT มี condition กรอง bucket_id + ownership
> 3. ห้ามเขียน `USING (bucket_id = 'X')` แบบไม่มี ownership check ถ้า bucket public

### Rule 10 — Idempotency for webhook handlers

> Webhook handlers (Stripe, LINE, อื่นๆ) ที่ insert ลง table ที่อาจซ้ำ ต้องมี unique constraint **ระดับ DB** ไม่ใช่แค่ check ใน application code (race condition)

---

## 📦 Files Touched

```
สร้างใหม่ (migrations):
  <ts>_add_member_billing_unique_index.sql      — P1-1
  <ts>_tighten_slip_images_storage_policy.sql   — P1-2
  <ts>_fix_smoke_test_studio_access.sql         — P2-1

แก้:
  AI_GUARDRAILS.md — เพิ่ม Rule 9 + Rule 10
  docs/DEVLOG.md  — append entry "Deep audit pass 2"

ไม่แตะ:
  - Frontend (P2-2 = empty state ทำงานถูกอยู่แล้ว)
  - Edge functions (P1-1 fix อยู่ที่ DB layer)
  - Tier-1 protected files
  - Routes / cron / RLS อื่น
```

---

## ✅ Regression Checklist

1. ✅ Migration ทั้ง 3 ใช้ `CREATE OR REPLACE` / `CREATE UNIQUE INDEX IF NOT EXISTS` — additive only
2. ✅ ก่อน apply: query confirm `member_billing` ไม่มีแถว `transaction_id` ซ้ำ (จะทำให้ unique index fail)
3. ✅ หลัง apply: รัน `SELECT smoke_test_payment_flow();` → ทั้ง 4 enum + 4 RPC ผ่าน
4. ✅ Manual: upload slip → admin approve → ตรวจรูป preview ยังเปิดได้ใน admin UI
5. ✅ Manual: admin enumerate `slip-images` bucket via anon → ต้องโดน deny
6. ✅ `bun run build` เขียว
7. ✅ Stripe checkout flow (sandbox): pay → webhook → 1 transaction + 1 billing + 1 member_package
8. ✅ DEVLOG entry ครบ + เพิ่ม Rule 9-10 ใน AI_GUARDRAILS

---

## 🚦 Defer (ตั้งใจไม่ทำรอบนี้)

- ❌ Bundle 3.1 MB → manualChunks → blast radius กว้างเกิน
- ❌ Migrate 473 inline query keys → ทำเป็น dedicated round
- ❌ Seed `quest_templates` / `gamification_rewards` → business decision ของ owner
- ❌ Bucket `slip-images` เปลี่ยนเป็น `public:false` → จะทำให้ existing slip URL ตายทั้งหมด (กระทบ working) — แค่ tighten list policy ก็พอ

**Approve → ผมจะ apply migration P2-1 (smoke test fix, เล็กสุด) → P1-1 (unique index) → P1-2 (storage policy) ตามลำดับ พร้อม verify ทุก step**

