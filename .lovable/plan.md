

# Gamification Platform Architecture — Cross-Project Design

## Critical Architectural Clarification

Your existing `PLATFORM_CONTRACT.md` explicitly states:

> "Both apps use the same Supabase project via `@supabase/supabase-js`"
> "Both projects import from the same Supabase project → same auto-generated `types.ts`"

**Your two Lovable projects (Admin App + Experience App) already share ONE Supabase backend.** This is not a two-database scenario. Both apps connect to the same database, same Edge Functions, same RLS policies. The CORS allowlist already handles three origins. This is the correct architecture — do NOT split into two databases.

---

## SECTION 1 — Architecture Recommendation

### Options Compared

| Option | Description | Fit for MOOM |
|--------|-------------|-------------|
| A. Central Gamification Service | Separate microservice/DB for gamification | Overkill. Adds ops complexity, latency, and a new system to maintain. Not justified at this scale. |
| B. Shared DB, Admin owns config, Experience produces/consumes | Both apps use the same Supabase project. Admin configures rules. Experience App produces events and reads profiles. Edge Functions enforce logic. | **Recommended. Already your architecture.** |
| C. Federated dual-DB with event sync | Two separate DBs with event replication | Unnecessary complexity. You already have shared DB. Would require building sync, reconciliation, dead-letter — all for zero benefit. |

### Recommendation: **Option B — Shared Supabase Backend**

- Admin App: owns rule configuration (CRUD on gamification tables)
- Experience App: produces gamification events (check-in, booking, purchase) and reads member profiles/progress
- Edge Functions: enforce all business-critical gamification logic (XP grants, point awards, level-ups, reward redemptions, anti-abuse)
- RLS: controls who sees what — admin sees everything, members see only their own data
- `event_outbox` pattern (already in use): handles async notifications/triggers

### Why NOT two databases:
- Direct table access = zero sync lag, zero reconciliation, zero dead letters
- RLS already provides per-role data isolation
- Edge Functions already provide atomic multi-step mutations
- You already have this working for finance, bookings, and attendance

---

## SECTION 2 — Platform Principles

1. **Single DB, multiple consumers** — One Supabase project serves both Admin and Experience via RLS-scoped access
2. **Edge Functions as command boundary** — All gamification mutations that involve multi-step logic (grant XP + check level-up + award badge + audit) go through Edge Functions
3. **Append-only ledgers** — XP and points use ledger tables (like `package_usage_ledger`), never direct counter updates
4. **Idempotent event processing** — Every gamification event carries an `idempotency_key` to prevent double-grants
5. **Admin configures, backend enforces** — Admin UI writes rules; Edge Functions read rules and enforce them. No client-side rule evaluation.
6. **Audit everything** — Every XP/point mutation logs to `gamification_audit_log`
7. **Attendance-first progression** — Consistency and participation drive status more than spending

---

## SECTION 3 — System Boundary and Ownership

### Source of Truth by Domain

| Domain | Owner | Admin App | Experience App |
|--------|-------|-----------|----------------|
| Gamification Rules | Admin | CRUD | Read-only |
| Gamification Levels | Admin | CRUD | Read-only |
| Gamification Badges | Admin | CRUD | Read-only |
| Gamification Challenges | Admin | CRUD | Read + participate |
| Gamification Rewards | Admin | CRUD | Read + redeem |
| Gamification Trainer Tiers | Admin | CRUD | Read-only |
| Gamification Seasons | Admin | CRUD | Read-only |
| Member Gamification Profiles | Edge Function | Read + analytics | Read own |
| XP Ledger | Edge Function | Read + analytics | Read own |
| Points Ledger | Edge Function | Read + analytics | Read own |
| Streak Snapshots | Edge Function | Read | Read own |
| Badge Earnings | Edge Function | Read | Read own |
| Challenge Progress | Edge Function | Read | Read own |
| Reward Redemptions | Edge Function | Read + void | Read own |
| Squads | Edge Function | Read + manage | Read + join own |
| Trainer Scores | Edge Function | Read | Read own |
| Gamification Audit Log | Edge Function | Read (flagged) | N/A |

### Identity Model (No Mapping Needed)

Both apps use the same `auth.users` table. Members authenticate via LINE LIFF → `line-auth` Edge Function → Supabase session. Staff authenticate via email/password. Same user IDs everywhere. **No cross-system identity mapping required.**

---

## SECTION 4 — Shared Enums and Lifecycles

### New Enums (to create via migration)

