

# Fix: Missing i18n Keys for Purchase Package Dialog

## Problem
The Purchase Package dialog works (opens, fetches packages, assigns correctly), but the UI shows raw i18n keys instead of translated text:
- Button shows `common.saving` instead of "Saving..."
- Toast shows `common.created` instead of a success message
- Confirm button shows `common.confirm` instead of "Confirm"

**Root cause**: The `PurchasePackageDialog.tsx` and `useAssignPackageToMember` hook reference i18n keys that don't exist in the locale files:
- `common.created` — doesn't exist (only `common.create` exists)
- `common.saving` — doesn't exist (only `common.save` exists)
- `common.confirm` — doesn't exist at top level

## Fix

### 1. Add missing i18n keys to both `en.ts` and `th.ts`

Add to `common` section:
- `confirm: 'Confirm'` / `'ยืนยัน'`
- `saving: 'Saving...'` / `'กำลังบันทึก...'`

### 2. Fix the success toast in `useAssignPackageToMember`

Change `toast.success(t('common.created'))` to use an existing toast key like `toast.success(t('toast.packageAssigned'))` — and add that key to both locale files with a proper message like "Package assigned successfully" / "เพิ่มแพ็กเกจสำเร็จ".

### Files to modify
- `src/i18n/locales/en.ts` — add `common.confirm`, `common.saving`, and `toast.packageAssigned`
- `src/i18n/locales/th.ts` — same keys in Thai
- `src/hooks/useMemberDetails.ts` — change toast key from `common.created` to `toast.packageAssigned`

