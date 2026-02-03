
# Phase 5: Final Polish - Remaining UX/UI Issues

## สรุป Issues ที่พบ

### 1. "Remember Me" Checkbox (Login.tsx)
**ปัญหา**: Checkbox แสดงผลแต่ไม่ทำงานจริง
**แนวทาง**: ลบออกเนื่องจาก Supabase auth จัดการ session persistence อยู่แล้ว (default คือ 1 week) - การมี checkbox ที่ไม่ทำงานสร้างความสับสน

### 2. Login & Signup Validation Messages (ไม่ใช้ i18n)
**ปัญหา**: Error messages เป็น English เท่านั้น
```typescript
// Login.tsx - hardcoded
'Please enter a valid email address'
'Password must be at least 6 characters'

// Signup.tsx - hardcoded (7 messages)
'First name is required'
'Password must contain at least one uppercase letter'
// etc.
```
**แนวทาง**: ใช้ `useMemo` pattern เหมือน CreateMemberDialog

### 3. Date Localization - เดือนแสดงเป็น English เท่านั้น
**ปัญหา**: ทุกหน้าใช้ `format(date, 'd MMM yyyy')` ทำให้แสดง "3 FEB 2026" แม้เลือกภาษาไทย
**Files ที่ได้รับผลกระทบ**:
- `DatePicker.tsx`
- `DateRangePicker.tsx`
- `formatters.ts`
- `Lobby.tsx`, `Finance.tsx`, `TransferSlips.tsx`
- `Promotions.tsx`, `Classes.tsx`, `ActivityLog.tsx`
- `Announcements.tsx`, `Leads.tsx`

**แนวทาง**: 
1. สร้าง `getDateLocale()` helper ใน `formatters.ts`
2. ใช้ `date-fns/locale` (th, enUS)
3. แก้ทุก format call ให้รับ locale

### 4. Hardcoded Text ใน Date Pickers
| File | Text | แนวทาง |
|------|------|--------|
| DatePicker.tsx | "Pick a date" | ใช้ t('common.pickDate') |
| DateRangePicker.tsx | "Pick a date range" | ใช้ t('common.pickDateRange') |

### 5. formatRelativeTime - Hardcoded English
**ปัญหา**: "just now", "5m ago", "2h ago", "3d ago" ไม่มี i18n
**แนวทาง**: เพิ่ม parameter `language` และใช้ i18n keys

### 6. Lobby.tsx - "Unlimited" Hardcoded
**Line 42**: `return remaining !== null ? ... : 'Unlimited'`
**แนวทาง**: ใช้ `t('packages.unlimited')`

### 7. EditMemberDialog.tsx - หลาย hardcoded strings
| Line | Text | แนวทาง |
|------|------|--------|
| 157 | "Nickname" | t('form.nickname') |
| 181 | "Date of Birth" | t('form.dateOfBirth') |
| 190 | "Gender" | t('form.gender') |
| 196 | "Select..." | t('form.selectGender') |
| 199-201 | "Male/Female/Other" | t('form.male/female/other') |
| 226 | "Address" | t('form.address') |
| 31-39 | Validation messages | useMemo pattern |

### 8. Profile.tsx - Save ไม่ทำงานจริง
**ปัญหา**: `handleSave()` แค่แสดง toast ไม่ได้ update ข้อมูลไป Supabase
**แนวทาง**: Implement actual profile update using Supabase `auth.updateUser()`

### 9. CreatePackage.tsx - Hardcoded Placeholders
| Line | Text | แนวทาง |
|------|------|--------|
| 179 | "Package name" | t('packages.create.packageNamePlaceholder') |
| 435 | "Package description..." | t('packages.create.descriptionPlaceholder') |

---

## Implementation Plan

### Step 1: Update i18n Locales
เพิ่ม keys ใหม่ใน `en.ts` และ `th.ts`:
```typescript
common: {
  pickDate: 'Pick a date' / 'เลือกวันที่',
  pickDateRange: 'Pick a date range' / 'เลือกช่วงวันที่',
},
time: {
  justNow: 'just now' / 'เมื่อสักครู่',
  minutesAgo: '{n}m ago' / '{n} นาทีก่อน',
  hoursAgo: '{n}h ago' / '{n} ชม.ก่อน',
  daysAgo: '{n}d ago' / '{n} วันก่อน',
},
validation: {
  // Add all validation messages for Login & Signup
}
```

### Step 2: Update formatters.ts
```typescript
import { th, enUS } from 'date-fns/locale';

export function getDateLocale(language: string) {
  return language === 'th' ? th : enUS;
}

export function formatDate(date, language = 'en') {
  const locale = getDateLocale(language);
  return format(d, 'd MMM yyyy', { locale }).toUpperCase();
}

export function formatRelativeTime(date, language = 'en', t) {
  // Use t() for relative time strings
}
```

### Step 3: Update Date Components
- DatePicker.tsx - รับ language prop, ใช้ locale
- DateRangePicker.tsx - รับ language prop, ใช้ locale
- ทุกหน้าที่ใช้ format() ต้องส่ง locale

### Step 4: Update Login/Signup/EditMemberDialog
- ใช้ useMemo สำหรับ schema validation
- ลบ "Remember me" checkbox จาก Login

### Step 5: Implement Profile Update
```typescript
const handleSave = async () => {
  const { error } = await supabase.auth.updateUser({
    data: { first_name: firstName, last_name: lastName }
  });
  // Handle success/error
};
```

### Step 6: Update Lobby.tsx & CreatePackage.tsx
- แก้ hardcoded strings ให้ใช้ t()

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/i18n/locales/en.ts` | เพิ่ม ~20 keys ใหม่ |
| `src/i18n/locales/th.ts` | เพิ่ม ~20 keys ใหม่ (Thai translations) |
| `src/lib/formatters.ts` | เพิ่ม locale support, update functions |
| `src/components/common/DatePicker.tsx` | locale support + i18n |
| `src/components/common/DateRangePicker.tsx` | locale support + i18n |
| `src/pages/Auth/Login.tsx` | ลบ remember me, i18n validation |
| `src/pages/Auth/Signup.tsx` | i18n validation (useMemo) |
| `src/pages/Profile.tsx` | Implement actual save |
| `src/pages/Lobby.tsx` | i18n "Unlimited" |
| `src/components/members/EditMemberDialog.tsx` | i18n labels + validation |
| `src/pages/CreatePackage.tsx` | i18n placeholders |
| `src/pages/Finance.tsx` | locale in date format |
| `src/pages/TransferSlips.tsx` | locale in date format |
| `src/pages/Promotions.tsx` | locale in date format |
| `src/pages/Classes.tsx` | locale in date format |
| `src/pages/ActivityLog.tsx` | locale in date format |
| `src/pages/Announcements.tsx` | locale in date format |
| `src/pages/Leads.tsx` | locale in date format |

**Total: ~18 files**

---

## Priority Order
1. **High**: Login/Signup validation i18n (user-facing error messages)
2. **High**: Date localization (ทุกหน้าได้รับผลกระทบ)
3. **Medium**: Profile save functionality
4. **Medium**: EditMemberDialog i18n
5. **Low**: Remove remember me checkbox
6. **Low**: CreatePackage placeholders

---

## Estimated Effort
| Task | Time |
|------|------|
| i18n locales update | 30 min |
| formatters.ts locale support | 30 min |
| DatePicker/DateRangePicker | 30 min |
| Login/Signup validation | 45 min |
| Profile save implementation | 30 min |
| EditMemberDialog i18n | 30 min |
| Other pages date format | 45 min |
| Testing | 30 min |
| **Total** | ~4-5 hours |
