

# Phase 3: Purge Legacy Challenge References

## Problem

Six files still import or reference `ChallengeProgressEntry`, `fetchActiveChallenges`, `fetchMyChallengeProgress`, or `challenge_progress`. These are dead code — the UI no longer renders them after Phase 1-2 cleanup, but the types, API functions, and realtime sync entries remain.

## Files to Change

| File | Change |
|------|--------|
| `src/apps/member/features/momentum/types.ts` | Remove `ChallengeProgressEntry` interface |
| `src/apps/member/features/momentum/api.ts` | Remove `fetchActiveChallenges`, `fetchMyChallengeProgress`, `fetchChallengeCompletionStats` functions and `ChallengeProgressEntry` import |
| `src/apps/member/features/momentum/QuestCard.tsx` | Delete file — unused (was legacy challenge card, `QuestHub` replaced it) |
| `src/apps/member/features/momentum/LevelRequirementsCard.tsx` | Change `completedQuests` prop from `ChallengeProgressEntry[]` to `number` (it only uses `.length` anyway) |
| `src/hooks/useRealtimeSync.ts` | Replace `challenge_progress` entry with `quest_instances` → invalidates `['my-quests']` |

## What stays untouched

- `useGamificationChallenges.ts` — Admin CRUD hook, still used in Admin Gamification Studio (Challenges page). This is valid admin functionality.
- `gamification-process-event` Edge Function — server-side challenge processing stays; it's backend logic independent of frontend cleanup.
- `supabase/types.ts` — auto-generated, never edited.

No database changes. No new files.

