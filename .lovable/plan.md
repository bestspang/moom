

# Comprehensive System Audit — Real Issues Found

## STEP 0 — Recheck: All issues verified from code

---

## Issue 1 — CRITICAL: Timezone bug in date filtering (misses check-ins at 23:00–23:59 Bangkok time)

**Root cause:** All attendance queries filter using `T00:00:00` to `T23:59:59` with `.lt()` — but `check_in_time` is stored as `timestamp with time zone` (UTC). When a user in Bangkok (UTC+7) uses the app:
- `formatDateForDB(new Date())` returns `2026-03-07` (local date)
- Query: `.gte('check_in_time', '2026-03-07T00:00:00')` — Supabase interprets this as **UTC midnight**, which is **7 AM Bangkok**
- This means check-ins from midnight to 6:59 AM Bangkok time are **missed** (attributed to previous day)
- Additionally, `.lt('2026-03-07T23:59:59')` misses the last second of the day

**Impact:** Dashboard stats, Lobby, and Gym Check-ins show incorrect counts — a check-in at 1:00 AM Bangkok won't appear for today.

**Files affected:** `useDashboardStats.ts`, `useDashboardAttendance.ts`, `useDashboardTrends.ts`, `useLobby.ts`, `ai/actions/index.ts`

**Fix:** Append Bangkok timezone offset to date strings: `${dateStr}T00:00:00+07:00` and use `${nextDateStr}T00:00:00+07:00` instead of `T23:59:59`. Create a helper `getBangkokDayRange(date: Date)` that returns `{ start, end }` ISO strings with `+07:00` offset.

---

## Issue 2 — HIGH: ~60+ hardcoded English toast messages across 15+ hooks

**Root cause:** Mutation hooks use `toast.success('...')` and `toast.error('...')` with raw English strings instead of i18n keys. The i18n fix in previous rounds only addressed page-level strings, not hook-level toasts.

**Impact:** Thai users see English success/error messages for every CRUD operation (check-in, booking, staff, rooms, locations, categories, packages, promotions, leads, feature flags, transfer slips, etc.).

**Files affected (21 files):** `useLobby.ts`, `useStaff.ts`, `useRooms.ts`, `useLocations.ts`, `useLeads.ts`, `useClassCategories.ts`, `useClassBookings.ts`, `useCheckinQR.ts`, `usePackageUsage.ts`, `useFeatureFlags.ts`, `useTransferSlips.ts`, `useLineIdentity.ts`, `useLineUsers.ts`, `useFinance.ts`, `useClasses.ts`, `usePackages.ts`, `usePromotions.ts`, `useAnnouncements.ts`, `useTrainingTemplates.ts`, `useSchedule.ts`, `StaffDetails.tsx`

**Fix:** Since hooks don't have direct access to `t()`, create a centralized toast helper that reads i18n. Either:
- (A) Import `i18n` directly from `@/i18n` and use `i18n.t()` — works outside React components
- (B) Pass a simpler pattern: use toast keys that map to `en.ts`/`th.ts`

Option A is cleanest — `import i18n from '@/i18n'; toast.success(i18n.t('toast.checkInSuccess'))` — no refactoring needed per hook.

---

## Issue 3 — MEDIUM: `useGymCheckinsByDate` missing `enabled: !!user` auth guard

**Root cause:** This hook doesn't use `useAuth()` or `enabled: !!user`, violating the project's auth-guard pattern (documented in memory). It fires immediately, potentially returning empty results during auth initialization.

**Impact:** On page load, this query may fire before auth resolves, hitting RLS and returning 0 results briefly (causes a flash of empty state on Dashboard).

**Fix:** Add `const { user } = useAuth()` and `enabled: !!user` to `useGymCheckinsByDate`.

---

## Issue 4 — MEDIUM: `useHighRiskMembers` returns hardcoded English expiry text

**Root cause:** Lines 121-127 in `useDashboardStats.ts` — `expiryText` is set to `'Expired'`, `'1 day'`, `'X days'` in English, not localized.

**Impact:** The NeedsAttentionCard shows English expiry durations even for Thai users.

**Fix:** Return raw `daysLeft` number instead of pre-formatted text, and format in the UI component using i18n.

---

## Issue 5 — LOW: Sidebar badge color — no urgency differentiation

**Root cause:** Both `expiringCount` and `pendingSlips` use `bg-destructive` (red). Expiring packages are a warning, not critical.

**Fix:** Change expiring packages badge to `bg-amber-500 text-white` in `Sidebar.tsx` line 186.

---

## Implementation Plan

### Priority 1 — Timezone fix (Issue 1)
1. Create `getBangkokDayRange(date: Date)` helper in `src/lib/formatters.ts`
2. Update all 5 files that use the `T00:00:00`/`T23:59:59` pattern

### Priority 2 — Toast i18n (Issue 2)
1. Add ~40 toast-related i18n keys to `en.ts` and `th.ts`
2. Create `src/lib/toast-i18n.ts` helper that uses `i18n.t()` directly
3. Update all 21 hook files to use localized toast messages

### Priority 3 — Auth guard fix (Issue 3)
1. Add `useAuth()` + `enabled: !!user` to `useGymCheckinsByDate` in `useDashboardAttendance.ts`

### Priority 4 — High-risk member text (Issue 4)
1. Return `daysLeft: number` instead of formatted `expiryDate: string` from `useHighRiskMembers`
2. Update `NeedsAttentionCard` to format using i18n

### Priority 5 — Sidebar badge color (Issue 5)
1. Change expiring packages badge color in `Sidebar.tsx`

### Risk Assessment
- **Timezone fix**: Logic change — affects date filtering. Must test thoroughly that counts match. No DB change.
- **Toast i18n**: Pure string replacement — zero regression risk.
- **Auth guard**: Additive `enabled` condition — may briefly delay data but prevents empty flash.
- **Badge color**: CSS-only — zero regression.

### Scope: Issues 1-5 will be implemented. Issue 2 (toast i18n) is the largest — ~21 files but all mechanical string replacements.

