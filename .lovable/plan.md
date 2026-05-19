# Full Audit & Regression Hardening

## Goal
Make sure (a) Lobby + Check-in flow ทุกปุ่ม/feature ทำงานจริง และ help/i18n ตรงกับ code ปัจจุบัน, (b) ลดโอกาส AI ไปแก้ของที่ทำงานดีอยู่แล้วผ่าน smoke tests, ESLint boundary rules และ Protected/Guardrails docs ที่ครอบคลุมขึ้น. **ห้ามแตะ logic ของ feature ที่ยังทำงานปกติ** — งานนี้คือ verify + add guardrails, ไม่ใช่ refactor.

---

## Part A — Lobby + Check-in audit (verify-only, แก้เฉพาะที่ผิดจริง)

**Checklist (ทำเป็น report ใน `docs/audit-lobby.md` ใหม่):**
1. แต่ละปุ่ม Lobby → trace กลับไปหา handler จริง
   - `Check-in` button → `CheckInDialog` → `useCreateCheckIn` → `member_attendance` insert + `logActivity` + `fireGamificationEvent('check_in')`
   - `QR Code` → `CheckInQRCodeDialog` → `useCheckinQR`
   - Row click → `CheckInDetailsDrawer` → `Open member` → `/members/:id` (เช็คว่า route นี้ยังมี)
   - Filters/Pagination → client-side, page reset ครบ
   - KPI strip → ใช้ raw `checkInData` (ไม่ใช่ filtered) — verify intentional
2. **RBAC matrix** ของ Lobby across roles (Owner/Manager/Trainer/Front desk):
   - เช็คว่าทุก action ผ่าน `can('lobby', 'read'|'write')` + `can('members','read')` (ปุ่ม Open member)
   - ทำเป็นตารางใน audit doc