```sql
CREATE TYPE gamification_event_type AS ENUM (
  'check_in', 'class_attended', 'class_booked',
  'package_purchased', 'package_renewed',
  'streak_maintained', 'challenge_completed',
  'reward_redeemed', 'referral_converted',
  'profile_completed', 'first_visit',
  'merch_purchased', 'review_submitted',
  'manual_adjustment', 'rollback'
);

CREATE TYPE challenge_status AS ENUM ('draft', 'active', 'ended', 'cancelled');
CREATE TYPE challenge_progress_status AS ENUM ('in_progress', 'completed', 'failed', 'expired');
CREATE TYPE reward_redemption_status AS ENUM ('pending', 'fulfilled', 'cancelled', 'rolled_back');
CREATE TYPE squad_role AS ENUM ('leader', 'member');
CREATE TYPE trainer_scoring_type AS ENUM ('in_house', 'freelance');
CREATE TYPE season_status AS ENUM ('draft', 'active', 'ended');
```

### Lifecycles

- **Challenge**: `draft` → `active` → `ended` | `cancelled`
- **Challenge Progress**: `in_progress` → `completed` | `failed` | `expired`
- **Reward Redemption**: `pending` → `fulfilled` | `cancelled` → `rolled_back`
- **Season**: `draft` → `active` → `ended`

---

## SECTION 5 — Event Model

### Gamification Event Processing Flow

```text
Experience App              Edge Function                    Database
─────────────          ──────────────────────          ─────────────
member checks in  ───→  gamification-process-event  ───→  xp_ledger INSERT
                        │                                  points_ledger INSERT
                        ├─ read active rules              streak_snapshots UPSERT
                        ├─ check cooldown/abuse            badge_earnings INSERT (if earned)
                        ├─ compute XP + points             challenge_progress UPDATE
                        ├─ check level-up                  member_gamification_profiles UPDATE
                        ├─ check badge unlock              gamification_audit_log INSERT
                        ├─ check challenge progress        event_outbox INSERT (notifications)
                        └─ audit log
```

### Event Envelope (Edge Function input)

```typescript
interface GamificationEventRequest {
  event_type: GamificationEventType;
  member_id: string;
  idempotency_key: string;          // e.g., "checkin:{attendance_id}"
  location_id?: string;
  metadata?: {
    schedule_id?: string;
    package_id?: string;
    transaction_id?: string;
    trainer_id?: string;
    amount_thb?: number;
  };
  occurred_at: string;              // ISO 8601 UTC
}
```

### Anti-Abuse (enforced in Edge Function)

- Cooldown per action (from `gamification_rules.cooldown_minutes`)
- Max per day (from `gamification_rules.max_per_day`)
- No XP/points for `no_show` bookings
- Refund/void triggers rollback event
- Flagging in `gamification_audit_log` for suspicious patterns (e.g., >10 check-ins/day)

---

## SECTION 6 — New Tables (Migration Plan)

### Tables to ADD (8 new tables)

1. **`member_gamification_profiles`** — computed profile (total XP, total points, current level, current streak, last activity)
2. **`xp_ledger`** — append-only, every XP grant/rollback
3. **`points_ledger`** — append-only, every point grant/spend/rollback
4. **`streak_snapshots`** — current streak state per member
5. **`badge_earnings`** — which badges a member has earned
6. **`challenge_progress`** — per-member progress on active challenges
7. **`reward_redemptions`** — point spend + fulfillment tracking
8. **`squads`** + **`squad_memberships`** — team challenge support

### Existing tables (no changes needed)

- `gamification_rules` — already exists
- `gamification_levels` — already exists
- `gamification_badges` — already exists
- `gamification_challenges` — already exists
- `gamification_rewards` — already exists
- `gamification_trainer_tiers` — already exists
- `gamification_seasons` — already exists
- `gamification_audit_log` — already exists

---

## SECTION 7 — XP / Points / Reward Logic

### XP Rules
- Earned via actions defined in `gamification_rules` (check-in, class attendance, etc.)
- XP determines level progression via `gamification_levels.xp_required` thresholds
- XP is never spent — it only accumulates (ledger is append-only, rollbacks are negative entries)

### Points Rules
- Earned alongside XP (separate value per rule)
- Points ARE spendable on rewards from `gamification_rewards`
- Spending creates negative ledger entry
- Rollback on cancelled redemption creates positive correction entry

