# Gamification Platform Architecture

> Last updated: 2026-03-08

---

## SECTION 1 — Architecture Decision

### Verified Fact

Both Admin App and Experience App connect to the **same Supabase instance**. They share tables, Edge Functions, RLS policies, types, and identity tables (`members`, `staff`, `line_users`).

### Decision: Option B — Shared Supabase Backend

| Option | Verdict |
|--------|---------|
| A. Central Gamification Service | Adds a third system between two apps that already share a DB. Zero benefit, added latency. |
| **B. Shared DB, Admin configures, Experience produces/consumes** | **Current architecture. Already deployed and working.** |
| C. Federated dual-DB with event sync | Introduces eventual consistency and identity mapping for apps that already share identity. Net negative. |

### Tradeoffs Accepted

- Both apps couple to the same schema — acceptable because they share the same Supabase project by design
- RLS is the access boundary, not network boundaries
- Edge Functions are the single enforcement layer for all business-critical gamification logic

---

## SECTION 2 — Platform Principles

1. **Append-only ledgers** — XP and points are never mutated, only new entries (grants, spends, rollbacks)
2. **Idempotent processing** — every event has a unique `idempotency_key`; duplicates are safely ignored
3. **Anti-abuse** — cooldowns (`cooldown_minutes`) and daily limits (`max_per_day`) enforced server-side per rule
4. **Attendance-first** — consistency drives progression more than spending
5. **Audit everything** — all mutations logged to `gamification_audit_log`
6. **Edge Functions enforce** — no client-side rule evaluation; clients fire events, server decides outcomes
7. **Fire-and-forget** — gamification calls never block primary business flows (check-in, booking, purchase)
8. **RLS governs visibility** — staff read all, members read own (via `line_users` join)

---

## SECTION 3 — System Boundary and Ownership

### Admin App Owns (Configuration)

| Domain | Tables |
|--------|--------|
| Rule configuration | `gamification_rules` |
| Level definitions | `gamification_levels` |
| Badge definitions | `gamification_badges` |
| Challenge definitions | `gamification_challenges` |
| Reward catalog | `gamification_rewards` |
| Trainer tier definitions | `gamification_trainer_tiers` |
| Season definitions | `gamification_seasons` |
| Audit monitoring | `gamification_audit_log` (read) |

### Edge Functions Own (Business Logic)

| Function | Responsibility |
|----------|---------------|
| `gamification-process-event` | XP + points + streaks + badges + challenges |
| `gamification-redeem-reward` | Reward redemption with eligibility + stock + anti-abuse + rollback |

### Experience App Owns (Event Production + Display)

| Flow | Event Type | Idempotency Key |
|------|-----------|----------------|
| Check-in | `check_in` | `checkin:{attendance_id}` |
| Class attendance | `class_attend` | `class_attend:{booking_id}` |
| Package purchase | `package_purchase` | `purchase:{transaction_id}` |

### Shared Identity (Single DB)

- `members.id` — canonical member identity
- `staff.id` — canonical staff/trainer identity
- `line_users` — LINE ↔ member/staff mapping
- `locations.id` — canonical branch reference

---

## SECTION 4 — Shared Enums and Lifecycles

### Enums (in DB)

| Enum | Values |
|------|--------|
| `gamification_event_type` | `check_in`, `class_attend`, `class_booked`, `package_purchase`, `package_renewed`, `streak_maintained`, `challenge_completed`, `reward_redeemed`, `referral_converted`, `profile_completed`, `first_visit`, `merch_purchased`, `review_submitted`, `manual_adjustment`, `rollback` |
| `challenge_progress_status` | `in_progress`, `completed`, `failed`, `expired` |
| `reward_redemption_status` | `pending`, `fulfilled`, `cancelled`, `rolled_back` |
| `squad_role` | `leader`, `member` |

### Challenge Status Lifecycle

```
draft → active → ended
         ↓
      cancelled
```

### Reward Redemption Lifecycle

```
pending → fulfilled
   ↓         ↓
cancelled  rolled_back
```

### Season Lifecycle

```
draft → active → ended
```

---

## SECTION 5 — Event Model

### Event Envelope (Edge Function Input)

```typescript
{
  event_type: string;        // e.g. "check_in"
  member_id: string;         // UUID
  idempotency_key: string;   // e.g. "checkin:abc-123"
  location_id?: string;      // UUID, optional
  metadata?: Record<string, unknown>;
}
```

### Event Producers

