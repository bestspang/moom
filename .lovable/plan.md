

# Comprehensive Audit: MemberDetails & Cross-Feature Consistency

## Issues Found

### 1. Missing i18n keys — `common.created` and `common.saved` (HIGH)
**Root cause**: `useMemberDetails.ts` uses `t('common.created')` (4 places) and `t('common.saved')` (3 places), but **neither key exists** in `common` section of `en.ts` or `th.ts`. Users see raw keys like `common.created` as toast messages.

**Affected mutations**:
- `useCreateMemberNote` → `common.created` (line 332)
- `useCreateMemberInjury` → `common.created` (line 397)
- `useCreateMemberSuspension` → `common.created` (line 465)
- `useCreateMemberContract` → `common.created` (line 546)
- `useUpdateMember` → `common.saved` (line 364)
- `useMarkInjuryRecovered` → `common.saved` (line 424)
- `useEndMemberSuspension` → `common.saved` (line 508)

Also in `useSettings.ts` → `common.saved` (2 places).

**Fix**: Add `created: 'Created'` and `saved: 'Saved'` to `common` in both `en.ts` and `th.ts`.

### 2. Missing i18n key — `common.confirmDelete` (MEDIUM)
Used in `Announcements.tsx` (line 196) but doesn't exist in locale files.

**Fix**: Add `confirmDelete: 'Confirm Delete'` / `'ยืนยันการลบ'` to `common`.

### 3. Dead "Add Billing" button (MEDIUM)
`MemberDetails.tsx` line 673: Button renders but has **no `onClick` handler** — same pattern as the Purchase Package bug we just fixed.

**Fix**: For now, disable the button and mark it as "Coming soon" or wire it to a TODO dialog. This prevents user confusion.

### 4. Front Desk Notes fires mutation on every keystroke (HIGH)
`MemberDetails.tsx` line 861: `onChange` directly calls `updateMember.mutate()` on every character typed. This creates dozens of API calls and activity log entries per edit.

**Fix**: Use local state + debounced save (onBlur or explicit Save button).

### 5. Missing i18n keys for member tab labels (LOW-RISK, verify)
Keys like `members.tabs.home`, `members.tabs.communications`, `members.frontDeskNotes`, `members.frontDeskNotesPlaceholder`, `members.addBilling`, `members.purchasePackage`, etc. — need to verify they all exist.

---

## Implementation Plan

### Step 1: Add missing i18n keys to `en.ts` and `th.ts`
- `common.created` → `'Created'` / `'สร้างแล้ว'`
- `common.saved` → `'Saved'` / `'บันทึกแล้ว'`
- `common.confirmDelete` → `'Confirm Delete'` / `'ยืนยันการลบ'`

### Step 2: Fix Front Desk Notes (keystroke mutation)
- Add local state for notes text
- Save on blur (or add a save button)
- Remove direct `updateMember.mutate()` from `onChange`

### Step 3: Fix dead "Add Billing" button
- Add `disabled` + tooltip "Coming soon" until billing creation is implemented
- This prevents user confusion without adding incomplete functionality

### Files to modify
| File | Change |
|------|--------|
| `src/i18n/locales/en.ts` | Add `created`, `saved`, `confirmDelete` to `common` |
| `src/i18n/locales/th.ts` | Same keys in Thai |
| `src/pages/MemberDetails.tsx` | Fix notes textarea (debounce/onBlur), disable Add Billing button |

### Risk
- **Low**: All changes are additive (i18n keys) or fix existing bugs (notes, dead button)
- **Zero regression**: No existing working behavior is altered

