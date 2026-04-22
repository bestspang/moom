

# 🔍 Deep Audit Pass 3 — เจอจริง 1 จุด (P1), ตัด False Alarms 5 จุด

ตรวจ **DB linter, smoke test, cron, RLS, storage, edge function CORS, route mapping, postgres error logs** — ระบบสะอาดมาก หลัง 3 รอบที่แก้ไป **เหลือบั๊กจริงเพียง 1 จุด** + ข้อสังเกต UX 1 ข้อ

---

## ✅ False Alarms (ตรวจซ้ำแล้วไม่ใช่บั๊ก)

| สิ่งที่ดูเหมือนพัง | ผลตรวจจริง |
|---|---|
| 4 edge functions hardcode `Access-Control-Allow-Origin: admin.moom.fit` | **False alarm** — ตรวจ runtime: ทุกตัวใช้ `dynamicCors` ที่ override เป็น `responseOrigin` ทั้ง OPTIONS + response. `corsHeaders` คือ default fallback เท่านั้น ✅ |
| `stripe-webhook` static CORS | **ตั้งใจ** — Stripe คือ caller (server-to-server), browser CORS ไม่บังคับ ✅ |
| `to="/location"`, `/trainer/badges`, `/notifications`, `/profile` | mapped ครบใน App.tsx (admin nested + trainer nested) ✅ |
| Linter | `No linter issues found` ✅ |
| Smoke test payment flow | enums + RPCs ครบ 4 ตัว ผ่านหมด ✅ |
| Duplicate roles / cron jobs | 0 duplicate, cron ตัวเดียว ✅ |

---

## ❌ บั๊กจริงรอบนี้ (1 issue)

### 🔴 P1 — `useRecentActivity` ส่ง 500 ทุก 30 วินาทีบน Admin Dashboard

**หลักฐาน (Postgres logs):** `column packages_1.name does not exist` — ขึ้นซ้ำ **9 ครั้งใน 5 นาทีล่าสุด** ที่ผมตรวจ — ทุก 30 วินาที (refetchInterval ของ hook นี้)

**ไฟล์:** `src/hooks/useRecentActivity.ts:38`
```ts
.select('id, created_at, amount, member:members(first_name, last_name), package:packages(name)')
                                                                                          ^^^^ column ไม่มีอยู่
```
DB จริง: `packages.name_en` + `packages.name_th` (ตาม i18n policy) — ไม่มี `packages.name`

**Impact ที่ user เห็น:**
- Admin Dashboard → "Live Activity" feed ส่วน purchase ไม่ขึ้นเลย (transactions array = empty หลัง error)
- Console เต็มไปด้วย 400 จาก PostgREST ทุก 30 วิ
- Network tab ตอน user เปิด dashboard ทิ้งไว้ → request fail ตลอด → กิน quota PostgREST + bandwidth

**Fix (3 บรรทัดเดียว):**
1. เปลี่ยน select เป็น `package:packages(name_en, name_th)`
2. เปลี่ยน consumer (line 66): `(t.package as any)?.name` → `(t.package as any)?.name_th || (t.package as any)?.name_en`
3. ไม่แตะส่วนอื่น

**Why this is P1, not P0:** Dashboard ยังโหลดได้ (check-ins ส่วนแสดงผลถูก) — แค่ purchases section ของ Live Activity ว่าง + log noise

---

## 💡 ข้อสังเกต UX (ไม่ใช่บั๊ก, ไม่แก้รอบนี้)

- `gamification_rewards` + `gamification_challenges` table ว่าง (0 rows) — ทำให้ Member App หน้า Rewards / Challenges แสดง empty state ตลอด → **เป็น business decision ที่เจ้าของต้อง seed เอง**, ไม่ใช่บั๊ก
- ตัดสินใจ **ไม่** seed อัตโนมัติเพราะ: (1) seed data ที่ไม่ถูกใจ owner = work รื้อ, (2) ขัดกฎ "no speculative changes"

---

## 🛡️ Prevention Layer ใหม่ (เพิ่ม Rule 11)

เพิ่มเข้า `AI_GUARDRAILS.md`:

> **Rule 11 — Verify column names before .select() chains.** ทุก Supabase `.select('col1, rel:table(col2)')` ต้องเช็คชื่อคอลัมน์จริงผ่าน:
> ```sql
> SELECT column_name FROM information_schema.columns WHERE table_name='<t>' AND table_schema='public';
> ```
> โดยเฉพาะตารางที่มี i18n columns (`name_en`/`name_th`, `description_en`/`description_th`) — ห้ามอนุมาน `.name` จาก naming convention. โต๊ะ MOOM ที่มีคู่ i18n: `packages, classes, class_categories, gamification_rewards, gamification_challenges, gamification_badges, gamification_levels, gamification_rules, gamification_seasons, gamification_trainer_tiers, level_benefits, coupon_templates, announcements`.

**ทำไม Rule นี้สำคัญ:** บั๊กนี้หลุดมาเพราะ AI session ก่อนหน้าเขียน `packages(name)` โดยอนุมาน — เป็นความผิดประเภทเดียวกับ enum bugs ที่เจอใน pass ก่อน (อนุมาน schema จากชื่อ)

---

## 📦 Files Touched

```
แก้ (surgical, 3 lines):
  src/hooks/useRecentActivity.ts — select i18n cols + consumer

แก้ (docs):
  AI_GUARDRAILS.md  — เพิ่ม Rule 11 (column verification)
  docs/DEVLOG.md    — append "Deep audit pass 3" + table ของ i18n columns

ไม่แตะ:
  - Routes (false alarms)
  - Edge functions (CORS ทำงานถูก)
  - DB schema / RLS / storage / migrations
  - tier-1 protected files
  - useRecentActivity ส่วน check-ins (WORKING — ใช้ first_name/last_name ถูก)
```

---

## ✅ Regression Checklist

1. ✅ Diff = 3 บรรทัด (1 select + 1 consumer + ข้อความ comment)
2. ✅ ก่อน apply: ยืนยัน `packages` มี `name_en` + `name_th` ✓ (ตรวจจาก information_schema แล้ว)
3. ✅ `bun run build` ต้องเขียว
4. ✅ Manual: เปิด `/` (Dashboard), รอ 30 วิ → Live Activity feed มี purchase items + console ไม่มี 400 อีก
5. ✅ Postgres logs: หลัง deploy รอ 5 นาที → ต้องไม่มี `column packages_1.name does not exist` อีก
6. ✅ `useRecentActivity` consumer (`LiveActivityFeed`) ยัง render ได้ทั้งกรณี `name_th=null` (fallback `name_en`)
7. ✅ ไม่แตะ refetchInterval, queryKey, type signature → blast radius = 0

---

## 🚦 Defer (ตั้งใจ)

- ❌ Bundle size 3.1 MB → manualChunks → blast radius กว้าง
- ❌ Migrate inline query keys → dedicated round
- ❌ Seed `gamification_rewards`/`challenges` → business decision
- ❌ `auto-notifications` paginate → ไม่ใช่ critical path

**Approve → ผมจะ apply 3-line fix + update Rule 11 ในรอบเดียว, verify ผ่าน Postgres log polling ใน 5 นาที**

