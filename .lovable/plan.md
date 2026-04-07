

# Font System + Default Language + Email Lowercase

## สิ่งที่ต้องเปลี่ยน 3 อย่าง

### 1. เปลี่ยน Font ทั้งระบบ: Sarabun → IBM Plex Sans Thai + Inter

| # | File | Change |
|---|------|--------|
| 1 | `index.html` | เปลี่ยน `lang="en"` → `lang="th"` |
| 2 | `src/index.css` | เปลี่ยน Google Fonts import จาก Sarabun → IBM Plex Sans Thai (300-700) + Inter (300-800), เปลี่ยน `font-family` ใน body |
| 3 | `tailwind.config.ts` | เปลี่ยน `fontFamily.sans` จาก `['Sarabun', ...]` → `['IBM Plex Sans Thai', 'Inter', 'system-ui', 'sans-serif']` |

### 2. Default Language เป็นไทยทั้ง Admin + Member

| # | File | Change |
|---|------|--------|
| 4 | `src/i18n/index.ts` | เปลี่ยน `lng: 'en'` → `lng: 'th'` |
| 5 | `src/contexts/LanguageContext.tsx` | เปลี่ยน default fallback จาก `'en'` → `'th'` (เมื่อไม่มี localStorage) |

### 3. Email ต้องเป็นตัวเล็กเสมอ (lowercase)

เพิ่ม `toLowerCase().trim()` ที่ email input ทุกจุดที่รับค่าจากผู้ใช้:

| # | File | Change |
|---|------|--------|
| 6 | `src/components/members/wizard/StepContact.tsx` | เพิ่ม `onChange` ที่ lowercase email |
| 7 | `src/components/members/EditMemberDialog.tsx` | เพิ่ม email lowercase transform |
| 8 | `src/components/leads/CreateLeadDialog.tsx` | เพิ่ม email lowercase transform |
| 9 | `src/pages/Auth/MemberSignup.tsx` | เพิ่ม email lowercase ก่อน submit |
| 10 | `src/pages/Auth/MemberLogin.tsx` | เพิ่ม email lowercase ก่อน submit |
| 11 | `src/pages/Auth/AdminLogin.tsx` | เพิ่ม email lowercase ก่อน submit |
| 12 | `src/pages/Auth/Login.tsx` | เพิ่ม email lowercase ก่อน submit |
| 13 | `src/pages/Auth/Signup.tsx` | เพิ่ม email lowercase ก่อน submit |
| 14 | `src/components/staff/CreateStaffDialog.tsx` | เพิ่ม email lowercase transform |

เพิ่ม CSS class `lowercase` ให้ email input fields เพื่อ visual feedback ว่าระบบ normalize แล้ว

## สิ่งที่ไม่เปลี่ยน
- Logic ทั้งหมด (auth, CRUD, RLS, routing)
- i18n translation keys (ใช้ของเดิม)
- Color system, spacing, layout
- DB trigger (แก้ไปแล้วใน migration ก่อนหน้า — ใช้ `lower()` แล้ว)

## Smoke Test
1. Font ใหม่แสดงผลถูกต้องทั้งภาษาไทยและอังกฤษ
2. เปิดครั้งแรก (ไม่มี localStorage) → แสดงภาษาไทย
3. Admin dashboard แสดงภาษาไทย by default
4. Member app แสดงภาษาไทย by default
5. กรอก email ตัวใหญ่ → แสดงเป็นตัวเล็กอัตโนมัติ
6. สมัครสมาชิก/ล็อกอิน email ตัวใหญ่ → ส่งเป็นตัวเล็ก
7. Dark mode ยังแสดงผลปกติ

