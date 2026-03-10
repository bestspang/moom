

# Phase 9: Squad Reactions & Encouragement

Phase 8 added the squad activity feed. The next high-impact squad social feature is **reactions** — letting squad members tap a quick encouragement on feed entries. This is the lightest social interaction that makes squads feel alive without becoming noisy social media.

## What We Build

A simple "cheer" reaction on squad activity feed items. One reaction type only (a fire/flame emoji representing encouragement). Members can tap once per feed entry. The count shows inline.

### 1. Database

New table: `squad_feed_reactions`

```sql
CREATE TABLE squad_feed_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_log_id uuid NOT NULL REFERENCES gamification_audit_log(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(audit_log_id, member_id)
);
```

RLS: Members can insert/delete their own reactions. Select via a SECURITY DEFINER RPC (since audit_log has restricted RLS).

New RPC: `get_squad_feed_reactions(p_audit_log_ids uuid[])` returns `audit_log_id, count, reacted_by_me` for a batch of feed entries.

New RPC: `toggle_squad_feed_reaction(p_audit_log_id uuid)` — inserts or deletes the reaction, returns new count. Validates caller is in the same squad as the audit log entry's member.

### 2. API

In `api.ts`:
- `fetchSquadFeedReactions(auditLogIds: string[]): Promise<Map<string, { count: number; reactedByMe: boolean }>>`
- `toggleSquadFeedReaction(auditLogId: string): Promise<{ count: number; reactedByMe: boolean }>`

### 3. UI Changes

Update `SquadActivityFeed.tsx`:
- Add a small flame/fire button on each feed entry
- Show reaction count when > 0
- Optimistic toggle on tap
- Subtle animation on react (scale bounce)

The `get_squad_activity_feed` RPC needs to also return `audit_log_id` so we can reference entries for reactions.

### 4. i18n

~2 keys: `member.cheer`, `member.cheered`

### Files

| File | Action |
|------|--------|
| Migration SQL | Create `squad_feed_reactions` table + 2 RPCs + RLS |
| Migration SQL | Update `get_squad_activity_feed` to return `id` column |
| `src/apps/member/features/momentum/api.ts` | Add reaction fetchers |
| `src/apps/member/features/momentum/SquadActivityFeed.tsx` | Add reaction buttons |
| `src/i18n/locales/en.ts` | 2 new keys |
| `src/i18n/locales/th.ts` | 2 new keys |

