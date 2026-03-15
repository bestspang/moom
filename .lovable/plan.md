

# Status Tier System — Final Audit & Fix Plan

## Critical Bug Found

### `evaluate_member_tier` queries non-existent column `action_key` on `sp_ledger`

**Root cause:** The `sp_ledger` table schema has columns: `id, member_id, event_type, delta, created_at, metadata`. There is NO `action_key` column. However, the `evaluate_member_tier` function (from migration `20260311123831`) contains:

```sql
SELECT COUNT(*) INTO v_community_ev2
FROM sp_ledger
WHERE member_id = p_member_id
  AND action_key = 'community_event'   -- ← COLUMN DOES NOT EXIST
  AND created_at >= v_now - interval '90 days';
```

This means the **Black tier extra_2of4 community_event check** will throw a runtime SQL error, causing the entire `evaluate_member_tier` function to fail for any member being evaluated against Black tier.

**Impact:** Any call to `evaluate_member_tier` where a member qualifies for Black-level checks will crash. This cascades to: the `fetchMemberStatusTier` API call (which auto-evaluates), the `StatusTierCard`, `StatusTierBadge` in MomentumCard, MemberHomePage, and MemberProfilePage.

**Fix:** Replace `action_key` with `event_type` in the function. This is the correct column name — the edge function writes `event_type` to `sp_ledger`.

---

## Implementation

### 1. Database Migration — Fix `evaluate_member_tier`

Replace `action_key = 'community_event'` with `event_type = 'community_event'` in the `evaluate_member_tier` function. This is a single-line fix in the function body:

```sql
-- Change this line inside the extra_2of4 block:
AND action_key = 'community_event'
-- To:
AND event_type = 'community_event'
```

Full function will be re-created via `CREATE OR REPLACE FUNCTION`.

### What stays exactly the same

- All other tables, seed data, SP rules, benefits — verified correct
- Edge function SP writing — uses `event_type` correctly
- All frontend components (StatusTierBadge, StatusTierCard, MomentumCard, HomePage, ProfilePage, MomentumPage) — verified correct
- i18n translations (EN + TH) — complete
- CSS variables — in place
- Documentation (ECONOMY_V2.md, gamification-event-map.md) — accurate
- Admin GamificationStatusTiers page — working
- XP/Coin/Level logic — untouched

### Safety analysis

This is a single column name fix in one SQL function. No other code references `sp_ledger.action_key`. The fix is zero-risk to existing functionality and prevents a runtime crash.

