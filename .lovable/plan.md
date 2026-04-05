
1) System analysis

Current state
- ระบบมี 4 surface หลัก: Admin (`/`), Member (`/member/*`), Trainer (`/trainer/*`), Staff (`/staff/*`)
- Auth/permission ใช้ `user_roles` + `access_level` + `ProtectedRoute`
- Data/runtime หลักอิง React Query + realtime invalidation (`useRealtimeSync`)
- Receipt/transfer-slip flow ตอนนี้ “แยก truth คนละชุด”:
  - Member upload ใช้ `src/apps/member/api/services.ts` → RPC `member_upload_slip`
  - แต่ Admin/Staff review ใช้ `transfer_slips` ผ่าน `src/hooks/useTransferSlips.ts`, `src/pages/TransferSlips.tsx`, `src/components/transfer-slips/SlipDetailDialog.tsx`
  - `approve-slip` function ก็ทำงานบน `transfer_slips`
- Gamification มีทั้ง frontend emitters + edge functions + DB rules/config + docs หลายชุด

Constraints / invariants ที่ต้อง preserve
- ห้ามแก้ `src/integrations/supabase/client.ts` และ `src/integrations/supabase/types.ts` ตรงๆ
- role ต้องอยู่ใน `user_roles` เท่านั้น
- ต้องไม่ทำให้ published member flow ที่ตอนนี้ใช้งานได้แล้วพัง
- DB changes ต้องเป็น additive/backward-compatible เท่านั้น
- ปุ่ม/ฟังก์ชันบน live screen ต้อง “ทำงานจริง” หรือ “ถูก disable/hide แบบชัดเจน” ห้าม fake success

Scope
- IN: docs sync, contract sync, receipt flow sync, button/function audit, edge-function build fix, regression prevention
- OUT: redesign UI ใหม่ทั้งระบบในรอบนี้

2) Problem list

A. Documentation drift เป็น root cause ระดับระบบ
- `README.md` ยังเป็น template placeholder
- ไม่มี `docs/PROJECT_MEMORY.md`, `docs/CONTRACTS.md`, `docs/SMOKE_TEST.md`, `docs/DEVLOG.md` ตามที่ระบบต้องมี
- `APP_ANALYSIS.md` และ `docs/INTEGRATION_NOTES.md` ไม่ตรงกับ implementation ปัจจุบันหลายจุด
- `docs/data-contract.md` กับ `docs/gamification-event-map.md` ขัดกันเองเรื่อง event key

B. Live UI มี action ที่ยังไม่ควรปล่อยเป็น “กดได้แต่ไม่ทำงานจริง”
- `src/apps/trainer/pages/TrainerProfilePage.tsx` มี notifications / preferences / help เป็น `toast.info(...)`
- `src/pages/Insights.tsx` มี report cards บางตัวกดแล้ว “coming soon”
- บาง disabled action ใน settings/import-export ยังโอเค เพราะ disable ชัดเจน + tooltip ชัดเจน แต่ต้องแยกจาก fake clickable action

C. Receipt / transfer-slip contract drift จริง
- `uploadTransferSlip()` เรียก RPC `member_upload_slip`
- DB function `member_upload_slip` ที่มีอยู่ตอนนี้เขียนลง `transactions`
- แต่หน้า review/admin notification/approve ใช้ `transfer_slips`
- ผลคือ member-uploaded slip มีความเสี่ยง “ไม่เข้าคิว review ตัวหลัก” และทำให้ help/docs/UX เข้าใจผิดทั้งระบบ

D. Build failure root cause ชัดเจน
- `supabase/functions/gamification-process-event/index.ts` ใช้ `createClient(...)` แบบไม่ใส่ Database generic
- helper functions รับ `db: ReturnType<typeof createClient>`
- ทำให้ `db.from(...)`, `db.rpc(...)`, `insert/update/select` infer เป็น `never`
- นี่คือสาเหตุตรงของ TS2339 / TS2769 ที่เห็นใน build logs

E. Gamification event contract conflict ยังไม่ถูกเคลียร์
- docs/memory บอก canonical key คือ `class_attend` / `package_purchase`
- แต่ code หลายจุดยังใช้ `class_attended` / `package_purchased`
- generated types ก็ยังสะท้อนฝั่ง legacy
- ถ้าแก้แบบเดา จะเสี่ยงทำ XP/Coin/SP pipeline พังทั้งชุด

F. Testing trap ที่ทำให้วินิจฉัยผิดซ้ำได้
- Preview root `/` = admin surface
- member/trainer/staff ต้องทดสอบบน path ที่ถูกต้อง ไม่งั้นจะคิดว่าโค้ดไม่อัปเดตทั้งที่ runtime คนละ surface

