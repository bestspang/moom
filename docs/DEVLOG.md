# Development Log — MOOM Fitness Platform

---

## 2026-04-22 (later) — Hot-fix: Atomic-RPC enum mismatch (P0 revenue path)

### What broke
Today's Phase 1 RPCs (`process_package_sale`, `process_slip_approval`) were written assuming enum names from column names — but `transactions.type` is `package_type` (not `transaction_type`), and `transaction_status` has no `'completed'` value (only `paid`). Result: every package sale and every slip approval would have thrown `42704: type "transaction_type" does not exist` or `22P02: invalid input value`. Stripe webhook also called `process_stripe_payment` which never existed.

### Fixes (5 migrations)
1. **`process_package_sale`** — `p_type::transaction_type` → `p_type::package_type`; `'completed'::transaction_status` → `'paid'::transaction_status`
2. **`process_slip_approval`** — same enum corrections; default `package_type` `'class'` → `'session'`
3. **`process_stripe_payment`** — created (was missing). Idempotent on transaction id; updates status → `paid`, inserts billing line, creates `member_packages` entitlement, writes `activity_log`. Service-role only.
4. **Roles cleanup** — removed duplicate empty "Finance Officer" (`455fe2f3…`); the working `4ac943b7…` (3 perms) remains.
5. **`smoke_test_payment_flow()`** — manager-only diagnostic that asserts every payment-relevant enum cast + RPC presence; run after any payment migration.

### Guardrail added
`AI_GUARDRAILS.md` Rule 8 — Verify enums and column types BEFORE writing any DB INSERT/UPDATE/cast. Mandatory `information_schema.columns` + `enum_range` query before authoring enum casts.

### Verified
- `pg_proc` shows all 4 RPCs present.
- Roles table now has 1 Finance role (was 2).
- `smoke_test_payment_flow()` correctly enforces manager-only authz.

### Not changed
Edge functions (`sell-package`, `approve-slip`, `stripe-webhook`) — callers send the right values, the bug was DB-side only. Frontend untouched.

---

## 2026-04-22 — Phase 0 + 1 + 2: Stabilization Sweep + AI Regression Hardening

### User request
ตรวจให้ทุก feature/function ทำงานจริง, sync เอกสาร/help/i18n, และป้องกัน AI ทำ regression ซ้ำ ๆ ในรอบถัดไป.

### Phase 0 — Build & types
- Re-audited Sprint 1 security findings — 5 of 8 already resolved during prior loops (CRON guards, RBAC checks, ghost `profiles` refs, manager checks on issue-coupon / assign-quests).
- Confirmed `bun run build` green; typed Supabase clients in edge functions.

### Phase 1 — Atomic write RPCs (race-condition hardening)
Wrapped multi-step financial / inventory writes inside Postgres `SECURITY DEFINER` functions that use `SELECT ... FOR UPDATE`:

| RPC | Replaces | Eliminates |
|-----|----------|------------|
| `process_redeem_reward` | 6-step block in `gamification-redeem-reward` | TOCTOU double-spend; oversold rewards |
| `process_package_sale` | Multi-step writes in `sell-package` | Partial state on mid-flow failure (transaction without entitlement) |
| `process_slip_approval` | Multi-step approval in `approve-slip` | "Paid but no package" orphan state |

Edge functions refactored to call `.rpc(...)` instead of issuing N queries. CORS / auth guards / response envelopes preserved.

### Phase 2 — i18n + UX
- Re-audit found TH/EN parity already at 100% (2742 / 2742 keys) — no missing keys.
- `MemberRunClubPage` is a passive info page (no interactive elements) — Coming Soon pattern verified compliant; no edit needed.

### Phase 4 (inline) — AI Regression Prevention layer
- **`AI_GUARDRAILS.md`** (new, root) — 7-rule mandatory pre-edit checklist.
- **`PROTECTED_FILES.md`** (new, root) — 3-tier do-not-touch list with blast-radius notes.
- **`CLAUDE.md` § 9** — both files added to "MUST READ every session" tier.
- **`docs/SMOKE_TEST.md`** — added "AI Change Verification Gate" (5-check gate).
- **`mem://ai-regression-prevention`** — memory rule auto-loaded per session.

### Files
- NEW: `AI_GUARDRAILS.md`, `PROTECTED_FILES.md`, `mem://ai-regression-prevention`, 3 atomic-RPC migrations
- EDITED (minimal): `CLAUDE.md`, `docs/CONTRACTS.md`, `docs/SMOKE_TEST.md`, `mem://index.md`, `supabase/functions/gamification-redeem-reward/index.ts`
- NOT TOUCHED (per protected-files policy): AuthContext, hostname.ts, App.tsx route table, useRealtimeSync, shadcn ui/*, supabase types/client

### Regression checks
- ✅ `bun run build` green (18.03s, 3863 modules)
- ✅ TH/EN parity 2742 / 2742 (verified via `node scripts/compare-i18n.mjs`)
- ✅ No file from `PROTECTED_FILES.md` Tier 1 was modified

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
