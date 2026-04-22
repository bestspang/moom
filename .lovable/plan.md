

# 🛡️ MOOM System-Wide Audit, Sync & AI-Regression Hardening

## Why this plan exists

ผู้ใช้ต้องการ 3 อย่างพร้อมกัน:
1. **ตรวจให้แน่ใจว่าทุก feature ทำงานจริง** (ไม่ใช่ stub, ไม่ broken)
2. **Sync เอกสาร / help / i18n / contracts** ให้ตรงกับ code ปัจจุบัน
3. **ป้องกัน AI ทำ regression ซ้ำๆ** — เป็น root cause ของความเหนื่อย

มี **MASTER_FIX_PLAN.md** อยู่แล้ว แต่ Sprint 1-3 ยังไม่ได้ทำ + **build ทุก edge function แตกอยู่** (17 ไฟล์, TS2339 'never') — ต้องแก้ก่อนทุกอย่าง ไม่งั้นแก้ฟีเจอร์ใดๆ ก็ deploy ไม่ได้

---

## 📊 สถานะปัจจุบัน (จากการตรวจจริง)

| Layer | สถานะ | จำนวน |
|---|---|---|
| 🔴 Edge functions build | **แตกทั้งหมด** | 17/17 |
| 🔴 Sprint 1 (P0 Security) | ยังไม่ทำ | 8 issues |
| 🟠 Sprint 2 (P1 Broken) | ยังไม่ทำ | 6 issues |
| 🟡 Sprint 3 (P2 UX/Quality) | ยังไม่ทำ | 6 issues |
| 🟢 Sprint 4 (P3 Polish) | ✅ เสร็จแล้ว | — |
| ✅ Frontend pages | ทำงานได้ | 70+ pages |
| ⚠️ Docs sync | ไม่ตรงบางจุด | DEVLOG, CONTRACTS |

---

## 🎯 แผนแบ่ง 5 Phase (ทำทีละ phase, verify ก่อนไป phase ถัดไป)

### **Phase 0 — Unblock Builds (Foundation)** ⏱️ 1 phase
**ปัญหา:** Edge functions ทุกตัว build fail → แก้ฟีเจอร์ใดๆ ไม่ได้  
**Root cause:** ใช้ `ReturnType<typeof createClient>` ทำให้ TS infer เป็น `never`  
**Fix:** apply typed client pattern ตาม `mem://architecture/edge-function-typed-client-pattern`

- สร้าง `supabase/functions/_shared/db.ts` — typed `SupabaseClient<Database>` factory + reusable CORS helper
- Refactor 17 edge functions ให้ import typed factory แทน inline `createClient`
- Verify: build เขียว ทุก function deploy ได้

**Verify:** `bun run build` ผ่าน + `supabase functions deploy` ผ่านทุกตัว

---

### **Phase 1 — Security Critical (Sprint 1)** ⏱️ 1 phase
แก้ 8 ช่องโหว่ P0 จาก audit:

| # | ไฟล์ | ปัญหา → fix |
|---|---|---|
| S1-1 | `auto-notifications`, `evaluate-tiers-daily` | CRON_SECRET null bypass → strict guard |
| S1-2 | `sync-gamification-config` | RBAC missing → add `has_min_access_level('manager')` |
| S1-3 | `gamification-redeem-reward` | TOCTOU race → atomic RPC with SELECT FOR UPDATE |
| S1-4 | `gamification-assign-quests` | Ownership missing → staff or self only |
| S1-5 | `gamification-issue-coupon` | Ownership missing → staff only |
| S1-6 | 2 functions query `profiles` table ที่ **ไม่มีจริง** | ใช้ `user_roles` + `has_min_access_level` แทน |
| S1-7 | `sell-package` | Non-atomic writes → wrap in RPC `process_sell_package` |
| S1-8 | `approve-slip`, `stripe-webhook` | Non-atomic → already partially fixed via `process_stripe_payment`, audit + complete |

**Verify:** smoke test 8 scenarios (cron auth, member-as-staff blocked, double-redeem blocked, etc.)

---

### **Phase 2 — Broken Features + Audit Trail (Sprint 2)** ⏱️ 1 phase

| # | Fix |
|---|---|
| S2-1 | `StaffPaymentsPage`: `slip_image_url` → `slip_file_url` (1 line, urgent — staff มองสลิปไม่เห็นเลย) |
| S2-2 | เพิ่ม `logActivity()` ใน 9 hooks ที่ขาด (ละเมิด audit policy) |
| S2-3 | เพิ่ม TH translation ~75 keys gamification (Thai user เห็น raw key) |
| S2-4 | เพิ่ม delete mutations ใน `useGamificationChallenges`, `useGamificationRewards` |
| S2-5 | เพิ่ม `onError` ใน `usePromotionPackages` ทุก mutation |
| S2-6 | `auto-notifications` paginate (batch 100) แทนโหลดทั้งหมด |

**Verify:** ทุก mutation มี toast + log + invalidate; TH UI ไม่มี raw English keys

---

### **Phase 3 — UX & Code Quality (Sprint 3 — เลือกเฉพาะ high-impact)** ⏱️ 1 phase

ทำเฉพาะส่วนที่ user-facing สำคัญ ไม่ทำ S3-4 (473 inline keys) ในรอบนี้ — scope ใหญ่เกิน

| # | Fix |
|---|---|
| S3-1 | 5 stub Coming Soon → wire จริง หรือลบ (ตาม policy "no fake elements") |
| S3-2 | `MemberCheckInPage` ขาด `MobilePageHeader` → เพิ่ม |
| S3-3 | i18n hardcoded strings: IdentityLinkingCard, StaffPaymentsPage, QueryError + gamification toasts |
| S3-5 | Loading states: StaffPayments approve/reject, Stripe checkout button |
| S3-6 | Error states ใน forms ที่ silent fail |