### Reward Redemption Logic (Edge Function)
1. Check `is_active` and date window
2. Check member level >= `level_required`
3. Check member points balance >= `points_cost`
4. Check stock (`is_unlimited` or `stock - redeemed_count > 0`)
5. Check per-member redemption limit (anti-abuse)
6. Debit points (negative ledger entry)
7. Create redemption record
8. Increment `redeemed_count`
9. Audit log

### Rollback Logic
- Transaction refund → Edge Function creates rollback event → negative XP/points entries
- Cancelled redemption → restore points, decrement redeemed_count

---

## SECTION 8 — Trainer Scoring

### In-House Trainers
- Score based on: classes taught, attendance rate, member retention, member feedback
- Computed by scheduled job or Edge Function
- Maps to `gamification_trainer_tiers` where `trainer_type = 'in_house'`
- Visible to admin + trainer (own score only)

### Freelance Trainers
- Score based on: sessions delivered, client retention, revenue generated, reliability
- Separate scoring formula, separate tier ladder
- Maps to `gamification_trainer_tiers` where `trainer_type = 'freelance'`
- Reputation score visible to members (for booking decisions)

### Stored in: `trainer_gamification_scores` table (new)
- `staff_id`, `trainer_type`, `score`, `tier_id`, `period_start`, `period_end`, `breakdown` (jsonb)

---

## SECTION 9 — Edge Functions (New)

| Function | Purpose | Producer | Consumer |
|----------|---------|----------|----------|
| `gamification-process-event` | Core event processor: XP + points + streaks + badges + challenges | Experience App (on check-in, booking, purchase) | DB writes |
| `gamification-redeem-reward` | Reward redemption with eligibility + stock + anti-abuse | Experience App | DB writes |
| `gamification-get-profile` | Read member's gamification profile (level, XP, points, badges, streaks) | Experience App | Member |
| `gamification-admin-analytics` | Aggregated analytics for admin dashboard | Admin App | Admin |

### RLS for New Tables

- Member reads: own rows only (`member_id = auth.uid()` or via `line_users` mapping)
- Admin reads: all rows (`level_3_manager`)
- Writes: only via Edge Functions (service role), no direct client writes

---

## SECTION 10 — Admin Control Requirements

The existing Gamification Studio already covers:
- Rules CRUD (action → XP/points mapping)
- Levels CRUD
- Challenges CRUD
- Badges CRUD
- Rewards CRUD
- Trainer Tiers CRUD
- Risk/Audit log viewer

**To add:**
- Season management UI (already has table + hook, needs UI)
- Squad management UI
- Reward redemption history viewer
- Member gamification profile viewer (from member detail page)
- Analytics charts (participation, redemption cost vs retention)

---

## SECTION 11 — Rollout Plan

### Phase 1: Member-side tables + core Edge Function
1. Create 8 new tables via migration (profiles, ledgers, streaks, badge_earnings, challenge_progress, redemptions, squads)
2. Create `gamification-process-event` Edge Function
3. Wire existing check-in/booking/purchase flows to emit gamification events

### Phase 2: Experience App screens
4. Member profile gamification tab (level, XP, points, badges, streak)
5. Challenge participation screen
6. Reward catalog + redemption flow

### Phase 3: Advanced features
7. Squad creation/joining
8. Trainer scoring computation
9. Season management UI in Admin
10. Analytics charts in Admin Overview

### Phase 4: Optimization
11. Reconciliation job (verify ledger totals match profile snapshots)
12. Background level-up notification via `event_outbox`

---

## SECTION 12 — Open Questions

1. **Member auth strategy** — still unresolved from PLATFORM_CONTRACT. Members need Supabase auth accounts to use RLS. LINE LIFF → `line-auth` creates these, but flow needs confirmation.
2. **Streak definition** — consecutive days? consecutive weeks? configurable per season?
3. **Squad size limits** — max members per squad? admin-created vs member-created?
4. **Trainer scoring frequency** — real-time vs daily batch vs monthly snapshot?
5. **Reward fulfillment** — digital only (auto) or physical (requires staff action)?
6. **Cross-location challenges** — can challenges span locations or are they location-scoped?
7. **Points expiry** — do points expire per season or persist forever?
8. **Member gamification visibility** — does the Experience App exist yet in the other Lovable project, or is it still planned?

---

## Key Takeaway

**You do NOT need cross-database sync.** Both apps share one Supabase backend. The gamification platform is a set of new tables + Edge Functions in the SAME project. Admin App configures rules. Experience App produces events and reads profiles. Edge Functions enforce all logic. RLS controls visibility. This is the simplest, safest, most consistent architecture possible for your setup.

