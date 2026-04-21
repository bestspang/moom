# MOOM Master Fix Plan
**Generated:** 2026-04-21  
**Source:** ATLAS (Backend) + NOVA (Frontend) + REX (QA) Audits  
**Total Issues:** 50+ across 4 severity levels

---

## Executive Summary

| Priority | Count | Description |
|----------|-------|-------------|
| 🔴 P0 Critical | 8 | Security vulnerabilities + data corruption |
| 🟠 P1 High | 15 | Broken features, missing audit trail, broken i18n |
| 🟡 P2 Medium | 20+ | UX issues, inline query keys, missing headers |
| 🟢 P3 Low | 10+ | Nice-to-have improvements |

---

## 🔴 SPRINT 1 — P0 Critical (Fix NOW, Security + Data Integrity)

### S1-1: Auth Bypass in Edge Functions
**File:** `supabase/functions/auto-notifications/index.ts` + `evaluate-tiers-daily/index.ts`  
**Issue:** When `CRON_SECRET` env var not set, `null !== null` = `false`, auth guard falls through — ANY unauthenticated request can trigger cron functions  
**Fix:** Change guard to: `if (!cronSecret || authorization !== \`Bearer \${cronSecret}\`) { return 403 }`

### S1-2: Missing RBAC in sync-gamification-config
**File:** `supabase/functions/sync-gamification-config/index.ts`  
**Issue:** Comment says "manager level required" but `has_min_access_level()` never called — any member can sync gamification config  
**Fix:** Add `has_min_access_level('manager')` check before processing

### S1-3: TOCTOU Race Condition in gamification-redeem-reward
**File:** `supabase/functions/gamification-redeem-reward/index.ts`  
**Issue:** Points balance + stock checks are non-atomic (6 separate DB operations) → double-spending under concurrent requests  
**Fix:** Wrap entire redemption flow in a Postgres transaction or use a DB-level function with SELECT FOR UPDATE

### S1-4: Missing Ownership Check in gamification-assign-quests
**File:** `supabase/functions/gamification-assign-quests/index.ts`  
**Issue:** Any authenticated user can assign quests to any `member_id`  
**Fix:** Add check: caller must be staff/admin OR caller's `auth.uid()` must match `member_id`

### S1-5: Missing Ownership Check in gamification-issue-coupon
**File:** `supabase/functions/gamification-issue-coupon/index.ts`  
**Issue:** Any member can issue coupons to any other member  
**Fix:** Restrict to staff/admin OR self-redemption only

### S1-6: Missing `profiles` Table — Silent Auth Failure
**File:** `supabase/functions/gamification-process-event/index.ts` + `gamification-redeem-reward/index.ts`  
**Issue:** Both functions query `profiles` table that DOESN'T EXIST in any migration — staff check silently fails, all callers treated as non-staff  
**Fix:** Either create `profiles` migration or rewrite query to use correct table name

### S1-7: Non-Atomic Writes in sell-package
**File:** `supabase/functions/sell-package/index.ts`  
**Issue:** Multi-step writes (create transaction + deduct package credits + update member status) are NOT in a DB transaction — partial writes on failure leave inconsistent state  
**Fix:** Wrap in `BEGIN/COMMIT` transaction or use Postgres function

### S1-8: Non-Atomic Writes in approve-slip + stripe-webhook
**File:** `supabase/functions/approve-slip/index.ts` + `stripe-webhook/index.ts`  
**Issue:** Same non-atomic write issue as sell-package  
**Fix:** Same — wrap in transaction

---

## 🟠 SPRINT 2 — P1 High (Broken Features + Audit Trail)

### S2-1: Staff Payments — Wrong Column Name
**File:** `src/apps/staff/pages/StaffPaymentsPage.tsx`  
**Issue:** Uses `slip_image_url` but DB column is `slip_file_url` → staff can NEVER see payment slip image  
**Fix:** Change `slip_image_url` → `slip_file_url` (1 line fix)

### S2-2: Missing logActivity() in 9 Hooks
**Files:**
- `src/hooks/useAiSuggestions.ts`
- `src/hooks/useCheckinQR.ts`
- `src/hooks/useFeatureFlags.ts`
- `src/hooks/useGoals.ts`
- `src/hooks/useLineIdentity.ts`
- `src/hooks/useLineUsers.ts`
- `src/hooks/useNotifications.ts`
- `src/hooks/usePackageUsage.ts`
- `src/hooks/usePromotionPackages.ts`  
**Fix:** Add `logActivity(...)` call in each `onSuccess` handler