**ข้าม:** S3-4 (inline query keys migration) — แยกเป็น dedicated round เพราะกระทบ 473 จุด, AI regression risk สูง

**Verify:** preview ทุก surface (admin/member/trainer/staff), กดทุกปุ่มที่แก้ + cross-language switch

---

### **Phase 4 — Documentation Sync** ⏱️ 1 phase
หลังจาก code ตรงและ stable แล้ว ค่อย sync เอกสาร — ป้องกันเอกสารเก่าถูก lock เป็น "ground truth" ผิดๆ

| ไฟล์ | งาน |
|---|---|
| `docs/DEVLOG.md` | เพิ่มรายการครบ Phase 0-3 (date, files, why) |
| `docs/CONTRACTS.md` | sync edge function envelopes + new RPCs (process_sell_package etc.) |
| `docs/INTEGRATION_NOTES.md` | update page → hook → table mapping ที่เปลี่ยน |
| `docs/SMOKE_TEST.md` | เพิ่ม 5 test scenarios จาก security fixes |
| `docs/PROJECT_MEMORY.md` | confirm invariants ยังตรง, ไม่ต้องเพิ่ม (ของเดิมครบแล้ว) |
| `docs/MASTER_FIX_PLAN.md` | mark Sprint 1, 2, 3 (partial) ✅ |
| `mem://*` | บันทึก patterns ใหม่ (typed client factory, atomic RPCs) |

---

## 🛡️ AI-Regression Prevention Layer (สำคัญที่สุด — แก้ root cause)

ผู้ใช้บอกตรงๆ ว่า "AI ชอบเข้าไปปรับ function ที่ดีอยู่แล้วให้พัง" — ต้องสร้างระบบป้องกัน ไม่ใช่แค่หวังให้ AI จำ

### 1. **`AI_GUARDRAILS.md`** (ไฟล์ใหม่ที่ root)
Concise checklist ที่ AI ต้องอ่านทุกครั้งก่อนแก้:

```
## หน้าที่ของ AI ก่อนแก้โค้ด:
1. อ่าน file เป้าหมายทั้งหมดก่อน — ห้ามเดา
2. ระบุ "blast radius" — ไฟล์อื่นที่ import / call ตัวนี้
3. ถ้า function ทำงานอยู่แล้ว ห้ามแตะ field/property ที่ไม่เกี่ยว
4. ห้ามเพิ่ม/ลบ field ใน DB query ถ้าไม่ใช่ scope ของ task
5. ถ้าจะแก้ shared file (ui/*, AuthContext, hostname.ts) → STOP, ขอ approval
```

### 2. **`PROTECTED_FILES.md`** (ไฟล์ใหม่)
รายการไฟล์ที่ห้าม AI แตะโดยไม่ขอ:
- `src/integrations/supabase/{client,types}.ts` (auto-gen)
- `src/components/ui/*` (shadcn primitives)
- `src/contexts/AuthContext.tsx`
- `src/apps/shared/hostname.ts`
- `supabase/migrations/*` ที่ deploy แล้ว
- `supabase/config.toml` project-level

### 3. **เพิ่ม `mem://ai-regression-prevention`**
Memory rule ใหม่: ทุก AI session ต้องเช็ค "ฟีเจอร์นี้ทำงานอยู่ไหม" ก่อนแก้ ถ้าใช่ → minimal diff only

### 4. **Pre-commit smoke test** (ใน `docs/SMOKE_TEST.md`)
เพิ่ม section "AI Change Verification" — 5 step ก่อน mark task done:
- ✅ build เขียว
- ✅ ฟีเจอร์เดิมในไฟล์ที่แก้ยังทำงาน
- ✅ ไม่มีไฟล์ protected ถูกแตะ
- ✅ มี logActivity ใน mutation
- ✅ TH/EN i18n ตรง

---

## 🚦 Execution Order

```
Phase 0 (Unblock builds)   ─┐
                             ├─ ต้องเสร็จก่อน publish ใดๆ
Phase 1 (Security P0)      ─┘
                             
Phase 2 (Broken features)  ─┐
                             ├─ User-facing impact ทันที
Phase 3 (UX critical)      ─┘
                             
Phase 4 (Docs sync)        ─── ทำหลัง code stable
                             
AI Guardrails              ─── apply พร้อม Phase 0 (กฎใหม่ใช้ได้ตั้งแต่ phase ถัดไป)
```

---

## ⚠️ สิ่งที่ตั้งใจ "ไม่ทำ" ในรอบนี้ (ป้องกัน scope creep)

- ❌ Migrate 473 inline query keys (S3-4) — แยก dedicated round
- ❌ Refactor folder structure — ของเดิม working
- ❌ เปลี่ยน TS เป็น strict mode — ห้ามตามกฎ project (Lovable AI generates loose code)
- ❌ "ปรับปรุง" working components — ตามกฎ "no speculative improvements"
- ❌ เพิ่มฟีเจอร์ใหม่ — รอบนี้คือ stabilization round เท่านั้น

---

## 📝 Deliverables (ทุก phase)

ทุก phase จะส่งมอบ:
1. **Code diff** (minimal, surgical)
2. **DEVLOG entry** (date, files, why, regression-checklist)
3. **Smoke test result** (อะไร verify, ผลเป็นไง)
4. **Memory update** ถ้ามี pattern ใหม่ที่ควรจำ

**Approve plan นี้ → ผมจะเริ่มจาก Phase 0 ทันที** (typed client factory + 17 edge functions refactor) เป็น chunk แรก แล้วรอ verify ก่อน phase ถัดไป