3) Improvement & feature design

Design principle
- “Freeze truth first, then fix contracts, then fix UI, then add guardrails”
- ไม่ refactor กว้างโดยไม่จำเป็น
- แก้ที่ source-of-truth และจุดเชื่อมระหว่าง feature ก่อน

Target design
```text
Member upload slip
  -> storage upload
  -> canonical review entity = transfer_slips
  -> admin/staff review
  -> approve-slip
  -> transactions + member_billing + member_packages + notifications

Gamification emitters
  -> one canonical event contract
  -> processor accepts verified live schema keys
  -> docs + code + DB rules synced together
```

Safe approach
- Receipt flow ให้ `transfer_slips` เป็น canonical review object
- Gamification ใช้ “DB-first reconciliation”:
  - เช็ก live rules/enum ก่อน
  - ถ้าจำเป็น ให้มี compatibility layer ชั่วคราว
  - ห้าม rename key ฝั่งเดียว

Technical details
- Build fix ควรทำแบบ typed edge client pattern ใน function ที่พังจริงก่อน (`gamification-process-event`)
- Placeholder audit ควรใช้ inventory จาก live pages เท่านั้น ไม่แตะ preview/roadmap pages ที่ตั้งใจเป็น demo
- Docs ต้องระบุให้ชัดว่าอะไรคือ authoritative source และอะไรคือ high-level summary only

4) Step-by-step implementation plan

Step 0 — Recheck truth จาก runtime/DB ก่อนแตะ logic
- ตรวจ live DB contracts ที่เกี่ยวกับ:
  - `gamification_rules.action_key`
  - `status_tier_sp_rules.action_key`
  - function/enum ที่รับ gamification event keys
  - receipt path ว่ามี record ไหลเข้า `transfer_slips` หรือไม่
- เป้าหมาย: กัน AI ไป “แก้สิ่งที่คิดว่าผิด” แต่จริงๆ ยังไม่ผิด

Step 1 — Fix build blocker ก่อน
Files
- `supabase/functions/gamification-process-event/index.ts`

What to do
- เอา `ReturnType<typeof createClient>` ออก
- ใส่ typed database client approach ที่ function ใช้ได้จริง
- แยก type ของ row/insert/update/RPC args ให้ชัดใน helper สำคัญ
- คง logic เดิมให้มากที่สุด

Why first
- ถ้า build ยังพัง งาน sync อื่นจะตรวจยืนยันต่อไม่ได้

Step 2 — Repair receipt flow end-to-end แบบถาวร
Files/modules
- DB migration: replace/update `member_upload_slip`
- `src/apps/member/api/services.ts`
- `src/hooks/useTransferSlips.ts`
- `src/components/transfer-slips/SlipDetailDialog.tsx`
- `supabase/functions/approve-slip/index.ts`
- `supabase/functions/auto-notifications/index.ts`

What to do
- ทำให้ member upload สร้าง `transfer_slips` เป็น canonical record
- รักษา return shape ของ RPC ให้ backward-compatible
- ตรวจว่า admin list / staff payments / notifications / approval ใช้ entity เดียวกัน
- ถ้ามี legacy `transactions` ที่ถูกใช้เป็น pending slip อยู่ ให้ทำ compatibility/backfill แทนการตัดทิ้งทันที

