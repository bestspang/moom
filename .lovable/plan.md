

# Fix: Momentum Page Shows Empty Despite Check-ins

## Root Cause
The `member_gamification_profiles` table has **zero rows**. The fake check-ins were inserted directly into `member_attendance` without triggering the gamification pipeline (`gamification-process-event` edge function) that auto-creates profiles. So `fetchMomentumProfile()` returns `null` → empty state.

## Solution (2 parts)

### 1. Database: Seed gamification profile for Kongphop
Insert a `member_gamification_profiles` row with XP/points reflecting 3 check-ins.

```sql
INSERT INTO member_gamification_profiles (member_id, total_xp, current_level, current_streak, longest_streak, available_points, total_points)
VALUES ('1509a8c5-4268-4e12-9c22-caf81f6d611c', 24, 1, 1, 1, 3, 3);
```

### 2. Code: Auto-provision profile in `fetchMomentumProfile`
When `member_gamification_profiles` returns null but the member exists, **auto-create a starter row** (Level 1, 0 XP) so new members never see the dead "Start Your Journey" screen after their first check-in. This makes the page resilient.

**File**: `src/apps/member/features/momentum/api.ts`
- After `if (!data)`, attempt an upsert of a default profile row, then return a starter profile instead of `null`.

| File | Change |
|------|--------|
| DB migration | Seed profile for member `1509a8c5...` |
| `src/apps/member/features/momentum/api.ts` | Auto-provision starter profile when row is missing |

