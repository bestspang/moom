# Gamification Platform Architecture

> Last updated: 2026-03-08

## Architecture: Option B — Shared Supabase Backend

Both Admin App and Experience App share ONE Supabase project.
- **Admin App**: owns rule configuration (CRUD on gamification config tables)
- **Experience App**: produces events (check-in, booking, purchase) and reads member profiles
- **Edge Functions**: enforce all business-critical logic (XP, points, levels, streaks, rewards, anti-abuse)
- **RLS**: controls visibility per role

## Tables

### Config Tables (Admin-managed, already exist)
- `gamification_rules` — action → XP/points mapping
- `gamification_levels` — level thresholds
- `gamification_badges` — badge definitions
- `gamification_challenges` — challenge definitions
- `gamification_rewards` — reward catalog
- `gamification_trainer_tiers` — tier definitions
- `gamification_seasons` — season definitions
- `gamification_audit_log` — audit trail

### Member-side Tables (Edge Function-managed, Phase 1)
- `member_gamification_profiles` — computed profile (XP, points, level, streak)
- `xp_ledger` — append-only XP grants/rollbacks (idempotent via unique key)
- `points_ledger` — append-only point grants/spends/rollbacks
- `streak_snapshots` — current streak per member per type
- `badge_earnings` — earned badges (unique per member+badge)
- `challenge_progress` — per-member progress on challenges
- `reward_redemptions` — point spend + fulfillment tracking
- `squads` + `squad_memberships` — team challenges
- `trainer_gamification_scores` — periodic trainer scores

## Enums
- `gamification_event_type`: check_in, class_attended, class_booked, package_purchased, package_renewed, streak_maintained, challenge_completed, reward_redeemed, referral_converted, profile_completed, first_visit, merch_purchased, review_submitted, manual_adjustment, rollback
- `challenge_progress_status`: in_progress, completed, failed, expired
- `reward_redemption_status`: pending, fulfilled, cancelled, rolled_back
- `squad_role`: leader, member

## Edge Functions
| Function | Purpose |
|----------|---------|
| `gamification-process-event` | Core event processor: XP + points + streaks + badges + challenges |
| `gamification-redeem-reward` | Reward redemption with eligibility + stock + anti-abuse + void/rollback |

## Key Principles
1. **Append-only ledgers** — XP and points never mutated, only new entries
2. **Idempotent processing** — every event has unique `idempotency_key`
3. **Anti-abuse** — cooldowns and daily limits from `gamification_rules`
4. **Attendance-first** — consistency drives progression more than spending
5. **Audit everything** — all mutations logged to `gamification_audit_log`
6. **Edge Functions enforce** — no client-side rule evaluation

## Rollback Logic
- Transaction refund → `rollback` event_type → negative XP/points entries
- Cancelled redemption → void endpoint → restore points, decrement stock

## RLS Strategy
- Config tables: Staff read, Manager write
- Member tables: Staff read all, Members read own (via line_users join)
- Writes: Edge Functions only (service_role), no direct client writes

## Rollout Phases
1. **Phase 1** ✅: Tables + core Edge Functions (gamification-process-event, gamification-redeem-reward)
2. **Phase 2**: Wire check-in/booking/purchase to emit events; Experience App screens
3. **Phase 3**: Squads, trainer scoring, season management UI
4. **Phase 4**: Reconciliation jobs, background notifications
