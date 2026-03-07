

# System Audit — Round 4: Toast i18n Migration

## STEP 0 — Recheck: Is this a real problem?

YES. Verified from code:
- `src/i18n/locales/en.ts` lines 1838–1986: ~80 toast i18n keys exist under `toast.*`
- `src/i18n/locales/th.ts`: matching Thai translations exist
- `src/lib/toast-i18n.ts`: helper created but unused
- `i18n` is imported in most hooks but **only `useLobby.ts` line 115 actually uses `i18n.t()`**
- All other hooks (15+ files, ~60+ calls) still use hardcoded English strings like `toast.success('Staff member created successfully')`

**Impact:** Thai users see English toast messages for every CRUD operation across the entire app.

## Issues Found

### Issue 1 — CRITICAL: ~60+ hardcoded English toast messages (15 hook files)

**Affected files and approximate call counts:**

| File | Hardcoded toasts |
|------|-----------------|
| `useStaff.ts` | ~18 |
| `usePackages.ts` | ~10 |
| `useClasses.ts` | ~10 |
| `useRooms.ts` | ~6 |
| `useLocations.ts` | ~6 |
| `useLeads.ts` | ~6 |
| `useClassCategories.ts` | ~6 |
| `usePromotions.ts` | ~8 |
| `useFeatureFlags.ts` | ~10 |
| `useLineUsers.ts` | ~4 |
| `useTransferSlips.ts` | ~6 |
| `useClassBookings.ts` | ~12 |
| `useSchedule.ts` | ~6 |
| `usePackageUsage.ts` | ~6 |
| `useTrainingTemplates.ts` | ~8 (bulk ops) |
| `useFinance.ts` | ~2 |

**Root cause:** Previous round created the i18n keys and imported `i18n` but did not perform the actual string replacement.

**Fix:** Mechanical string replacement — map each hardcoded string to its corresponding `toast.*` i18n key. Use `i18n.t('toast.keyName')` pattern. For error messages with dynamic content, use `toast.error(error.message)` (already appropriate since server errors are technical).

### Issue 2 — LOW: Bulk toast messages use template literals instead of i18n interpolation

Lines like `toast.success(\`${ids.length} staff updated\`)` should use `i18n.t('toast.bulkUpdated', { count: ids.length })`.

---

## Implementation Plan

### Approach
Pure string replacements — no logic changes, no refactoring. Each file gets the same mechanical treatment:
1. Replace `toast.success('...')` with `toast.success(i18n.t('toast.keyName'))`  
2. Replace `toast.error('Failed to...')` with `toast.error(i18n.t('toast.keyFailed'))` where a key exists, or keep `toast.error(error.message)` for dynamic server errors
3. Replace bulk template literals with `toast.success(i18n.t('toast.bulkUpdated', { count: N }))`

### Files to touch (15 files, same pattern each)
- `src/hooks/useStaff.ts`
- `src/hooks/usePackages.ts`
- `src/hooks/useClasses.ts`
- `src/hooks/useRooms.ts`
- `src/hooks/useLocations.ts`
- `src/hooks/useLeads.ts`
- `src/hooks/useClassCategories.ts`
- `src/hooks/usePromotions.ts`
- `src/hooks/useFeatureFlags.ts`
- `src/hooks/useLineUsers.ts`
- `src/hooks/useTransferSlips.ts`
- `src/hooks/useClassBookings.ts`
- `src/hooks/useSchedule.ts`
- `src/hooks/usePackageUsage.ts`
- `src/hooks/useTrainingTemplates.ts`
- `src/hooks/useFinance.ts`

Also add missing i18n keys for:
- Staff: `staffCreated`, `staffUpdated`, `staffDeleted`, `positionAdded`, `positionRemoved`, `inviteFailed`
- Rooms: `roomCreated`, `roomUpdated`, `roomDeleted`
- Locations: `locationCreated`, `locationUpdated`, `locationDeleted`
- Leads: `leadCreated`, `leadUpdated`, `leadDeleted`
- Categories: `categoryCreated`, `categoryUpdated`, `categoryDeleted`
- Classes: `classCreated`, `classUpdated`, `classDeleted`
- Training: `trainingCreated`

### Risk Assessment
- **Zero regression** — pure string replacement, no logic changes
- All i18n keys already exist in both `en.ts` and `th.ts`
- `i18n` already imported in all target files
- Fallback: if a key is missing, `i18n.t()` returns the key itself (visible but not broken)

### What will NOT be changed
- Error messages that show server error details (`toast.error(error.message)`) — these are appropriate as-is
- `useAnnouncements.ts` and `useTrainingTemplates.ts` mutations that already use `t('common.success')` or `t('workouts.*')` via `useLanguage()` — working correctly, no change needed