| Producer | Events | Integration Point |
|----------|--------|--------------------|
| `useLobby.ts` (client) | `check_in` | `onSuccess` callback |
| `useClassBookings.ts` (client) | `class_attended` | `onSuccess` callback |
| `approve-slip` (Edge Function) | `package_purchased` | After transaction completion |
| `stripe-webhook` (Edge Function) | `package_purchased` | After Stripe payment |

### Event Consumer

`gamification-process-event` Edge Function:
1. Validate `idempotency_key` (skip if exists in `xp_ledger`)
2. Look up matching `gamification_rules` by `action_key`
3. Enforce cooldown and daily limit
4. Compute XP + points
5. Update `member_gamification_profiles`
6. Update `streak_snapshots`
7. Check badge conditions → insert `badge_earnings`
8. Check challenge progress → update `challenge_progress`
9. Write to `xp_ledger` + `points_ledger`
10. Write to `gamification_audit_log`

### Failure Handling

- Client-side: fire-and-forget with `try/catch` + `console.warn`
- Server-side (Edge Function to Edge Function): `try/catch`, log warning, never block primary flow
- Idempotency keys prevent double-crediting on retry

---

## SECTION 6 — Core Tables

### Config Tables (Admin-managed)

| Table | Purpose |
|-------|---------|
| `gamification_rules` | action_key → XP/points mapping + cooldown + daily limit |
| `gamification_levels` | Level number → XP threshold + perks |
| `gamification_badges` | Badge definition + unlock conditions |
| `gamification_challenges` | Challenge definition + goals + rewards |
| `gamification_rewards` | Reward catalog + points cost + stock + eligibility |
| `gamification_trainer_tiers` | Tier definition per trainer_type (in_house / freelance) |
| `gamification_seasons` | Season boundaries + reset behavior |

### Member-side Tables (Edge Function-managed)

| Table | Purpose |
|-------|---------|
| `member_gamification_profiles` | Computed profile: XP, points, level, streak |
| `xp_ledger` | Append-only XP grants/rollbacks (idempotent via unique key) |
| `points_ledger` | Append-only point grants/spends/rollbacks |
| `streak_snapshots` | Current streak per member per type |
| `badge_earnings` | Earned badges (unique per member+badge) |
| `challenge_progress` | Per-member progress on challenges |
| `reward_redemptions` | Point spend + fulfillment tracking |

### Trainer Tables

| Table | Purpose |
|-------|---------|
| `trainer_gamification_scores` | Periodic scores per staff_id + trainer_type |
| `gamification_trainer_tiers` | Tier thresholds per trainer_type |

### Audit

| Table | Purpose |
|-------|---------|
| `gamification_audit_log` | All mutations: event_type, action_key, XP/points delta, flagged, metadata |

---

## SECTION 7 — XP / Points / Reward Logic

### Earning

- XP and points are granted per `gamification_rules` entry matching the `action_key`
- Attendance events (`check_in`, `class_attended`) are weighted higher than spending events
- Each grant creates entries in `xp_ledger` and `points_ledger` with positive deltas

### Spending

- Points are spent via `gamification-redeem-reward` Edge Function
- Deducts from `available_points` in `member_gamification_profiles`
- Creates negative-delta entry in `points_ledger`

### Rollback

- Transaction refund → `rollback` event_type → negative XP/points entries in ledgers
- Cancelled redemption → void endpoint → restore points, decrement `redeemed_count`

### Anti-Abuse

- `cooldown_minutes`: minimum time between same action_key grants for same member
- `max_per_day`: maximum grants per action_key per member per calendar day
- Enforced server-side in `gamification-process-event`
- Violations logged to `gamification_audit_log` with `flagged = true`

### Reward Eligibility

- `level_required`: member must have `current_level >= level_required`
- `available_from` / `available_until`: time window
- `stock`: decrement on redemption, reject if 0 (unless `is_unlimited`)
- `is_active`: must be true

---

## SECTION 8 — Trainer Scoring

### Two Distinct Models

| Dimension | In-House Trainer | Freelance Trainer |
|-----------|-----------------|-------------------|
| `trainer_type` | `in_house` | `freelance` |
| Scoring period | Monthly | Monthly |
| Metrics | Classes taught, attendance rate, member feedback | Classes taught, booking fill rate, repeat bookings |
| Tier progression | Based on `gamification_trainer_tiers` where `trainer_type = 'in_house'` | Based on `gamification_trainer_tiers` where `trainer_type = 'freelance'` |