3. **Realtime** — verify `member_attendance` ยังอยู่ใน `TABLE_INVALIDATION_MAP` และ row highlight ทำงาน
4. **i18n parity** — รัน `node scripts/compare-i18n.mjs` เฉพาะ `lobby.*` namespace, แก้ key ที่ขาด
5. **Help/Tooltip sync** — ค้น `lobby.help|lobby.tooltip|lobby.description` ใน i18n; ถ้ามี help text เก่าที่อ้างถึง feature ที่ลบไปแล้ว → อัปเดต. ถ้ายังไม่มี help tooltip บน Filters/Drawer → เพิ่ม `lobby.help.*` key (EN/TH ทั้งคู่)
6. **Dead code check** — ใช้ `rg` หา component lobby/* ที่ไม่ถูก import

**ผลลัพธ์:** report (`docs/audit-lobby.md`) + แก้เฉพาะ bug จริงที่เจอ (ถ้าเจอ จะ list ก่อนแก้)

---

## Part B — AI Regression Guardrails (เพิ่มของจริงให้กัน AI พังของเก่า)

### B1. Smoke tests (Vitest) — gate `bun run test` ที่ CI มีอยู่แล้ว
สร้าง **3 ไฟล์ test** focused on the critical paths:
- `src/hooks/useLobby.test.ts` — mock supabase client, verify `useCreateCheckIn` builds correct payload + fires `logActivity` + `fireGamificationEvent('check_in')`
- `src/hooks/usePermissions.test.ts` — สำหรับ 4 access levels, สร้าง matrix `can(resource, action)` ตรวจกับ `getDefaultPermissions`
- `src/components/lobby/Lobby.smoke.test.tsx` — render Lobby ด้วย QueryClient + i18n + role mock; assert ปุ่ม Check-in/QR แสดงเฉพาะ `lobby.write`, แสดง KPI strip, filter popover เปิดได้

### B2. ESLint boundary rules (เพิ่มกฎ — ไม่แตะ rules เดิม)
แก้ `eslint.config.js` เพิ่ม `no-restricted-imports` + `no-restricted-syntax`:
- ห้าม import จาก `src/integrations/supabase/client.ts` หรือ `types.ts` แบบ relative ที่ไม่ใช้ alias `@/`
- ห้ามแก้ `src/components/ui/*` (ใช้ `no-restricted-syntax` หรือ override block) — กฎ "ห้าม export default จาก path นี้นอกจากไฟล์ shadcn เดิม" ทำยาก → ใช้ **commented eslint override block** สำหรับ `src/components/ui/**` ที่ flag warning ถ้ามีการเพิ่ม import นอก shadcn
- ห้าม `import 'moment'`, `import 'axios'`, `import 'lodash'` (banned libs ตาม CLAUDE.md) — ใช้ `no-restricted-imports`
- ห้าม raw `console.log` ใน `src/**` (เป็น warning, ไม่ใช่ error) → ลดการ debug noise ที่ AI ทิ้งไว้

### B3. Expand `PROTECTED_FILES.md`
เพิ่มไฟล์ที่ปัจจุบันยังไม่ list แต่ critical:
- `src/lib/toast-i18n.ts`, `src/lib/commandEvents.ts`
- `src/contexts/LanguageContext.tsx`, `src/contexts/LiffContext.tsx`
- `src/apps/shared/SurfaceContext.tsx`, `src/apps/shared/sessionTransfer.ts`
- `src/hooks/useLobby.ts` (canonical check-in pipeline + gamification fire)
- `src/hooks/usePermissions.ts` (RBAC source of truth)
- `supabase/functions/approve-slip/index.ts` (canonical slip→transaction atomic write)
- `supabase/functions/gamification-process-event/index.ts` (idempotency ledger)
- `vite.config.ts`, `vitest.config.ts`, `eslint.config.js`, `.github/workflows/quality.yml`

### B4. Expand `AI_GUARDRAILS.md`
เพิ่ม 2 rule:
- **Rule 9 — Verify the button still works:** หลังแก้ component ที่มีปุ่ม → manually trace handler ไปจนถึง DB call / mutation. ถ้า handler หาย หรือถูกแทนด้วย `console.log`/`toast.info('coming soon')` = regression.
- **Rule 10 — i18n + help text sync:** ถ้าเพิ่ม/เปลี่ยน feature → ต้องอัปเดต `lobby.help.*` (หรือ namespace ที่เกี่ยวข้อง) ทั้ง EN + TH. ถ้าลบปุ่ม → ลบ key ของปุ่มนั้นออกจากทั้งสองภาษา

### B5. CI gate (ไฟล์ `.github/workflows/quality.yml` มีแล้ว)
- ไม่แตะโครงสร้างเดิม. แค่เช็คว่า smoke tests ใหม่ทำให้ `bun run test` ผ่าน
- เพิ่ม step ใหม่ **เฉพาะ**: `bun run lint` มีอยู่แล้ว → boundary rules ใหม่จะ run อัตโนมัติ

---

## Part C — Help / Tooltip / Docs sync
1. รัน `rg -n "TODO|FIXME|coming soon|toast\.info\(.coming" src/` → list dead UI hints
2. เช็ค `docs/SMOKE_TEST.md` กับ feature ปัจจุบัน → append ส่วน "Lobby filters + drawer + pagination" smoke checklist
3. Append entry ใน `docs/DEVLOG.md` สรุปสิ่งที่ verify + ของที่เพิ่ม

---

## Files touched

**New (5)**
- `docs/audit-lobby.md` (audit report + RBAC matrix)
- `src/hooks/useLobby.test.ts`
- `src/hooks/usePermissions.test.ts`
- `src/components/lobby/Lobby.smoke.test.tsx`
- (อาจมี mock helpers ใน `src/test/`)

**Edit (append-only, ไม่ refactor)**
- `eslint.config.js` (เพิ่ม rules)
- `AI_GUARDRAILS.md` (เพิ่ม Rule 9 + 10)
- `PROTECTED_FILES.md` (เพิ่มรายการ)
- `docs/SMOKE_TEST.md` (append Lobby section)
- `docs/DEVLOG.md` (append entry)
- `src/i18n/locales/{en,th}.ts` — **เฉพาะ key ที่ขาดจริง** หลัง audit (จะ list ก่อนแก้)

**ห้ามแตะ**
- `src/pages/Lobby.tsx`, `src/hooks/useLobby.ts`, `src/components/lobby/*` — verify only
- ทุกไฟล์ใน `PROTECTED_FILES.md` Tier 1–3
- Auth/RLS/edge functions

---

## Risks & rollback
- ESLint rules ใหม่อาจ flag warning เก่าๆ มาก → ตั้งเป็น `warn` ไม่ใช่ `error` รอบแรก, แล้วค่อย upgrade
- Smoke tests ที่ mock supabase ผิดอาจ false-positive → ใช้ pattern เดียวกับ `useLeadScoring.test.ts` ที่มีอยู่
- Rollback = ลบไฟล์ใหม่ + revert append-only docs

## Acceptance
- `bun run build` ✅
- `bun run test` ✅ (รวม 3 ไฟล์ใหม่)
- `bun run lint` ✅ (warnings ใหม่ยอมรับได้)
- `node scripts/compare-i18n.mjs` ✅
- `docs/audit-lobby.md` มี RBAC matrix + button→handler trace ครบทุกปุ่มใน Lobby
