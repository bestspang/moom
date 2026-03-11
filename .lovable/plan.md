

# Status Tier System — Consistency Audit & Development Plan

## Current State Assessment

The Status Tier system (Bronze → Black) is **95% implemented**. Database tables, seed data, edge function SP writing, evaluation function, frontend components, and i18n are all in place and functional.

## Issues Found

### 1. Unnecessary `as any` casts on status tier tables (Code Quality)
All 5 status tier tables (`member_status_tiers`, `sp_ledger`, `status_tier_rules`, `status_tier_benefits`, `status_tier_sp_rules`) exist in generated types, but code still uses `as any`:

- `src/apps/member/features/momentum/api.ts` lines 1017, 1026, 1027 — `(supabase as any).from('member_status_tiers')` and `(supabase.rpc as any)('evaluate_member_tier')`
- `src/pages/gamification/GamificationStatusTiers.tsx` lines 15, 26, 37, 48 — all 4 queries use `(supabase as any)`

**Fix:** Remove `as any` casts. Note: `evaluate_member_tier` RPC IS in generated types (returns `Json`), so the cast is unnecessary.

### 2. MomentumCard missing StatusTierBadge (Feature Gap)
The plan specified showing StatusTierBadge in MomentumCard below TierBadge. Currently MomentumCard only shows Level-based TierBadge. Since MomentumCard is the primary gamification touchpoint on the home page, this is where members should first see their status tier.

**Fix:** Add StatusTierBadge to MomentumCard, fetching status tier data alongside existing profile data.

### 3. MemberHomePage missing StatusTierBadge (Feature Gap)
The plan specified showing StatusTierBadge next to the member's name on the home page. Currently not implemented.

**Fix:** Add a small StatusTierBadge in the greeting area of MemberHomePage.

### 4. Economy docs not updated with Status Tier system (Documentation Gap)
`docs/ECONOMY_V2.md` and `docs/gamification-event-map.md` have no mention of Status Tiers, SP, or the dual-track model. This is the project SSOT and must reflect the current system.

**Fix:** Add a Status Tier section to ECONOMY_V2.md covering SP earning rules, tier qualification, downgrade rules, and benefits. Add SP column to the event map.

### 5. `StatusTierBadge` tier prop uses `as any` in ProfilePage (Type Safety)
`MemberProfilePage.tsx` line 77: `<StatusTierBadge tier={statusTier.currentTier as any} />` — should cast to `StatusTier` type instead.

**Fix:** Import and use proper `StatusTier` type.

## Implementation Plan

### Files to change:

| # | File | Change |
|---|------|--------|
| 1 | `src/apps/member/features/momentum/api.ts` | Remove `as any` on `member_status_tiers` table and `evaluate_member_tier` RPC |
| 2 | `src/pages/gamification/GamificationStatusTiers.tsx` | Remove `as any` on all 4 status tier table queries |
| 3 | `src/apps/member/features/momentum/MomentumCard.tsx` | Add StatusTierBadge below TierBadge, fetch status tier |
| 4 | `src/apps/member/pages/MemberProfilePage.tsx` | Fix `as any` → proper `StatusTier` type cast |
| 5 | `docs/ECONOMY_V2.md` | Add Section: Status Tiers (SP system, qualification, downgrade, benefits) |
| 6 | `docs/gamification-event-map.md` | Add SP column to event tables |

### What NOT to change:
- Edge function SP logic — verified working correctly
- `evaluate_member_tier` DB function — verified correct
- Seed data — verified matches user's spec exactly
- StatusTierCard component — already correct
- StatusTierBadge component — already correct
- i18n translations — already complete (en + th)
- CSS variables — already in place
- RLS policies — already correct
- Existing XP/Coin/Level logic — untouched

### Safety:
- Type-refinement changes only for items 1-2, 4
- MomentumCard addition (item 3) is purely additive — adds a small badge, no logic change
- Doc updates (items 5-6) are documentation only

