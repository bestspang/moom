

# Correction: TWO Separate Databases Confirmed — Full Gamification Architecture Redesign

## Critical Finding (Previous Responses Were Wrong)

I verified both projects' `.env` files:

| Project | Supabase Project ID | DB |
|---------|--------------------|----|
| **Admin App** (this project) | `qedxqilmnkbjncpnopty` | DB-A |
| **Experience App** (MOOM Connect) | `dkxkvelzlxiiprkfjwtv` | DB-B |

**These are TWO SEPARATE databases.** The previous 4 responses incorrectly claimed they share one DB. The `PLATFORM_CONTRACT.md` and memory entries were wrong/aspirational — the deployed reality is two distinct Supabase instances with different schemas, different auth systems, and different tables.

---

## SECTION 1 — Architecture Recommendation

| Option | Assessment |
|--------|-----------|
| A. Central Gamification Service | A third DB/service between two already-built systems. Maximum consistency but highest migration cost and ops burden. Not practical for Lovable (can't spin up a third backend service). |
| B. One app owns gamification SOT, other consumes via API | **Recommended.** Admin DB (DB-A) owns rules/config and the authoritative ledger. Experience DB (DB-B) owns member-facing state and produces events. Edge Functions on both sides act as the integration API. |
| C. Federated dual-DB with event sync | **This is what's accidentally built today** — both DBs have their own gamification tables with divergent schemas. Works for reads but has no consistency guarantees. |

### Recommendation: **Option B — Admin DB as Gamification Authority**

**Why:** Admin already has the rule engine (`gamification_rules`, `gamification-process-event` Edge Function), the audit log, and the config CRUD UI. Experience DB has member-facing state but lacks rule enforcement — its `award_checkin_xp()` trigger hardcodes 100 XP instead of reading from configurable rules. Option B centralizes rule evaluation in one place while letting the Experience App keep its own read-optimized projections.

### Tradeoffs
- Experience App reads are local (fast) but writes must round-trip to Admin's Edge Functions
- Admin DB is the bottleneck for all gamification mutations — acceptable at gym scale
- Identity mapping needed: Admin uses `members.id`, Experience uses `auth.users.id`
- Eventual consistency for Experience App read models (seconds, not minutes)

---

## SECTION 2 — Platform Principles

1. **Admin DB is the gamification source of truth** for rules, levels, badges, challenges, rewards, trainer tiers, and the canonical XP/points ledgers
2. **Experience DB holds projections** — local read models (`momentum_profiles`, `member_badges`, etc.) materialized from Admin DB events
3. **Edge Functions are the integration boundary** — no direct cross-DB queries
4. **Events flow in two directions**: Experience → Admin (actions: check-in, booking, purchase) and Admin → Experience (state updates: XP granted, badge earned, level up)
5. **Idempotency everywhere** — every event has a unique key; duplicates are safely ignored
6. **Fire-and-forget from primary flows** — gamification calls never block check-in, booking, or payment
7. **Server-side rule enforcement only** — no client-side XP calculation

---

## SECTION 3 — System Boundary and Ownership

### Admin DB (DB-A) — Source of Truth

| Domain | Tables |
|--------|--------|
| Rule configuration | `gamification_rules` |
| Level definitions | `gamification_levels` |
| Badge definitions | `gamification_badges` |
| Challenge definitions | `gamification_challenges` |
| Reward catalog | `gamification_rewards` |
| Trainer tiers | `gamification_trainer_tiers` |
| **Canonical XP ledger** | `xp_ledger` |
| **Canonical points ledger** | `points_ledger` |
| **Canonical profiles** | `member_gamification_profiles` |
| Streak snapshots | `streak_snapshots` |
| Badge earnings | `badge_earnings` |
| Challenge progress | `challenge_progress` |
| Reward redemptions | `reward_redemptions` |
| Trainer scores | `trainer_gamification_scores` |
| Audit log | `gamification_audit_log` |
| Seasons | `gamification_seasons` |

### Experience DB (DB-B) — Projections / Read Models

| Domain | Tables (existing) | Role |
|--------|-------------------|------|
| Member profile | `momentum_profiles` | **Read projection** of `member_gamification_profiles` |
| XP history | `xp_ledger` | **Read projection** for member's own history |
| Badges earned | `member_badges` | **Read projection** of `badge_earnings` |
| Quests | `quests`, `member_quests` | **Local feature** (daily/weekly micro-challenges) |
| Challenges | `challenges`, `member_challenges` | **Read projection** of `gamification_challenges` + `challenge_progress` |
| Rewards | `reward_drops`, `reward_claims` | **Read projection** of `gamification_rewards` + `reward_redemptions` |
| Squads | `squads`, `squad_members`, `squad_goals` | **Local feature** (Experience-only) |
| Coach impact | `coach_impact_profiles` | **Read projection** of trainer scoring |
| Partner reputation | `partner_reputation_profiles` | **Read projection** of trainer scoring |

### Integration Direction

```text
Experience App (DB-B)                    Admin App (DB-A)
─────────────────────                    ─────────────────
                                         
[check-in trigger] ──── POST ────────► [gamification-process-event]
[booking complete] ──── POST ────────►   ├─ evaluate rules
[purchase]         ──── POST ────────►   ├─ update ledgers
                                         ├─ update profiles
                                         ├─ check badges/challenges
                                         └─ return {xp, points, badges, level_up}
                                                │
[update momentum_profiles] ◄── callback ────────┘
[insert xp_ledger entry]   ◄── callback ────────┘
[insert member_badges]      ◄── callback ────────┘
```

---

## SECTION 4 — Shared Enums and Lifecycles

### Identity Mapping

| Admin DB | Experience DB | Mapping Strategy |
|----------|--------------|-----------------|
| `members.id` (UUID) | `auth.users.id` (UUID) | **Canonical mapping table needed** — `identity_map` in Admin DB linking `admin_member_id ↔ experience_user_id` |
| `staff.id` (UUID) | `auth.users.id` for trainers | Same mapping table |
| `locations.id` | `branches.id` | Same mapping table |

### Event Types (shared across both systems)

`check_in`, `class_attended`, `class_booked`, `package_purchased`, `package_renewed`, `streak_maintained`, `challenge_completed`, `reward_redeemed`, `referral_converted`, `profile_completed`, `first_visit`, `manual_adjustment`, `rollback`

### Challenge Status: `draft → active → ended | cancelled`

### Reward Redemption Status: `pending → fulfilled | cancelled | rolled_back`

### Member Tier: `starter → regular → dedicated → elite → champion → legend`

### Coach Level: `rising → established → senior → master → elite_coach`

### Partner Tier: `new_partner → verified → preferred → premium_partner`

---

## SECTION 5 — Event Model and Integration

### Event Envelope (Experience → Admin)

```typescript
{
  event_type: string;           // e.g. "check_in"
  experience_user_id: string;   // auth.users.id from Experience DB
  idempotency_key: string;      // e.g. "checkin:{attendance_record_id}"
  branch_id?: string;           // Experience DB branches.id
  metadata?: Record<string, unknown>;
  occurred_at: string;          // ISO timestamp
}
```

### Response Envelope (Admin → Experience)

```typescript
{
  success: boolean;
  xp_granted: number;
  points_granted: number;
  new_total_xp: number;
  new_level: number;
  new_tier: string;
  badges_earned: Array<{ id: string; name: string; icon_url: string }>;
  challenge_updates: Array<{ id: string; progress: number; completed: boolean }>;
  level_up: boolean;
}
```

### Integration Flow

1. Experience App's DB trigger or hook fires an event
2. Experience App's Edge Function POSTs to Admin App's `gamification-process-event`
3. Admin resolves identity (experience_user_id → admin member_id via mapping table)
4. Admin evaluates rules, updates canonical ledgers
5. Admin returns result
6. Experience App's Edge Function updates local projections (`momentum_profiles`, `member_badges`, `xp_ledger`)

### Failure Handling
- If Admin is unreachable: log to `event_outbox` in Experience DB, retry via cron
- Dead-letter: events that fail 3 times are marked `failed` in outbox
- Reconciliation: daily job compares `momentum_profiles.total_xp` with Admin's `member_gamification_profiles.total_xp`

---

## SECTION 6 — Key Schema Differences to Reconcile

| Concept | Admin DB (current) | Experience DB (current) | Reconciliation |
|---------|-------------------|------------------------|----------------|
| Member profile | `member_gamification_profiles` (member_id UUID → members table) | `momentum_profiles` (user_id UUID → auth.users) | Admin is SOT; Experience is projection |
| XP Ledger | `xp_ledger` (member_id, event_type enum, delta, idempotency_key) | `xp_ledger` (user_id, xp_amount, rp_amount, source enum) | Different schemas — Admin is canonical |
| Badges | `gamification_badges` (config) + `badge_earnings` (earned) | `badges` (config) + `member_badges` (earned) | Admin badges sync → Experience badges |
| Challenges | `gamification_challenges` + `challenge_progress` | `challenges` + `member_challenges` | Admin definitions sync → Experience |
| Rewards | `gamification_rewards` + `reward_redemptions` | `reward_drops` + `reward_claims` | Admin catalog sync → Experience drops |
| Trainer scoring | `trainer_gamification_scores` + `gamification_trainer_tiers` | `coach_impact_profiles` + `partner_reputation_profiles` | Admin computes scores → Experience projects |
| Quests | (none) | `quests` + `member_quests` | Experience-only feature |
| Squads | (none) | `squads` + `squad_members` + `squad_goals` | Experience-only feature |
| Check-in XP | Edge Function `gamification-process-event` | DB trigger `award_checkin_xp()` (hardcoded 100 XP) | **Conflict — must remove trigger, use Admin Edge Function** |

---

## SECTION 7 — XP / Points / Reward Logic

- **Earning**: All XP/points computed by Admin's `gamification-process-event` based on `gamification_rules`
- **Experience DB trigger `award_checkin_xp()` must be disabled** — it hardcodes values and bypasses Admin rules
- **Spending**: Reward redemption goes through Admin's `gamification-redeem-reward` Edge Function
- **Rollback**: Refund/cancel → `rollback` event → negative ledger entries in Admin → projection update in Experience
- **Anti-abuse**: Cooldowns and daily limits enforced in Admin Edge Function (already implemented)

---

## SECTION 8 — Trainer Scoring

| Dimension | In-House (Coach Impact) | Freelance (Partner Reputation) |
|-----------|------------------------|-------------------------------|
| Admin table | `trainer_gamification_scores` (trainer_type='in_house') | `trainer_gamification_scores` (trainer_type='freelance') |
| Experience table | `coach_impact_profiles` | `partner_reputation_profiles` |
| Metrics | classes taught, attendance rate, member return rate, PT log rate | sessions, punctuality, repeat bookings, ratings, cancellations |
| Tiers | `gamification_trainer_tiers` where trainer_type='in_house' | `gamification_trainer_tiers` where trainer_type='freelance' |
| Computation | Admin cron/Edge Function → push to Experience | Same |

---

## SECTION 9 — API Contracts

### Experience → Admin (Mutations)

| Endpoint | Purpose | Auth |
|----------|---------|------|
| `POST /functions/v1/gamification-process-event` | Process any gamification event | Service-role key |
| `POST /functions/v1/gamification-redeem-reward` | Redeem a reward | Service-role key |

### Admin → Experience (Config Sync — new Edge Function needed)

| Endpoint | Purpose |
|----------|---------|
| `POST /functions/v1/sync-gamification-config` | Push badge/challenge/reward/level definitions to Experience DB |

### Experience-side (new Edge Function needed)

| Endpoint | Purpose |
|----------|---------|
| `POST /functions/v1/gamification-event-relay` | Accepts local events (check-in trigger), POSTs to Admin, updates local projections with response |
| `POST /functions/v1/receive-gamification-update` | Receives projection updates from Admin (badges, levels, XP) |

---

## SECTION 10 — Admin Control (Already Implemented)

Admin Studio (8 tabs) already manages: Rules, Levels, Badges, Challenges, Rewards, Trainer Tiers, Seasons, Audit. No changes needed except adding a "Sync to Experience" action.

---

## SECTION 11 — Rollout Plan

### Phase A — Identity Mapping (prerequisite)
1. Create `identity_map` table in Admin DB: `admin_member_id ↔ experience_user_id ↔ branch_mapping`
2. Seed with existing member/staff relationships

### Phase B — Event Relay
1. Create `gamification-event-relay` Edge Function in Experience App
2. Disable `award_checkin_xp()` trigger in Experience DB
3. Wire check-in → relay → Admin's `gamification-process-event`
4. Relay writes response back to `momentum_profiles`, `xp_ledger`, `member_badges`

### Phase C — Config Sync
1. Create `sync-gamification-config` Edge Function in Admin or Experience
2. On Admin badge/challenge/reward CRUD, push definitions to Experience DB
3. Experience `badges`, `challenges`, `reward_drops` become read projections

### Phase D — Reward Redemption
1. Wire Experience App's "claim reward" to call Admin's `gamification-redeem-reward`
2. Admin validates eligibility, stock, anti-abuse
3. Response updates Experience `reward_claims` + `momentum_profiles.reward_points`

### Phase E — Trainer Score Sync
1. Admin computes trainer scores (cron job)
2. Push results to Experience `coach_impact_profiles` / `partner_reputation_profiles`

### Phase F — Reconciliation
1. Daily job compares XP/points/level between Admin and Experience
2. Alerts on drift > threshold
3. Replay capability for missed events

---

## SECTION 12 — Open Questions / Dependencies

| # | Question | Impact |
|---|----------|--------|
| 1 | Identity mapping strategy — how to link Admin `members.id` to Experience `auth.users.id`? | **Blocker for Phase A** — need a shared identifier (LINE user ID? email? member_code?) |
| 2 | Admin DB `members` and Experience DB `member_profiles` — are these manually synced today? | Determines if we can build on existing links |
| 3 | Service-role key exchange — Experience needs Admin's service-role key to call its Edge Functions | Security decision needed |
| 4 | Experience DB trigger `award_checkin_xp()` currently hardcodes 100 XP — must be disabled | Breaking change for Experience App |
| 5 | Quest system (Experience-only) — should quests be promoted to Admin-managed? | Feature scope decision |
| 6 | Squad system (Experience-only) — stays local or moves to Admin? | Feature scope decision |
| 7 | `PLATFORM_CONTRACT.md` and memory entries claim shared DB — need correction | Documentation accuracy |
| 8 | Branch/location ID mapping between `locations` (Admin) and `branches` (Experience) | Required for location-scoped rules |

---

## Implementation in This Project (Admin App)

The changes needed in **this** project (Admin App) are:

1. **Create `identity_map` table** — mapping Admin member/staff/location IDs to Experience IDs
2. **Update `gamification-process-event`** — accept `experience_user_id` and resolve via identity map
3. **Create `sync-gamification-config` Edge Function** — push config changes to Experience DB
4. **Update `docs/gamification-architecture.md`** — correct the "shared DB" claim
5. **Update `PLATFORM_CONTRACT.md`** — reflect the two-DB reality

No changes needed to existing Admin Studio UI or existing gamification tables.

