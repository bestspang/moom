

# Deep QC Audit — Critical Bug Found

## BUG: `package_purchased` still used for XP/Coin calculation (Line 500)

**Root cause:** The SP fix at line 564 correctly uses `"package_purchase"`, but the **XP/Coin dynamic formula** at line 500 still checks `"package_purchased"` (past tense).

```
Line 500: if (event_type === "package_purchased" && metadata) {  // ← WRONG
Line 564: if (event_type === "package_purchase" && metadata) {   // ← Correct (fixed previously)
```

**Impact:** When a `package_purchase` event fires:
- SP is correctly calculated using the term-based formula (line 564) ✅
- XP/Coin falls through to `rule.xp_value = 0` and `rule.points_value = 0` from the gamification_rules table ❌
- Members receive **ZERO XP and ZERO coins** for package purchases

This is the **stale memory regression** we warned about — the exact `package_purchased` vs `package_purchase` mismatch. The previous fix only patched line 564 (SP) but missed line 500 (XP/Coin).

**Fix:** Change line 500 from `"package_purchased"` to `"package_purchase"`. One character change.

---

## Everything Else Verified Clean

| System | Status |
|--------|--------|
| Realtime publication (44 tables) matches `useRealtimeSync.ts` | ✅ |
| Cron jobs: exactly 1 (`evaluate-tiers-daily` at 20:00 UTC) | ✅ No duplicates |
| `on_auth_user_created` trigger on `auth.users` | ✅ Active |
| SP rules: `class_attend` (correct), all 14 rules present | ✅ |
| SP pipeline line 564: `package_purchase` (correct) | ✅ |
| Referral SP write (lines 772-791) | ✅ |
| `community_event` gamification rule exists | ✅ |
| `evaluate_member_tier` uses `event_type` column | ✅ |
| Tier change notifications in DB function | ✅ |
| `evaluate-tiers-daily` edge function | ✅ |
| No duplicate cron jobs | ✅ |
| `updated_at` triggers on core tables | ✅ (20 triggers) |

---

## Implementation Plan

| # | File | Change | Risk |
|---|------|--------|------|
| 1 | `supabase/functions/gamification-process-event/index.ts` line 500 | Change `"package_purchased"` → `"package_purchase"` | Zero — 1 character, same pattern as the SP fix |
| 2 | `docs/gamification-event-map.md` | Add stronger warning about this specific line 500 being the XP/Coin formula (not just SP) | Zero — doc |

### Why this keeps happening
The project memory `architecture/gamification-event-contracts` **still says `package_purchased`**. Every time AI reads that memory, it will try to "correct" code back to the wrong value. The `.lovable/plan.md` warning exists but memory takes priority for AI. We need to reinforce the warning in both documentation files.

