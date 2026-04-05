# Development Log — MOOM Fitness Platform

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
