## 1. ปัญหาที่พบ (Root Cause Analysis)

หลังตรวจ `SettingsBranding.tsx`, `useBrandKit.ts`, `BrandTokens.ts`, `brandDefaults.ts`, layout, และ `index.html` — **Brand Kit (ชื่อยิม / โลโก้ / สี / ฟอนต์ / ติดต่อ / โซเชียล) ไม่ถูก propagate ออกไปนอกหน้า Settings เลย** เป็นต้นเหตุของอาการ "ของไม่ตรงกันทั้งระบบ"

| พื้นที่ | สถานะปัจจุบัน | ปัญหา |
|---|---|---|
| `applyBrandFromKit` | ถูกเรียก **เฉพาะใน SettingsBranding** และ **revert ตอน unmount** | สีและฟอนต์ที่ save แล้วไม่ apply กับ Admin / Member / Trainer / Staff |
| Sidebar / MobilePageHeader / Auth pages | hard-coded ไม่ผูก brand | เปลี่ยนชื่อ/โลโก้แล้วไม่ขึ้น |
| `index.html` | `<title>Lovable App</title>`, og: Lovable, ไม่มี favicon brand | SEO / share preview ผิดแบรนด์ |
| Document title / favicon runtime | ไม่ sync `brand.name` / `brand.logoUrl` | tab title ผิด |
| Help / tooltip / docs | `docs/audit-*.md`, `SMOKE_TEST.md`, `CONTRACTS.md` ไม่ครอบคลุม brand flow | คนใหม่ไม่รู้ว่า brand ต้อง propagate |
| ปุ่มใน SettingsBranding (Export / Reset / Save / Revert / Upload) | ยังไม่ได้ตรวจครบทุก role + ไม่มี smoke test | เสี่ยง regression |
| Brand consumers (receipt PDF, edge function emails, OG image) | ใช้ค่า hardcode | ไม่ตรงแบรนด์ลูกค้า |

**Root cause:** ไม่มี **single source of truth ระดับ runtime** ที่โหลด brand ครั้งเดียวแล้วใช้งานทั่วทั้งแอป → ทุก surface เลย drift ทีละจุด

## 2. Modules ที่กระทบ + สถานะ

| Module | Status | ต้องเก็บไว้ |
|---|---|---|
| `src/hooks/useBrandKit.ts` | WORKING | query/mutation API |
| `src/components/branding/*` | WORKING | preview components |
| `src/components/admin-ds/BrandTokens.ts` `applyBrandFromKit` | PARTIAL | logic ดี แต่ต้องเลิก revert ตอน unmount |
| `src/pages/settings/SettingsBranding.tsx` | WORKING | ฟอร์ม + ปุ่ม Save/Export/Reset/Revert |
| `src/App.tsx` (root provider) | UNKNOWN — ต้องเสริม BrandProvider | routing |
| `src/components/layout/Sidebar.tsx`, `Header.tsx`, `MobilePageHeader.tsx` | PARTIAL | ใช้ `<BrandMark>` component |
| `index.html` | BROKEN (ค่า default ของ Lovable) | structure |
| Auth pages, LIFF callbacks | PARTIAL | flow |
| Help / docs / smoke test | BROKEN | ของเดิม |

## 3. แผนแก้ (Minimal-Diff, Surgical)

### Step A — Global Brand Runtime (สาเหตุหลัก)
1. **`src/contexts/BrandContext.tsx` (new)** — โหลด `useBrandKit()` ครั้งเดียวที่ root, expose `{ brand, isLoading }`. Fallback = `DEFAULT_BRAND`.
2. **`src/App.tsx`** — wrap `<BrandProvider>` ใต้ `<QueryClientProvider>` (ทำเฉพาะ wrap ไม่แตะ routing).
3. **`src/components/admin-ds/BrandTokens.ts`** — เพิ่ม `<BrandStyleInjector />` component ที่ apply CSS vars จาก context ทุกครั้งที่ brand เปลี่ยน + sync `document.title` + `<link rel="icon">` จาก `brand.logoUrl`.
4. **`src/pages/settings/SettingsBranding.tsx`** — ลบ revert-on-unmount (เพราะ provider จะ handle) เหลือเฉพาะ preview local state.

### Step B — Brand UI Primitives (ทดแทน hardcode)
1. **`src/components/branding/BrandMark.tsx` (new)** — render โลโก้ + ชื่อยิม จาก context (รองรับ `size`, `showName`, `variant`).
2. ใช้แทน hardcoded brand ใน: `Sidebar.tsx`, `Header.tsx`, `MobilePageHeader.tsx` (เฉพาะจุดที่มีอยู่แล้ว ไม่เพิ่ม UI ใหม่).
3. **Login / Signup / Forgot / Reset / LIFF callback** — เปลี่ยน static "MOOM" → `<BrandMark />`.

