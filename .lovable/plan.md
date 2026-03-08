

# Gamification Platform: Cross-Project Architecture Assessment

## Critical Finding: Your Platform Already Uses Shared Backend

Your `PLATFORM_CONTRACT.md` (line 11) explicitly states:

> "Both apps use the same Supabase project via `@supabase/supabase-js`"

Your `gamification-architecture.md` (line 5-7) confirms:

> "Architecture: Option B — Shared Supabase Backend. Both Admin App and Experience App share ONE Supabase project."

Your memory note `architecture/project-split` confirms:

> "แพลตฟอร์มถูกออกแบบให้แยกโครงการ Frontend เป็น 2 โปรเจกต์หลัก...โดยเชื่อมต่อกับ Backend เดียวกัน"

**You have two separate frontend projects but ONE shared Supabase backend.** The gamification tables, Edge Functions, RLS policies, and auth system are already deployed in this shared backend. Both apps connect to the same database via the same Supabase URL.

---

## Architecture Recommendation

### Option A: Central Gamification Service (Separate DB)
- Requires building a third system (API gateway + DB) just for gamification
- Adds network hops, deployment complexity, and a new failure domain
- **Not recommended** — overkill for your scale

### Option B: Shared DB, Admin Owns Config, Experience Produces Events (CURRENT)
- Already implemented and working
- Admin App: CRUD on config tables (rules, levels, badges, challenges, rewards, tiers, seasons)
- Experience App: calls Edge Functions to produce events, reads own profiles via RLS
- Edge Functions: enforce all business logic (XP, points, streaks, anti-abuse)
- RLS: data isolation by role
- **Recommended — this IS your architecture already**

### Option C: Federated Dual-DB with Event Sync
- Would require: event bus, dead-letter queue, reconciliation jobs, idempotent projections, conflict resolution
- All for zero benefit since both apps already share one DB
- **Not recommended** — unnecessary complexity

### Verdict

**Option B is already implemented.** Two Lovable frontend projects sharing one Supabase backend is the correct architecture. It gives you:
- Zero sync lag (direct table access)
- Zero reconciliation burden
- Atomic multi-step mutations via Edge Functions
- RLS-based data isolation (admin sees all, members see own)
- Single source of truth for all gamification state

If the Experience App were ever moved to its own Supabase project (separate Lovable Cloud), **then** you would need cross-database sync. But that is not the current architecture and would add significant complexity with no clear benefit.

---

## What Is Already Built (Phase 1 Complete)

| Component | Status |
|-----------|--------|
| 8 config tables (rules, levels, badges, challenges, rewards, tiers, seasons, audit) | Deployed |
| 9 member-side tables (profiles, XP/points ledgers, streaks, badge earnings, challenge progress, redemptions, squads) | Deployed |
| `gamification-process-event` Edge Function | Deployed |
| `gamification-redeem-reward` Edge Function | Deployed |
| Admin Studio UI (8 tabs, full CRUD) | Deployed |
| RLS policies (manager manage, staff read, member own) | Deployed |
| Idempotency via `idempotency_key` unique constraints | Deployed |
| Anti-abuse (cooldowns, daily limits, audit flagging) | Deployed |
| Append-only ledgers with rollback support | Deployed |

---

## What Remains (Phase 2-4)

### Phase 2: Wire Events + Experience App Screens
- Wire check-in/booking/purchase flows to call `gamification-process-event`
- Build Experience App member screens (profile, challenges, rewards)

### Phase 3: Advanced Features
- Squad management UI + Edge Function
- Trainer scoring computation (in-house vs freelance)
- Season management UI in Admin

### Phase 4: Optimization
- Reconciliation job (verify ledger totals match profile snapshots)
- Analytics charts in Admin Overview
- Background notifications via `event_outbox`

---

## No Action Required

The architecture question is already resolved. Your system uses Option B (shared backend) which is the optimal choice. All gamification tables, Edge Functions, and RLS policies are deployed and working.

The next actionable step is **Phase 2**: wiring the Experience App's real-world events (check-in, booking, purchase) to the `gamification-process-event` Edge Function.

