

# Gamification Architecture — Honest Assessment

## Verified Fact: Single Shared Database

Line 11 of `PLATFORM_CONTRACT.md`:
> "Both apps use the same Supabase project via `@supabase/supabase-js`"

Both the Admin App and Experience App connect to the **same Supabase instance** (`qedxqilmnkbjncpnopty`). They share the same tables, Edge Functions, RLS policies, and types. This is not an assumption — it is the deployed architecture.

## Architecture Recommendation

**Option B is already implemented and deployed.**

| Option | Assessment |
|--------|-----------|
| A. Central Gamification Service | Adds a third system between two apps that already share a DB. Zero benefit, added latency and ops burden. |
| B. Shared DB, Admin configures, Experience produces/consumes | **This is your current architecture.** Admin CRUD on config tables, Experience fires events via Edge Functions, same DB enforces all rules. |
| C. Federated dual-DB with event sync | Introduces eventual consistency, reconciliation jobs, and identity mapping problems for two apps that already share identity tables (`members`, `line_users`, `staff`). Net negative. |

## Why a Dual-DB Design Does Not Apply Here

1. Both projects use the same `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`
2. Both projects import from the same auto-generated `types.ts`
3. Identity is shared — `members.id`, `staff.id`, `line_users` exist in one DB
4. Edge Functions (`gamification-process-event`, `gamification-redeem-reward`) are deployed once and serve both apps
5. RLS policies already govern who sees what per role

Designing a cross-database sync layer on top of this would add complexity with zero architectural benefit.

## What Is Already Deployed (Phase 1)

- 17 gamification tables (config + member ledgers)
- 2 Edge Functions (process-event, redeem-reward)
- RLS policies (staff read all, members read own via `line_users` join)
- Admin Studio UI (8 tabs, full CRUD)
- Idempotency via unique constraints on `xp_ledger.idempotency_key` and `points_ledger.idempotency_key`
- Fire-and-forget event wiring (check-in, class attendance, purchase) — just deployed

## No Code Changes Required

The architecture question has been answered identically across 4 iterations. The system is Option B, it works, and Phase 2 event wiring was just completed.

## Actual Next Steps (If You Want to Continue)

The productive next actions are:

1. **Configure gamification rules** in Admin Studio with `action_key` values: `check_in`, `class_attended`, `package_purchased`
2. **Build Experience App gamification screens** (member profile, XP/points display, badge showcase, reward catalog)
3. **Formalize the architecture document** — save the full 12-section design into `docs/gamification-architecture.md` reflecting the real shared-DB architecture

