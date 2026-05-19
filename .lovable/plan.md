## 1. ขอบเขต

ต่อยอดงาน Brand Kit ที่ propagate แล้ว ด้วย 4 ส่วน:

| # | งาน | Deliverable |
|---|---|---|
| A | Playwright E2E: Save brand → ทุกหน้าอัปเดต | `e2e/brand-propagation.spec.ts` |
| B | CSS-var coverage guard: `BrandTokens` ครอบทุก var ที่ใช้จริง + ไม่ตกหล่นข้าม theme | `src/components/admin-ds/BrandTokens.test.ts` + helper |
| C | SMOKE_TEST edge cases (logoUrl ว่าง / name ว่าง / save ซ้อนกัน) | append `docs/SMOKE_TEST.md` |
| D | Audit + scanner สำหรับ edge functions (email/invite/receipt/notification) | `docs/audit-brand-backend.md`, ขยาย `check-brand-consumers.mjs` |

## 2. รายละเอียดแต่ละ Step

### A — Playwright E2E
ไฟล์ใหม่ `e2e/brand-propagation.spec.ts`
1. login admin (helper เดิม), seed `settings.branding.brand_kit` ผ่าน supabase REST → set `name='E2E BRAND ' + nonce`, ลบ `logoUrl`
2. ไป `/settings/branding`, อ่านชื่อช่อง name ตรงกับ seed
3. แก้ name → "E2E NEW " + nonce, กด **Save** → assert toast
4. ตรวจครบ 3 จุด:
   - Sidebar header text contains new name
   - Sidebar footer "© {year} {new name}"
   - `await page.title()` === new name
   - `link[rel~='icon']` href แล้ว set ถ้า logoUrl != ''
5. cross-surface: navigate `/lobby`, `/members`, `/login` (logout flow) — title ยังตรงทุกหน้า
6. cleanup: restore เป็น `DEFAULT_BRAND` snapshot ที่ snapshot ตอนเริ่ม
7. skip gracefully ถ้า E2E secrets ไม่มี (เหมือน qr-checkin.spec)

### B — CSS-vars Coverage Guard
ไฟล์ใหม่ `src/components/admin-ds/BrandTokens.test.ts`
- อ่าน `src/index.css` ดิบ → regex หาทุก `var(--xxx)` ที่ใช้ใน rules ของ `index.css`
- เทียบกับ `BrandToken` union — assert ว่า var ที่ผูกกับแบรนด์ (primary, accent, radius, font-admin, sidebar-*) ปรากฏใน `BrandToken` enum
- เทียบ light vs dark mode: parse `:root { … }` block และ `.dark { … }` block, assert: ทุก key ใน `:root` ต้องมีใน `.dark` (และในทางกลับ) — ถ้าตกหล่นจะ fail พร้อมรายชื่อ var
- เทียบ `applyBrandFromKit` (`KEYS_TOUCHED`) กับ `BrandKit` fields → assert ทุก field สีในkit ถูก map (primary→--primary, accent→--accent, radius→--radius, font→--font-admin); ถ้ามี field ใหม่ใน BrandKit ต้องประกาศ map หรือ skip อย่างชัดเจน

### C — SMOKE_TEST Edge Cases
Append section "Brand Kit — Edge Cases" 8 ข้อ:
1. `logoUrl` ว่าง → favicon คงเดิม (ไม่ลบ tab icon)
2. `name` ว่าง → fallback เป็น `DEFAULT_BRAND.name` (ไม่ปล่อย title ว่าง)
3. Save 3 รอบติด ภายใน 5 วินาที → ไม่มี race / sidebar แสดงค่าสุดท้าย
4. เปลี่ยน primary color → CSS var `--primary` เปลี่ยน, dark mode toggle แล้วยังตรง
5. Reset → ทุก surface revert เป็น DEFAULT_BRAND
6. Upload logo ใหญ่ >2MB → toast error, brand เดิมไม่ถูกทับ
7. ปิด browser แล้วเปิดใหม่ → brand persistent (โหลดจาก DB)
8. Trainer login → เปิด Settings/Branding → ปุ่ม Save disabled แต่ preview ได้

### D — Backend / Email Audit
ไฟล์ใหม่ `docs/audit-brand-backend.md`
- ตาราง consumer ทุก edge function: `invite-staff`, `auto-notifications`, `daily-briefing`, `approve-slip`, `sell-package`, `stripe-*`, `line-auth` — สถานะปัจจุบัน "ยังไม่มี email/PDF body ที่ embed ชื่อแบรนด์"
- จุดที่ "ถ้าเพิ่ม email template ต้องผ่าน brand source": ระบุว่าควรใช้ `settings.branding.brand_kit` ผ่าน supabase service role ใน edge function (snippet ตัวอย่าง)
- กฎข้อใหม่: ห้าม hardcode brand string ใน edge function file ใหม่ที่มี keyword `email|invoice|receipt|invite|html`

ขยาย `scripts/check-brand-consumers.mjs`:
- เพิ่ม dynamic scan โหมดที่ 2: walk `supabase/functions/**/*.ts`, ข้าม `_shared/` และ comments
- ถ้าเจอ literal `MOOM`, `MOOM CLUB`, `Moom Club`, หรือ `hello@moom.co` ในไฟล์ที่มีหนึ่งใน keyword `mail|email|invoice|receipt|invite|sendgrid|resend|html` → fail
- การจับ CORS allowlist (`https://admin.moom.fit`) **ไม่นับ** (regex จงใจ match แค่ literal brand ในบริบท content)

อัปเดต `AI_GUARDRAILS.md` Rule 15 ให้ครอบ edge functions และ link ไปยัง `docs/audit-brand-backend.md`.

## 3. ที่ต้องเก็บไว้
- `useBrandKit`, `BrandProvider`, `BrandMark` signature
- โครง `BrandTokens.ts` + `applyBrandFromKit`
- 171 tests เดิม + 7 brand tests
- CORS allowlist ใน edge functions (เป็น infra, ไม่ใช่ brand display)
- Playwright qr-checkin.spec ที่มีอยู่

## 4. Out of Scope
- ไม่สร้าง email template จริง (จะทำตอนมี integration)
- ไม่แตะ DB schema
- ไม่ refactor `useBrandKit` ให้ realtime-subscribe (TanStack invalidate ก็พอ)

## 5. Regression Checklist
- [ ] `bun run test` ≥ 171 tests + ใหม่ ~5 (BrandTokens coverage)
- [ ] `bun run build` ผ่าน
- [ ] `node scripts/check-brand-consumers.mjs` ผ่าน (frontend + backend modes)
- [ ] `bunx playwright test brand-propagation.spec.ts` ผ่าน (เมื่อมี E2E secrets) หรือ skip clean
- [ ] CI workflow ไม่เพิ่ม step ใหม่ (script เดิม `check-brand-consumers.mjs` รับงาน backend mode ด้วย)
- [ ] i18n parity ยัง 100%

## 6. ผลลัพธ์
- จับ regression brand ได้ทั้ง frontend และ backend อัตโนมัติ
- มี E2E จริงยืนยันว่า Save → Sidebar/Header/Title/Favicon update
- CSS vars ไม่ตกหล่นระหว่าง light/dark
- เคสขอบเขต (ว่าง / save ติดกัน) อยู่ใน smoke checklist
