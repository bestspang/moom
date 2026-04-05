# Development Log — MOOM Fitness Platform

---

## 2026-04-05 — Strategic Business Intelligence Upgrade

### Changes
- **useCohortRetention hook**: groups members by join month, calculates retention at 1/3/6/12 months
- **usePeakHourRevenue hook**: estimates revenue per time slot
- **useInsightsMetrics**: added RPV (Revenue Per Visit) + totalCheckins
- **Insights page**: Retention tab with cohort table + chart, RPV KPI, benchmark indicators, peak hour revenue heatmap
- **StatCard**: subtitle prop widened to ReactNode
- **i18n**: 30+ new keys EN/TH

### Files: useCohortRetention.ts (NEW), usePeakHourRevenue.ts (NEW), useInsightsMetrics.ts, Insights.tsx, StatCard.tsx, en.ts, th.ts

---

## 2026-04-05 — UX/UI Full Redesign (Phase 1–5)

### User Request
Full UX/UI redesign across all surfaces (Member, Staff, Trainer) with consistency pass.

### Scope
- IN: header consistency, i18n gaps, fake button removal, visual polish, form page headers
- OUT: backend/DB/auth changes, new features

### Phases Completed

**Phase 1 — Critical Fixes**
- StaffProfilePage: added i18n for all labels, removed fake toast-only buttons (Settings, Notifications, Help)
- MemberHomePage: removed QuickMenuStrip from home, reduced section count
- MemberProfilePage: visual grouping improvements
- QuickMenuStrip: reordered items (removed Run Club as first)
- TrainerProfilePage: Coming Soon items use `opacity-60 pointer-events-none` (no chevron, no click handler)

**Phase 2 — Member Packages**
- MemberPackagesPage: added Package/ShoppingBag icons to tabs
- Added session progress bar (used/total with color coding: ≥90% red, ≥70% orange, else primary)
- Added expiry urgency colors (≤3d destructive, ≤7d orange)
- Added gamification nudge (earn XP on renewal)

**Phase 3 — Staff + Trainer Polish**
- StaffHomePage: added recent check-ins section (queries member_attendance, latest 5)
- TrainerHomePage: added tap hint text + clickable border on Impact card

**Phase 4 — Detail Pages**
- MemberClassDetailPage: replaced inline back button with MobilePageHeader
- MemberBookingDetailPage: same treatment

**Phase 5 — Form Pages Header Consistency**
- MemberEditProfilePage: replaced inline ArrowLeft + pt-4 pb-2 with MobilePageHeader
- MemberUploadSlipPage: same treatment, moved title from inline h1 to MobilePageHeader

### Files Touched
- `src/apps/staff/pages/StaffProfilePage.tsx`
- `src/apps/staff/pages/StaffHomePage.tsx`
- `src/apps/member/pages/MemberHomePage.tsx`
- `src/apps/member/pages/MemberProfilePage.tsx`
- `src/apps/member/pages/MemberPackagesPage.tsx`
- `src/apps/member/pages/MemberClassDetailPage.tsx`
- `src/apps/member/pages/MemberBookingDetailPage.tsx`
- `src/apps/member/pages/MemberEditProfilePage.tsx`
- `src/apps/member/pages/MemberUploadSlipPage.tsx`
- `src/apps/member/components/QuickMenuStrip.tsx`
- `src/apps/trainer/pages/TrainerHomePage.tsx`
- `src/apps/trainer/pages/TrainerProfilePage.tsx`
- `src/i18n/locales/en.ts` — added staff profile i18n keys
- `src/i18n/locales/th.ts` — added staff profile i18n keys

### Contracts Changed
- **NO** — all changes are UI/UX only

### Permissions/Security Impact
- None

### Risk & Rollback
- Pure UI changes, no data/logic risk
- Rollback: revert individual file changes

### Notes for Next Task
- All member/trainer/staff pages now use MobilePageHeader (invariant)
- Coming Soon pattern: `opacity-60 pointer-events-none` with subtitle, no click handler
- Do NOT add inline BackButton or fake toast buttons — these were intentionally removed

---

## 2026-04-05 — System-Wide Contract Sync & Bug Fixes

### User Request
Full system audit: sync all features/functions, fix contracts, remove fake UI actions, create governance docs.

### Scope
- IN: gamification event key sync, receipt flow fix, UI audit, governance docs
- OUT: full UI redesign

### Files Touched
- `src/hooks/useClassBookings.ts` — changed `class_attended` → `class_attend` in gamification emitters
- `src/hooks/useMemberDetails.ts` — changed `package_purchased` → `package_purchase` in gamification emitter
- `supabase/functions/approve-slip/index.ts` — changed `package_purchased` → `package_purchase`
- `supabase/functions/stripe-webhook/index.ts` — changed `package_purchased` → `package_purchase`
- `supabase/functions/gamification-process-event/index.ts` — added `class_attend` alias in challenge matcher & badge counter
- `src/apps/trainer/pages/TrainerProfilePage.tsx` — replaced fake toast-only buttons with disabled subtitle items
- `src/pages/Insights.tsx` — replaced fake "coming soon" report buttons with disabled state
- `src/components/reports/ReportItem.tsx` — added `disabled` and optional `onClick` props
- `src/i18n/locales/en.ts` — added `trainer.comingSoonLabel`
- `src/i18n/locales/th.ts` — added `trainer.comingSoonLabel`
- DB migration: `member_upload_slip` RPC now writes to `transfer_slips` instead of `transactions`

### Contracts Changed
- **YES** — Gamification emitter keys: all emitters now use `gamification_rules.action_key` format
  - `class_attended` → `class_attend` (3 call sites)
  - `package_purchased` → `package_purchase` (3 call sites)
  - Backward compatible: processor handles both in challenge/badge queries
- **YES** — `member_upload_slip` RPC: now writes to `transfer_slips` instead of `transactions`
  - Return shape changed: `transaction_id` → `slip_id`
  - Frontend caller (`services.ts`) only checks for `error` field, so compatible

### Permissions/Security Impact
- None — no RLS or auth changes

### Root Causes Found
1. **Gamification XP/Coin not awarded**: Emitters sent `package_purchased`/`class_attended` but `gamification_rules.action_key` has `package_purchase`/`class_attend` → rule lookup returned null → no rewards
2. **Receipt flow split**: `member_upload_slip` wrote to `transactions` but admin review reads from `transfer_slips` → member uploads invisible to admin
3. **Fake UI actions**: Trainer profile had 3 toast-only buttons that appeared clickable; Insights had 3 "coming soon" report exports that appeared functional

### Risk & Rollback
- Gamification: if `class_attend` key doesn't match rules, XP won't be awarded (same as before but now fixable). Rollback: revert emitter keys
- Receipt: old slips in `transactions` table remain untouched. New uploads go to `transfer_slips`. No data loss
- UI: purely cosmetic changes, no logic risk

### Smoke Steps Performed
- Verified gamification_rules.action_key values in live DB
- Verified status_tier_sp_rules.action_key values in live DB  
- Verified member_upload_slip RPC source code
- Cross-referenced all emitter call sites
- Confirmed processor handles both key formats in badge/challenge queries

### Notes for Next Task
- The DB enum `gamification_event_type` still has legacy names (`class_attended`, `package_purchased`) — these are in `types.ts` (read-only) and don't affect runtime since emitters send plain strings
- `activity_log` event_type still uses `package_purchased` for activity logging (not gamification) — this is intentional and separate from the gamification contract
- Consider adding DB enum migration to rename legacy values in a future task (low priority, non-breaking)