### Scoring Table: `trainer_gamification_scores`

- `staff_id`: references `staff.id`
- `trainer_type`: `in_house` or `freelance`
- `score`: computed integer
- `tier_id`: resolved tier based on score
- `period_start` / `period_end`: scoring window
- `breakdown`: JSONB with metric details

---

## SECTION 9 — RLS Strategy

### Config Tables

- **Staff (level_1+)**: SELECT
- **Managers (level_3+)**: ALL (CRUD)

### Member-Side Tables

- **Staff (level_1+)**: SELECT all
- **Members**: SELECT own (via `line_users` join: `member_id IN (SELECT m.id FROM members m JOIN line_users lu ON lu.member_id = m.id WHERE lu.user_id = auth.uid())`)
- **Writes**: Edge Functions only (service_role), no direct client writes

### Audit Log

- **Staff (level_1+)**: SELECT
- **Managers (level_3+)**: ALL

---

## SECTION 10 — Admin Control Requirements

Admins (level_3+) can:

1. **Rules**: CRUD on `gamification_rules` (action_key, XP/points values, cooldown, daily limit, active toggle)
2. **Levels**: CRUD on `gamification_levels` (XP thresholds, perks, badge colors)
3. **Badges**: CRUD on `gamification_badges` (name, tier, unlock conditions, icon)
4. **Challenges**: CRUD on `gamification_challenges` (goals, dates, rewards, eligibility, status)
5. **Rewards**: CRUD on `gamification_rewards` (points cost, stock, level requirement, availability window)
6. **Trainer Tiers**: CRUD on `gamification_trainer_tiers` (per trainer_type)
7. **Seasons**: CRUD on `gamification_seasons` (dates, reset behavior)
8. **Audit**: Read `gamification_audit_log`, filter by flagged events
9. **Overview**: Dashboard with active rules, challenges, badges, rewards, XP distributed, flagged events

---

## SECTION 11 — Rollout Phases

### Phase 1 ✅ Complete

- 17 gamification tables created with RLS
- 2 Edge Functions deployed (`gamification-process-event`, `gamification-redeem-reward`)
- Admin Studio UI (8 tabs: Overview, Rules, Levels, Challenges, Badges, Rewards, Trainers, Risk)
- Idempotency via unique constraints on ledger tables

### Phase 2 ✅ Complete

- Event wiring: check-in → `check_in`, class attendance → `class_attended`, purchase → `package_purchased`
- Client-side: fire-and-forget in `onSuccess` callbacks
- Server-side: Edge Function → Edge Function calls in `approve-slip` and `stripe-webhook`

### Phase 3 — Next

- Experience App member-facing screens (XP profile, badges, rewards, challenges)
- Seed default gamification rules for `check_in`, `class_attended`, `package_purchased`
- Squad tables + UI (team challenges)
- Trainer scoring computation jobs

### Phase 4 — Future

- Reconciliation/background jobs
- Notification triggers on level-up, badge earned, challenge completed
- Season management UI + reset logic
- Analytics aggregation views

---

## SECTION 12 — Open Questions / Dependencies

| # | Question | Status |
|---|----------|--------|
| 1 | Default `gamification_rules` seed data for `check_in`, `class_attended`, `package_purchased` | Needs admin to configure or migration to seed |
| 2 | Experience App project setup (separate Lovable project, same Supabase) | Pending project creation |
| 3 | `squads` + `squad_memberships` tables | Not yet created (Phase 3) |
| 4 | Trainer scoring computation trigger/job | Not yet implemented (Phase 3) |
| 5 | Notification integration (level-up, badge earned) | Not yet implemented (Phase 4) |
| 6 | Season reset logic (reset XP/points on season end) | Not yet implemented (Phase 4) |
| 7 | `package_renewed`, `merch_purchased` event wiring | Needs commerce flow for renewals and merch |

---

## Platform Standards

| Standard | Value |
|----------|-------|
| IDs | UUID v4 (`gen_random_uuid()`) |
| Timestamps | `timestamptz` (UTC), rendered in user's timezone on client |
| Money | `numeric` in THB, stored as smallest unit when applicable |
| Idempotency keys | `{event_type}:{source_record_id}` pattern |
| Audit format | `gamification_audit_log` row with event_type, action_key, deltas, metadata, flagged |
| Retry policy | Client: no retry (fire-and-forget). Server: idempotency key prevents double-credit on natural retry |
| Enum naming | `snake_case` |
| Versioning | Additive migrations only; no breaking schema changes |