### Step C — Static Shell
1. **`index.html`** — แก้ `<title>`, meta description, og:title/description/image, favicon path (ใช้ค่าเริ่มจาก `DEFAULT_BRAND` + runtime override จาก `BrandStyleInjector`).

### Step D — Verify ปุ่ม + RBAC ในหน้า Settings Branding
1. เพิ่ม `src/pages/settings/SettingsBranding.test.tsx` — ตรวจ:
   - 4 roles (Owner/Admin/Trainer/Front desk) → ปุ่ม Save/Reset/Revert/Export แสดงตาม `can('settings','write')`
   - กด Reset → form reset เป็น `DEFAULT_BRAND`
   - กด Save (mock) → trigger mutation + toast
   - กด Export → trigger JSON download (mock `URL.createObjectURL`)
   - Upload logo → เรียก `useImageUpload` mock
2. เพิ่ม `src/contexts/BrandContext.test.tsx` — apply CSS vars ตรง + `document.title` sync

### Step E — i18n & Help/Docs Sync
1. ตรวจ keys ใน `src/i18n/locales/{en,th}.ts` ใต้ `settings.branding.*` ให้ครบ (เพิ่ม key ที่ขาด)
2. อัปเดต:
   - `docs/audit-frontend.md` — section "Brand propagation"
   - `docs/SMOKE_TEST.md` — เพิ่ม Brand checklist (8 ข้อ: save→sidebar, save→login, save→title, reset, export, upload logo, color preset, font change)
   - `docs/CONTRACTS.md` — เพิ่ม "Brand Kit Contract" (settings.section='branding', key='brand_kit', shape = `BrandKit`)
   - `docs/DEVLOG.md` — append entry
   - `docs/data-contract-yourgym.md` — sync กับ `BrandKit` type จริง
3. **`docs/audit-brand.md` (new)** — RBAC matrix + button trace + consumer list

### Step F — Regression Guards (กัน AI พังของเดิม)
1. **`src/contexts/BrandContext.test.tsx`** — contract: brand context ต้อง expose `brand.name`, `brand.primary`, `brand.logoUrl`
2. **`src/components/branding/BrandMark.test.tsx`** — render ด้วย DEFAULT_BRAND + custom brand
3. **`scripts/check-brand-consumers.mjs` (new)** — สแกน `Sidebar/Header/MobilePageHeader/Login*/Signup*` ห้าม hardcode คำว่า `MOOM` หรือ `moom` (ยกเว้นเป็น default brand) → CI fail
4. **`PROTECTED_FILES.md`** — เพิ่ม Tier-1: `BrandContext.tsx`, `BrandTokens.ts`, `useBrandKit.ts`, `brandDefaults.ts`, `BrandMark.tsx`
5. **`AI_GUARDRAILS.md`** — เพิ่ม Rule 15: "ห้าม hardcode ชื่อยิม/โลโก้/สี — ใช้ `useBrand()` หรือ `<BrandMark/>` เท่านั้น"
6. **`.github/workflows/quality.yml`** — เพิ่ม step รัน `check-brand-consumers.mjs`

## 4. สิ่งที่ต้องเก็บไว้ (Preserve)
- `useBrandKit` query/mutation signatures (callers ใช้อยู่)
- `applyBrandFromKit` signature
- `SettingsBranding` UI layout / ปุ่มเดิม (เฉพาะลบ `return () => applyBrandFromKit(saved)` line เดียว)
- `settings` table schema (ไม่มี migration)
- RLS / auth ทั้งหมด
- Existing 164 tests

## 5. Out of Scope
- Multi-brand per location (ตอนนี้ 1 brand/ทั้ง org)
- Edit เอกสาร help ที่ไม่เกี่ยว brand
- ไม่แตะ edge functions (PDF receipt / email) ในรอบนี้ — จดเป็น TODO ใน DEVLOG

## 6. Regression Checklist
- [ ] บันทึก brand แล้ว reload → sidebar / login / title อัปเดต
- [ ] รีเซ็ตเป็น default → ทุกที่กลับ DEFAULT_BRAND
- [ ] 4 roles เห็น/ไม่เห็นปุ่มถูกต้อง
- [ ] `bun run test` ผ่านทั้งหมด (เป้า 175+ จาก 164)
- [ ] `bun run build` ผ่าน (TS strict-loose ยังเดิน)
- [ ] i18n parity 100%
- [ ] CI brand-consumers scan ผ่าน
- [ ] ไม่มีจุดอื่นใน UI พัง (manual smoke 8 ข้อ)

## 7. ผลลัพธ์
- ✅ ตั้งค่าแบรนด์ครั้งเดียว → ทุกหน้าตรงกันอัตโนมัติ
- ✅ Help/docs/smoke test sync กับ feature จริง
- ✅ AI editor รุ่นถัดไปแก้ของเดิมไม่ได้ง่ายๆ (protected + lint + test)
