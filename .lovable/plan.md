

# QC Audit — Critical Bugs Found in Status Points Pipeline

## Executive Summary

The Status Tier system's **SP earning logic is broken for 4 of the most important activity types**. The `sp_ledger` table has **zero rows** — meaning no member has ever earned any Status Points. The UI components, DB functions, and admin pages all look correct, but the core data pipeline has naming mismatches that silently prevent SP from being written.

---

## BUG 1 — `class_attended` vs `class_attend` (Critical)

**SP rule action_key:** `class_attended`
**Gamification rule action_key:** `class_attend` (no trailing 'd')

When a class attendance event fires, the edge function receives `event_type: "class_attend"`. The SP lookup at line 557 does `.eq("action_key", event_type)` → searches for `class_attend` → no match in SP rules (which has `class_attended`).

**Result:** Class attendance (2 SP each — the most frequent member action) is NEVER recorded.

**Fix:** Rename SP rule `class_attended` → `class_attend` in the database.

---

## BUG 2 — `package_purchased` check vs `package_purchase` event (Critical)

**Edge function line 564:** `if (event_type === "package_purchased" && metadata)`
**Gamification rule action_key:** `package_purchase` (no trailing 'd')

The condition never matches because the incoming event is `package_purchase` but code checks for `package_purchased`.

**Result:** Package purchase SP (8/20/35/55 by term — the largest single SP sources) is NEVER recorded.

**Fix:** Change line 564 from `"package_purchased"` to `"package_purchase"`.

---

## BUG 3 — `community_event` has no gamification rule (Medium)

**SP rule exists:** `community_event` (5 SP, daily cap 2)
**Gamification rule:** Does not exist.

No caller ever sends `event_type: "community_event"` because there's no matching gamification rule to process it.

**Result:** Community event SP never earned. Also affects Black tier `extra_2of4` evaluation — the community_event dimension is permanently zero.

**Fix:** Create a gamification rule for `community_event` (XP/coin can be 0 if desired — the rule just needs to exist so the SP pipeline fires).

---

## BUG 4 — `referral_purchase` SP never triggered independently (Medium)

**SP rule exists:** `referral_purchase` (20 SP)
**Gamification rule exists:** `referral_purchase`

However, referral completion in the edge function (lines 710-815) happens **inside** `check_in` processing — not as a separate event. The referrer is never processed through the gamification pipeline with `event_type: "referral_purchase"`. So the SP is never written.

**Fix:** After referral completion (line 770), add an explicit SP ledger insert for the referrer with `event_type: 'referral_purchase'`.

---

## Impact Analysis

These 4 bugs combined mean:
- **0 SP has ever been earned by any member** (confirmed: `SELECT COUNT(*) FROM sp_ledger` = 0)
- All members are permanently Bronze tier
- The StatusTierBadge, StatusTierCard, and daily evaluation cron all work but evaluate against zero data
- The tier change notification system works but never fires (no tier changes can happen)

The working SP rules (open_gym_45min, pt_session, daily/weekly quest, monthly/seasonal challenge, shop_purchase) DO match their gamification rule names, but they may also have zero entries if most events come through check_in/class_attend/package_purchase.

---

## Implementation Plan

### 1. Database Migration — Fix SP rule action_key mismatch

```sql
UPDATE status_tier_sp_rules SET action_key = 'class_attend' WHERE action_key = 'class_attended';
```

### 2. Edge Function Fix — `gamification-process-event/index.ts`

**Line 564:** Change `"package_purchased"` → `"package_purchase"`

**After line 770 (referral completion):** Add SP ledger insert for referrer:
```typescript
await db.from("sp_ledger").insert({
  member_id: pendingReferral.referrer_member_id,
  event_type: 'referral_purchase',
  delta: 20,
  metadata: { referral_id: pendingReferral.id },
});
```

### 3. Database Migration — Create `community_event` gamification rule

```sql
INSERT INTO gamification_rules (action_key, xp_value, coin_value, cooldown_minutes, daily_limit, is_active)
VALUES ('community_event', 10, 5, 0, 2, true);
```

### 4. No changes to:
- `evaluate_member_tier` — correct, it reads from `sp_ledger` and `member_referrals`
- StatusTierBadge/StatusTierCard — correct
- MomentumCard/HomePage/ProfilePage — correct
- useRealtimeSync — correct
- evaluate-tiers-daily cron — correct
- All i18n, CSS variables, documentation — correct

### Safety
- The DB rename is a single UPDATE on a config table
- The edge function fix is a 1-character change (`"package_purchased"` → `"package_purchase"`)
- The referral SP insert is additive (new insert, no existing logic modified)
- The community_event rule is a new row — enables a previously dead code path

