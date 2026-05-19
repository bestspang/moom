## Scope

ขยาย guardrails + tests ต่อจากงาน Lobby audit เดิม ครอบคลุม 4 ส่วน: realtime tests, CI gate, Members audit, QR check-in E2E

---

## 1. Realtime Lobby Tests & Guardrails

**New files:**
- `src/hooks/useLobby.realtime.test.ts` — mock `supabase.channel().on('postgres_changes')` → emit INSERT/UPDATE payload → assert `queryClient.invalidateQueries(queryKeys.lobby.*)` ถูกเรียก + row highlight state ถูกตั้ง
- `src/components/lobby/LobbyTable.realtime.test.tsx` — render table, dispatch fake realtime event ผ่าน mocked channel, assert new row มี `data-highlight="new"` และ badge "LIVE" แสดง

**Edit:**
- `docs/SMOKE_TEST.md` — เพิ่ม section "Realtime Lobby": เปิด 2 tabs → check-in tab A → tab B ต้องเห็น row ใหม่ภายใน 2s + highlight 5s
- `AI_GUARDRAILS.md` — Rule 14: ห้ามแก้ `useRealtimeSync` หรือ `TABLE_INVALIDATION_MAP` โดยไม่รัน realtime tests
- `PROTECTED_FILES.md` — เพิ่ม `src/hooks/useRealtimeSync.ts`, `src/lib/queryKeys.ts`

---

## 2. CI Gate (GitHub Actions)

**New file:** `.github/workflows/quality.yml`

```yaml
on: [pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install --frozen-lockfile
      - run: bun run lint
      - run: bun run test
      - run: bun run build
      - run: node scripts/compare-i18n.mjs  # exit 1 ถ้า key ไม่ตรง
      - run: node scripts/check-guardrails.mjs  # ใหม่ — scan protected files diff
```

**New file:** `scripts/check-guardrails.mjs` — อ่าน `PROTECTED_FILES.md` Tier 1, ใช้ `git diff --name-only origin/main` (จาก env `GITHUB_BASE_REF`); ถ้าไฟล์ protected ถูกแตะ → print warning + exit 1 (override ได้ด้วย `[skip-guardrails]` ใน PR title)

**Edit:** `package.json` — เพิ่ม script `"ci:guardrails": "node scripts/check-guardrails.mjs"`

---

## 3. Members Page Audit + Tests

**New files:**
- `docs/audit-members.md` — RBAC matrix สำหรับ Members list + Member Details (Overview/Records tabs) × Owner/Manager/Trainer/FrontDesk; button→handler trace (Add Member, Edit, Archive, Quick Actions ใน drawer: Add Package, Add Note, Check-in, View Packages)
- `src/pages/Members.smoke.test.ts` — i18n contract: ทุก label จาก `members.*` namespace มีทั้ง EN/TH; ปุ่มที่ require permission render ตาม role mock
- `src/pages/MemberDetail.smoke.test.tsx` — render กับ mock member, assert tabs (Overview, Records) แสดง, Quick Actions render ตาม `can('members', 'update')`

**Edit:**
- `src/i18n/locales/{en,th}.ts` — เติม key ที่ขาดจาก audit (ถ้ามี)
- `docs/SMOKE_TEST.md` — section "Members RBAC": 4 role × expected visible buttons

---

## 4. QR Check-in E2E Test

**Approach:** Vitest + React Testing Library (ไม่ใช้ Playwright เพื่อหลีกเลี่ยง dep ใหม่) — mock camera/QR decoder + supabase RPC

**New file:** `src/flows/checkInQR.e2e.test.tsx`

Flow:
1. Render `<CheckInPage />` with QueryClient + Router + i18n + mock auth (Front Desk role)
2. Click "QR Scan" button → mock `BarcodeDetector` returns member code `M-1234567`
3. Assert `useCreateCheckIn` ถูกเรียกด้วย `{ member_id, source: 'qr' }`
4. Mock supabase response → assert toast success + `logActivity({event_type: 'check_in'})` + `fireGamificationEvent('check_in')` ถูกเรียก
5. Assert UI แสดง member name + package status ใน confirmation card

**New helper:** `src/test/mocks/qrScanner.ts` — reusable mock สำหรับ BarcodeDetector API

**Edit:** `src/test/setup.ts` — register global `BarcodeDetector` mock placeholder

---

## Verification

- `bun run test` — เป้าหมาย: 86 → ~95+ tests passing
- `bun run build` — pass
- `node scripts/compare-i18n.mjs` — 100% parity
- Manual: เปิด 2 tabs ทดสอบ realtime check-in (smoke test ใหม่)

## Risks & Mitigation

- **Realtime mock complexity** — ใช้ pattern จาก existing `useLeadScoring.test.ts`; ถ้า supabase channel API mock ยาก ให้ test ที่ระดับ `queryClient.invalidateQueries` แทน
- **GitHub Actions ครั้งแรก** — ถ้า user ยังไม่มี workflow อื่น, file นี้จะเป็น workflow แรก; ต้องการ GitHub repo connected (มีอยู่แล้ว)
- **BarcodeDetector** — ไม่มีใน jsdom; mock เป็น global stub ก่อน import component
- **check-guardrails.mjs ใน Lovable env** — script รันเฉพาะใน GitHub Actions (มี `GITHUB_BASE_REF`); local skip อัตโนมัติ

## Preserved (ไม่แตะ)

- ทุกไฟล์ใน `src/integrations/supabase/*`, `src/components/ui/*`
- `AuthContext`, `useRealtimeSync` logic (เพิ่ม test เท่านั้น)
- Existing 86 tests, Lobby production code, i18n keys เดิม
- `supabase/config.toml`, edge functions

## Out of Scope

- Playwright/browser E2E (ใช้ vitest แทน)
- เพิ่ม role/permission ใหม่
- แก้ realtime logic จริง (test-only)
