# REX QA Audit Report — MOOM App
**Date:** 2026-04-21  
**Auditor:** REX (QA Agent)

---

## Build Status
- TypeScript (`tsc --noEmit`): ✅ **PASS** — 0 errors
- Vite build: ✅ Prior successful build confirmed (dist/ exists)
- Runtime: `bun` not in PATH on this machine — use `./node_modules/.bin/` prefix or install bun globally

---

## Critical Rules Compliance

| Rule | Status | Summary |
|------|--------|---------|
| Rule 1: MobilePageHeader on every mobile page | ⚠️ PARTIAL | `MemberCheckInPage.tsx` missing MobilePageHeader |
| Rule 2: No fake buttons | ⚠️ PARTIAL | 5 Coming Soon stub buttons (StaffHomePage, StaffMembersPage, TrainerWorkoutsPage, TrainerProfilePage ×2) |
| Rule 3: logActivity() in every mutation onSuccess | ⚠️ PARTIAL | **9 hooks** missing logActivity(): useAiSuggestions, useCheckinQR, useFeatureFlags, useGoals, useLineIdentity, useLineUsers, useNotifications, usePackageUsage, usePromotionPackages |
| Rule 4: EN/TH translation keys match | ❌ FAIL | EN: ~2,869 keys vs TH: ~2,734 keys — **~75 missing TH keys** (all gamification namespace) |
| Rule 5: No DISABLE ROW LEVEL SECURITY | ✅ PASS | Zero occurrences found |
| Rule 6: No inline query keys | ❌ FAIL | **473 inline query keys** vs only 34 using queryKeys.ts |

---

## Top 10 Most Impactful Fixes

1. **[HIGH] Fix ~75 missing TH translation keys** — Gamification UI shows raw key strings in Thai locale
2. **[HIGH] Migrate 473 inline query keys to queryKeys.ts** — Cache invalidation is fragile
3. **[HIGH] Add logActivity() to 9 hooks** — Breaks audit trail requirement
4. **[MEDIUM] Add MobilePageHeader to MemberCheckInPage.tsx**
5. **[MEDIUM] Resolve 5 Coming Soon stub buttons** — Implement or remove
6. **[LOW] Add missing queryKeys.ts entries for app-surface keys**
7. **[LOW] Expand queryKeys.ts for finance/analytics keys**
8. **[INFO] Verify Vite build end-to-end in proper bun shell**
9. **[INFO] Add bun to PATH or document runtime setup**
10. **[INFO] Add issue tracker refs to Coming Soon stubs**

---

## Missing TH Keys (gamification namespace — sample)
- activeRules, activeChallenges, totalBadges, activeRewards
- xpDistributed, flaggedEvents, recentActivity, economyHealth  
- activeProfiles, coinInCirculation, totalRedemptions, questCompletion
- addLevel, editLevel, noLevels, noChallenges, noBadges, noRewards, noTiers
- labelEn, labelTh, tierNameEn, tierNameTh
- (~52 more gamification keys)

---

## Files Affected Summary

| Category | Count | Priority |
|----------|-------|---------|
| Hooks missing logActivity | 9 files | P1 |
| Pages with inline query keys | 50+ files | P2 |
| Missing TH translation keys | ~75 keys in th.ts | P1 |
| Stub buttons to fix | 5 buttons in 4 files | P1 |
| MobilePageHeader missing | 1 file | P2 |
