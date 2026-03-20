

# Cross-System Consistency Audit — Findings & Plan

## Audit Summary

I inspected all documentation, database functions, edge functions, frontend components, i18n, and realtime sync. Here are the confirmed issues — each verified down to root cause.

---

## Issues Found

### 1. `useRealtimeSync.ts` missing Status Tier tables (Cache Staleness)

**Root cause:** `member_status_tiers` and `sp_ledger` are not in the `TABLE_INVALIDATION_MAP`. When a tier is re-evaluated or SP is written, the React Query cache is NOT automatically refreshed.

**Impact:** After a member earns SP (e.g., checks in, attends class), the `StatusTierBadge` on HomePage/ProfilePage/MomentumCard keeps showing stale tier data until manual page refresh.

**Fix:** Add `member_status_tiers` and `sp_ledger` to the TableName union and invalidation map:
- `member_status_tiers` → invalidates `['member-status-tier']`
- `sp_ledger` → invalidates `['member-status-tier']` (SP changes trigger tier re-eval)

### 2. `docs/PLATFORM_CONTRACT.md` missing all gamification Edge Functions (Doc Gap)

**Root cause:** Section 5 only lists 7 original edge functions. The 8 gamification functions (`gamification-process-event`, `gamification-redeem-reward`, `gamification-assign-quests`, `gamification-claim-quest`, `gamification-issue-coupon`, `gamification-admin-ops`, `sync-gamification-config`, `streak-freeze`) are completely absent.

**Impact:** Any developer (or AI) referencing this contract will not know these functions exist, their access levels, or their purpose.

**Fix:** Add all 8 gamification functions to Section 5 with their purpose and access level. Also remove the "Planned" section items that are now implemented as RPCs (`create_booking_safe`, `cancel_booking_safe`).

### 3. `docs/data-contract.md` missing gamification tables (Doc Gap)

**Root cause:** The data contract ends at Section 18 (Notifications). None of the gamification tables are documented — no `member_gamification_profiles`, `xp_ledger`, `points_ledger`, `sp_ledger`, `gamification_rules`, `badge_earnings`, `quest_instances`, `squads`, `member_status_tiers`, etc.

**Impact:** The data contract is the "canonical source of truth for the entire application" (per project memory) but is incomplete. The Realtime Subscriptions list at the bottom is also missing gamification tables.

**Fix:** Add Section 19 (Gamification) and Section 20 (Status Tiers) documenting all gamification tables, key columns, activity log events, and update the Realtime Subscriptions list.

### 4. `GamificationStatusTiers.tsx` distribution query uses `as` cast (Minor Type)

**Root cause:** Line 53: `(r as { current_tier: string }).current_tier` — the type from Supabase `select('current_tier')` should already be typed, but the `as` cast is used defensively.

**Impact:** Negligible — cosmetic. The previous "fix" round missed this.

**Fix:** Clean up the cast by extracting the typed row properly.

---

## What Is Verified Working (No Changes Needed)

- `evaluate_member_tier` DB function: Uses correct `event_type` column on `sp_ledger` ✅
- Extra criteria logic: Platinum (monthly quest), Diamond (challenge), Black (2-of-4) all checked ✅
- Edge function SP writing: Correct package term lookup + shop formula ✅
- SP rules seed data matches user spec exactly ✅
- Tier rules seed data matches user spec exactly ✅
- `ECONOMY_V2.md` Section 9 SP caps match DB ✅
- `gamification-event-map.md` SP column matches DB ✅
- StatusTierBadge, StatusTierCard, MomentumCard (with tier) — all rendering correctly ✅
- MemberHomePage has StatusTierBadge in greeting ✅
- MemberProfilePage has StatusTierBadge ✅
- i18n EN + TH complete for all status tier strings ✅
- All gamification edge functions have standardized CORS ✅

---

## Implementation Plan

| # | File | Change | Risk |
|---|------|--------|------|
| 1 | `src/hooks/useRealtimeSync.ts` | Add `member_status_tiers` and `sp_ledger` to table list + invalidation map | Zero — additive only |
| 2 | `docs/PLATFORM_CONTRACT.md` | Add 8 gamification Edge Functions to Section 5, update Planned section | Zero — doc only |
| 3 | `docs/data-contract.md` | Add Sections 19-20 for gamification + status tier tables, update Realtime list | Zero — doc only |
| 4 | `src/pages/gamification/GamificationStatusTiers.tsx` | Remove `as` cast on distribution row | Zero — cosmetic |

### Safety: All changes are purely additive (realtime subscription) or documentation-only. No existing logic is modified.

---

## Feature Suggestions (Verified Safe)

After thorough analysis, here are features that would add value without touching existing working logic:

**1. Scheduled Tier Evaluation Cron** — Currently tiers are only evaluated on-demand when a member views their profile. A background cron (Edge Function) running daily would keep all member tiers current. This is a new function, no existing code modified.

**2. Tier Change Notification** — When `evaluate_member_tier` detects a tier change (upgrade or downgrade), insert a row into `notifications` table. Currently tier changes are silent. This would be a small addition inside the DB function's UPSERT block.

**3. Admin Tier Override** — Add a "Manual Tier Set" option to `gamification-admin-ops` for edge cases (e.g., Black tier manual review). Currently the admin ops function supports XP/coin adjustments and badges but not tier overrides.

