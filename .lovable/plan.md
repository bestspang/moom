

# Phase 8: Squad Activity Feed

## Current State
The squad page shows members and XP contributions, but there's no sense of "what's happening" — no activity, no life. The expansion plan calls for squad social features to make members feel connected and accountable. The simplest, highest-impact addition is an **activity feed** showing recent squad member actions.

## Data Source
The `gamification_audit_log` table already captures every gamification event per member (check-ins, badge earns, quest completions, level-ups). It has RLS restricted to staff, so we need a `SECURITY DEFINER` RPC that returns recent events only for members in the caller's squad.

## Plan

### 1. Database: Create `get_squad_activity_feed` RPC

```text
get_squad_activity_feed(p_squad_id uuid, p_limit int DEFAULT 20)
→ Returns: member_id, first_name, avatar_url, event_type, action_key, xp_delta, created_at
```

Logic:
- Validates the calling user is a member of `p_squad_id` (via `get_my_member_id` + `squad_memberships`)
- Joins `gamification_audit_log` for members in the squad, ordered by `created_at DESC`
- Returns last `p_limit` entries with member name/avatar
- `SECURITY DEFINER` to bypass audit log RLS

### 2. Frontend: Add feed API + types

In `api.ts`:
- `fetchSquadActivityFeed(squadId: string): Promise<SquadActivityEntry[]>`
- Type: `{ memberId, firstName, avatarUrl, eventType, actionKey, xpDelta, createdAt }`

### 3. Frontend: Add `SquadActivityFeed` component

New file: `src/apps/member/features/momentum/SquadActivityFeed.tsx`

Renders a compact list of recent squad activities with:
- Member avatar/initials + name
- Action description (mapped from `event_type`/`action_key` to human-readable i18n strings)
- XP earned badge
- Relative timestamp (e.g., "2h ago")
- Max 15 items, no pagination needed initially

Event type display mapping (frontend):
- `check_in` → "Checked in"
- `badge_earned` → "Earned a badge"
- `quest_completed` → "Completed a quest"  
- `level_up` → "Leveled up"
- Default → "Earned XP"

### 4. Integrate into `MemberSquadPage.tsx`

Add a new `Section` titled "Recent Activity" below the members list, rendering `SquadActivityFeed` when the user has a squad.

### 5. i18n keys (~8 keys)

Under `member.*`:
- `squadActivity`, `checkedIn`, `earnedBadge`, `completedQuest`, `leveledUp`, `earnedXp`, `noActivityYet`, `recentActivity`

### Files

| File | Action |
|------|--------|
| Migration SQL | Create `get_squad_activity_feed` RPC |
| `src/apps/member/features/momentum/api.ts` | Add `fetchSquadActivityFeed` |
| `src/apps/member/features/momentum/SquadActivityFeed.tsx` | **Create** — activity feed component |
| `src/apps/member/pages/MemberSquadPage.tsx` | Add activity feed section |
| `src/i18n/locales/en.ts` | ~8 new keys |
| `src/i18n/locales/th.ts` | ~8 new keys |

No changes to existing tables. No new tables. Uses existing audit data.