Step 3 — Reconcile gamification contract safely
Files/modules
- `supabase/functions/gamification-process-event/index.ts`
- `src/hooks/useClassBookings.ts`
- `src/hooks/useMemberDetails.ts`
- `supabase/functions/approve-slip/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- docs ที่เกี่ยวข้อง

What to do
- ตัดสิน canonical event key จาก live DB ไม่ใช่จาก doc file ใด file หนึ่ง
- ถ้า live DB เป็น key ใหม่:
  - update emitters + processor + docs ให้ตรงกัน
- ถ้า live DB ยังเป็น key เก่า:
  - ทำ additive migration / compatibility layer ก่อน
  - ค่อยย้าย emitters ทีละจุด
- ห้ามเปลี่ยนแค่ frontend หรือ doc ฝั่งเดียว

Step 4 — Audit ปุ่ม/ฟังก์ชันบน live UI ทั้งหมด
Priority files
- `src/apps/trainer/pages/TrainerProfilePage.tsx`
- `src/pages/Insights.tsx`
- `src/apps/member/pages/MemberProfilePage.tsx` (cleanup branch ที่ไม่ควรมี fake fallback)
- route/page inventory ที่เปิดให้ผู้ใช้จริง

What to do
- inventory action ทุกตัวใน live pages:
  - wired จริง
  - disabled intentionally
  - fake clickable / toast only
- policy:
  - ถ้าฟังก์ชันมี backend/route จริง → wire ให้ครบ
  - ถ้ายังไม่มีจริง → hide หรือ disable พร้อม copy ที่ชัดเจน
- เป้าหมายคือ “ไม่มีปุ่มที่เหมือนทำได้แต่ทำไม่ได้จริง”

Step 5 — Sync documentation ให้เป็น single source of truth
Create
- `docs/PROJECT_MEMORY.md`
- `docs/CONTRACTS.md`
- `docs/SMOKE_TEST.md`
- `docs/DEVLOG.md`

Update
- `README.md`
- `APP_ANALYSIS.md`
- `docs/INTEGRATION_NOTES.md`
- `docs/data-contract.md`
- `docs/gamification-event-map.md`

Documentation policy
- `PROJECT_MEMORY` = architecture + invariants + do-not-touch zones
- `CONTRACTS` = route/DB/function/event contracts ที่ห้าม drift
- `SMOKE_TEST` = critical flows/checklist
- `DEVLOG` = ทุก task ที่แตะ logic สำคัญ
- ไฟล์สรุปใหญ่เดิม (`APP_ANALYSIS.md`) ต้องชัดว่าเป็น overview ไม่ใช่ authoritative source

Step 6 — Add regression prevention
Planned safeguards
- เพิ่ม test/check ที่กัน live pages ใช้ `comingSoon`/toast-only actions โดยไม่ whitelist
- เพิ่ม checklist ก่อน merge/change:
  - touched routes
  - touched edge functions
  - touched DB functions
  - docs updated?
  - smoke steps updated?
- ระบุใน docs ชัดๆ ว่า preview root ไม่ใช่ member surface โดย default

5) Code changes (planned)

High-confidence edits
- `supabase/functions/gamification-process-event/index.ts`
- DB migration for `member_upload_slip`
- `src/apps/member/api/services.ts`
- `src/hooks/useTransferSlips.ts`
- `supabase/functions/approve-slip/index.ts`
- `supabase/functions/auto-notifications/index.ts`
- `src/apps/trainer/pages/TrainerProfilePage.tsx`
- `src/pages/Insights.tsx`
- `README.md`
- `APP_ANALYSIS.md`
- `docs/INTEGRATION_NOTES.md`
- `docs/data-contract.md`
- `docs/gamification-event-map.md`
- new docs in `docs/PROJECT_MEMORY.md`, `docs/CONTRACTS.md`, `docs/SMOKE_TEST.md`, `docs/DEVLOG.md`

Conditional edits (only if Step 0 proves needed)
- gamification event key migration
- emitter updates in `useClassBookings.ts`, `useMemberDetails.ts`, `stripe-webhook`, etc.
- legacy receipt backfill logic

Do-not-touch unless evidence forces it
- shared design system components
- auth core flow
- generated Supabase files
- routing structure beyond necessary contract alignment

6) Regression & prevention

Manual smoke checklist
1. Admin login → dashboard works
2. Member login → `/member` and `/member/check-in` render correct surface
3. Member upload slip creates canonical review record visible in admin transfer-slip list
4. Admin approve slip creates finance transaction + member billing + member package
5. Reject slip updates status + audit trail
6. Void approved slip updates linked transaction + slip status correctly
7. Staff payments view shows same truth as admin receipt flow
8. Auto-notifications picks up pending slips from the same source
9. Class attendance still awards gamification correctly
10. Package purchase/approval still awards gamification correctly
11. Trainer profile has no fake clickable actions left
12. Insights cards either navigate to real report or are clearly disabled
13. Realtime invalidation refreshes receipt/gamification screens after mutation
14. Old records still render after contract alignment
15. Published site and preview path-specific testing both behave as documented

Automated checks
- frontend build/typecheck
- edge function build
- targeted tests for no fake live actions
- targeted regression checks for receipt flow + gamification event normalization

Rollback plan
- receipt flow: preserve old RPC response shape and backfill strategy
- gamification keys: compatibility layer before cutover
- docs: authoritative docs first, then feature changes, never opposite order

7) Doc updates (Project Memory)

DEVLOG entry should capture
- what contract was wrong
- which files were touched
- whether DB behavior changed
- permission/security impact
- smoke steps performed
- rollback path

Key memory entries to add/update
- Preview/admin-vs-member testing rule
- Canonical receipt flow entity
- Canonical gamification event keys after DB verification
- List of intentional placeholders allowed in preview/demo only
- “No fake actions on live surfaces” rule

Definition of done
- build passes
- receipt flow uses one canonical review entity end-to-end
- docs and live code no longer disagree on core contracts
- no fake live actions remain on audited pages
- a future AI can read PROJECT_MEMORY + CONTRACTS + SMOKE_TEST + DEVLOG and avoid re-breaking working features