### S2-3: Missing TH Translation Keys (~75 keys)
**File:** `src/i18n/locales/th.ts`  
**Issue:** ~75 gamification keys missing → Thai users see raw key strings in gamification UI  
**Fix:** Add all missing keys to th.ts gamification namespace (copy from en.ts, translate)

### S2-4: Missing Delete Mutations
**Files:** 
- `src/hooks/useGamificationChallenges.ts` — no delete mutation
- `src/hooks/useGamificationRewards.ts` — no delete mutation  
**Fix:** Add `deleteChallenge` / `deleteReward` mutations with proper error handling + logActivity

### S2-5: usePromotionPackages — Silent Failures
**File:** `src/hooks/usePromotionPackages.ts`  
**Issue:** All mutations have NO `onError` handlers → users see nothing when operations fail  
**Fix:** Add `onError: (error) => toast.error(t('error.generic', { message: error.message }))` to all mutations

### S2-6: auto-notifications Unbounded Query
**File:** `supabase/functions/auto-notifications/index.ts`  
**Issue:** Loads ALL active members with no pagination → will OOM/timeout as user base grows  
**Fix:** Add pagination with batch size of 100, process in chunks

---

## 🟡 SPRINT 3 — P2 Medium (UX + Code Quality)

### S3-1: 5 Stub Coming Soon Buttons → Implement Real Features
- `StaffHomePage.tsx:117` — "View Schedule" → navigate to staff schedule page
- `StaffMembersPage.tsx:63` — Member row tap → create member detail page
- `TrainerWorkoutsPage.tsx:46` — Workout tap → create workout detail/log page
- `TrainerProfilePage.tsx:78` — "Notifications" → implement notifications page
- `TrainerProfilePage.tsx:83` — "Help & Support" → FAQ page or external link

### S3-2: MobilePageHeader Missing
**File:** `src/apps/member/pages/MemberCheckInPage.tsx`  
**Fix:** Add `<MobilePageHeader title={t('checkin.title')} />` at top

### S3-3: i18n Hardcoded Strings
**Files:**
- `src/components/identity/IdentityLinkingCard.tsx` — 9+ hardcoded EN strings
- `src/apps/staff/pages/StaffPaymentsPage.tsx` — "Status", "Date", "Reject", "Approve"
- `src/components/common/QueryError.tsx` — "Failed to load"
- 20+ gamification hook toast messages  
**Fix:** Replace all with `t('...')` calls + add keys to both en.ts and th.ts

### S3-4: Migrate 473 Inline Query Keys to queryKeys.ts
**Priority files (most-used hooks first):**
- All files in `src/hooks/*.ts`
- Then `src/apps/*/pages/*.tsx`
**Fix:** Add constants to `src/lib/queryKeys.ts`, replace inline strings

### S3-5: Missing Loading States
- `StaffPaymentsPage.tsx` — Approve/Reject buttons no loading spinner
- Member Purchase page — Stripe checkout button no loading state

### S3-6: Missing Error States in Forms
- Several forms show no error message when mutation fails

---

## 🟢 SPRINT 4 — P3 Low (Polish + Performance)

### S4-1: Add DB Indexes for Performance
- `member_packages.member_id` — missing index
- `activity_logs.created_at` — missing index for time-range queries
- `class_schedules.start_time` — missing index for schedule queries

### S4-2: Export Buttons in Reports/Insights
- Replace `disabled` stubs with real CSV export functionality

### S4-3: Document Coming Soon stubs with issue refs
- Add `// TODO(#123): implement feature` comments

---

## Fix Order (Recommended Execution)

```
Week 1: Sprint 1 (S1-1 through S1-8) — Security fixes FIRST
Week 2: Sprint 2 (S2-1 through S2-6) — Broken features
Week 3: Sprint 3 Part A (S3-1, S3-2, S3-3) — UX critical
Week 4: Sprint 3 Part B (S3-4, S3-5, S3-6) — Code quality
Week 5: Sprint 4 — Polish
```

---

## Audit Reports
- Backend: `docs/audit-backend.md`
- Frontend: `docs/audit-frontend.md`  
- QA: `docs/audit-qa.md`
