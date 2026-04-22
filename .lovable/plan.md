

# 🔍 Re-Audit Pass — Targeted Fixes Only

## ✅ Verified working (no changes)

ตรวจครบแล้ว — phases 0-4 อยู่ในสภาพดี:
- Build: เขียว (3863 modules)
- Edge functions: `sell-package`, `approve-slip`, `gamification-redeem-reward` ใช้ atomic RPCs ครบ
- Routes `/roles`, `/roles/create`, `/roles/:id` มีครบ ใช้ `RoleEditor`
- `StaffPaymentsPage` ใช้ `slip_file_url` + `amount_thb` ถูกต้อง
- ไม่มี stale schema refs (`bookings`, `class_schedules`, `profiles`)
- Coming Soon: ไม่มี `toast.info("coming soon")` anti-pattern
- TH/EN i18n: parity ครบ

## ❌ พบบั๊กจริง 1 จุด (broken click)

**`NeedsAttentionCard.tsx` (Admin Dashboard)** — มี 2 ปุ่ม nav ไป `/announcements` (plural) แต่ route จริงคือ `/announcement` (singular)
- Line 71 + Line 225 → กดแล้วไป `NotFound` page
- Impact: ปุ่ม dashboard 2 จุด ตายเงียบๆ ไม่มี error

## 🎯 Plan (1 surgical fix only)

### Fix — `NeedsAttentionCard.tsx`

แก้ 2 บรรทัด: `navigate('/announcements')` → `navigate('/announcement')`

**ทำไมรอบนี้ทำแค่นี้:**
- ทำตามกฎ `AI_GUARDRAILS.md` (เพิ่ง create เอง): ถ้า WORKING → ห้ามแตะ
- จุดอื่นที่ตรวจซ้ำ (routes, edge functions, types, i18n) ทำงาน — ไม่แก้
- ไม่ scope creep ไปทำ S3-4 (473 inline query keys), ไม่ refactor

### Files
```
แก้:
  src/components/dashboard/NeedsAttentionCard.tsx — 2 บรรทัด (line 71, 225)

ไม่แตะ: ทุกไฟล์อื่น (รวม PROTECTED_FILES tier-1)
```

### Verification
1. ✅ `bun run build` ต้องเขียว
2. ✅ Manual: คลิกปุ่มใน Dashboard → Announcements section → ไป `/announcement` ได้จริง
3. ✅ ไม่มีไฟล์ใน `PROTECTED_FILES.md` ถูกแตะ
4. ✅ DEVLOG entry สั้นๆ บันทึก hot-fix

---

## 🛡️ Why nothing else needs fixing this round

ผมตั้งใจ **ไม่** ทำสิ่งเหล่านี้ตามกฎ "no speculative improvements":

| ตรวจแล้ว | สถานะ | เหตุผลที่ไม่แตะ |
|---|---|---|
| Roles page UI/Editor flow | WORKING — routes + hook ครบ | ไม่มีบั๊ก |
| Edge function atomic RPCs | WORKING — Phase 1 ผ่าน | กฎ: WORKING = ห้ามแตะ |
| TH/EN i18n parity | WORKING — Phase 2 ผ่าน | ไม่มี missing key |
| Coming Soon patterns | WORKING — ใช้ i18n + opacity-60 | ตรงตาม policy |
| `/notifications`, `/profile`, `/admin` nav | WORKING — Header เป็น admin-only, route มี | ไม่ broken |
| Realtime sync (34 tables) | WORKING | PROTECTED — เพิ่มเฉพาะตอนสร้าง table ใหม่ |

---

## ⏭️ Defer (รอ dedicated round)

- S3-4 — Migrate 473 inline query keys → กระทบ 50+ ไฟล์, AI regression risk สูง
- Bundle size warning (3.1 MB) → ต้อง `manualChunks` config, blast radius กว้าง
- DB enum legacy values (`class_attended` co-exist กับ `class_attend`) → non-breaking, รอ migration cycle

**Approve → ผมแก้ 2 บรรทัดและ verify ทันที จบใน 1 chunk**

