
## System analysis

ตรวจสอบไฟล์ที่เกี่ยวข้องและพบว่า **โครงสร้างหลักมีอยู่แล้ว** จากรอบก่อน ๆ:

| Area | ไฟล์ | สถานะปัจจุบัน |
|---|---|---|
| Header | `src/components/layout/Header.tsx` | ✅ Bell + unread badge, ✅ Avatar dropdown (Edit profile/Logout) มี i18n แล้ว, ⚠️ ปุ่ม "เช็คอิน" ยังไม่มี RBAC guard และไม่มี toast feedback, ⚠️ Logout ไม่มี toast |
| Sidebar | `src/components/layout/Sidebar.tsx` | ✅ ใช้ DS tokens (`sidebar-*`) เกือบทั้งหมด, ⚠️ logo gradient hardcoded `hsl(14 90% 48%)` |
| Command Palette | `src/components/command-palette/CommandPalette.tsx` | ✅ เปิดด้วย ⌘K, ✅ ฟัง event `moom:open-command-palette` จากปุ่ม search ใน Header แล้ว, ✅ มี Pages/Quick Actions/People search |
| Search trigger | Header center pill | ✅ dispatch event แล้ว |

→ ส่วนใหญ่เสร็จแล้ว เหลือเป็น **gap เล็ก ๆ ด้าน RBAC/feedback/token hygiene** เท่านั้น

## Problem list (gap ที่เหลือจริง)

1. **ปุ่มเช็คอินใน Header** — ไม่เช็ค permission ก่อน navigate (ทุก role กดได้รวม `level_1_minimum` ที่อาจไม่มีสิทธิ์ check-in)
2. **Logout** ไม่มี toast แจ้งผล (success/error) → ผู้ใช้ไม่รู้สถานะ
3. **Sidebar logo** มี hardcoded color `hsl(14 90% 48%)` ปนกับ token → ขัดหลัก "ไม่ hardcode" ของผู้ใช้
4. **Avatar dropdown** items "Member App / Trainer App" แสดงให้ทุก user แม้ไม่มี role นั้น (เทียบกับ `MemberHeader.tsx` ที่เช็ค `hasAdminAccess / hasTrainerAccess`)
5. **Mark-as-read** error ของ Bell ไม่มี toast feedback

## Design

หลักการ:
- **Surgical diffs**: แตะเฉพาะ Header.tsx + Sidebar.tsx (gradient line) + เพิ่ม token + i18n keys
- **RBAC**: ใช้ `usePermissions().can('lobby','write')` (lobby = check-in domain ที่มีอยู่แล้ว) — ถ้าไม่มี write → ซ่อนปุ่ม
- **Toast i18n**: เพิ่ม keys `header.logoutSuccess/Error`, `header.checkinDenied` ทั้ง EN/TH
- **Token hygiene**: เพิ่ม `--sidebar-primary-glow` ใน `src/index.css` แล้วเปลี่ยน gradient ของ logo เป็น token-only (ไม่แตะ shadcn/ui)
- **Surface switcher**: เช็ค role ก่อนแสดง (เหมือน MemberHeader)

## Plan (files + risks)

### 1. `src/index.css`
- เพิ่ม `--sidebar-primary-glow: 14 90% 48%;` ใน `:root` และ `.dark`
- Risk: ต่ำ — แค่เพิ่ม token

### 2. `src/components/layout/Sidebar.tsx`
- บรรทัด 352: เปลี่ยน `hsl(14 90% 48%)` → `hsl(var(--sidebar-primary-glow))`
- ไม่แตะส่วนอื่น

### 3. `src/components/layout/Header.tsx`
- เพิ่ม `import { usePermissions } from '@/hooks/usePermissions'` + `import { toast } from 'sonner'`
- ดึง `can` + เช็ค `hasAdminAccess` (level_3+), `hasTrainerAccess` (level_2+) จาก `allRoles`
- ปุ่ม Check-in: render เฉพาะเมื่อ `can('lobby','write')`; เพิ่ม `toast.error(t('header.checkinDenied'))` fallback (defensive ถ้าโดน trigger ทางอื่น)
- Logout: `try { await signOut(); toast.success(t('header.logoutSuccess')); navigate('/login') } catch { toast.error(t('header.logoutError')) }`
- Surface switcher items: gate ด้วย `hasAdminAccess`/`hasTrainerAccess` (เลียน `MemberHeader.tsx`)
- Bell mark-as-read: เพิ่ม `onError` toast ใน `useMarkAsRead` หรือ inline `mutate(id, { onError })`

### 4. `src/i18n/locales/{en,th}.ts`
เพิ่ม keys:
- `header.logoutSuccess` / `header.logoutError`
- `header.checkinDenied`
- `header.notificationError`

### 5. (ไม่แตะ) `CommandPalette.tsx`, `Sidebar` taxonomy, `useNotifications.ts` — ทำงานถูกแล้ว

## Regression checklist

- [ ] `bun run build` ผ่าน
- [ ] ⌘K / Ctrl+K ยังเปิด palette ได้
- [ ] กดปุ่ม search pill ยังเปิด palette
- [ ] Bell แสดง unread count + ดรอปดาวน์เหมือนเดิม
- [ ] Avatar dropdown แสดง Edit profile + Logout เสมอ; Member/Trainer App แสดงเฉพาะ role ที่มีสิทธิ์
- [ ] ปุ่มเช็คอิน: master/manager/operator เห็น, minimum ไม่เห็น (หรือเห็นแบบ disabled ตาม custom permission)
- [ ] Logout มี toast success + redirect /login
- [ ] Sidebar logo gradient ยังเป็นสีส้ม (จาก token)
- [ ] ไม่มี hardcoded color เหลือใน Sidebar.tsx
- [ ] EN/TH locales sync (`scripts/compare-i18n.mjs` ไม่ขึ้น missing key)

## Doc updates

- `docs/DEVLOG.md`: append entry "Header RBAC + token hygiene"
- ไม่ต้องแก้ CONTRACTS/PROJECT_MEMORY (ไม่กระทบ contract)

---

**Scope summary**: 4 ไฟล์แก้, 1 ไฟล์เพิ่ม token, ไม่แตะ DB / edge functions / routing / shadcn primitives ตามขออนุมัติเพื่อ implement
