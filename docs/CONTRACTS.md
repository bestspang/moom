# Contracts — MOOM Fitness Platform

> **Last updated:** 2026-04-05
> **Status:** ACTIVE — authoritative source for API/DB/event contracts

---

## Gamification Event Contract

### Emitter → Processor Keys (MUST match `gamification_rules.action_key`)

| Source | Event Key | File |
|--------|-----------|------|
| Lobby check-in | `check_in` | `src/hooks/useLobby.ts` |
| Class attendance | `class_attend` | `src/hooks/useClassBookings.ts` |
| Manual purchase | `package_purchase` | `src/hooks/useMemberDetails.ts` |
| Slip approval | `package_purchase` | `supabase/functions/approve-slip/index.ts` |
| Stripe payment | `package_purchase` | `supabase/functions/stripe-webhook/index.ts` |

### ⚠️ Legacy Keys (DB enum only — do NOT use in emitters)
- `class_attended` → use `class_attend`
- `package_purchased` → use `package_purchase`

### SP Rules (status_tier_sp_rules.action_key)
- `class_attend`, `open_gym_45min`, `pt_session`
- `package_purchased_1m`, `package_purchased_3m`, `package_purchased_6m`, `package_purchased_12m`
- `shop_purchase`, `referral_purchase`

---

## Receipt/Transfer Slip Contract

### Upload Flow
```
Member → uploadTransferSlip() → storage upload → RPC member_upload_slip
  → INSERT INTO transfer_slips (status='needs_review')
```

### Review Flow
```
Admin → TransferSlips.tsx → SlipDetailDialog.tsx
  → approve-slip edge function
    → INSERT transactions (status='paid')
    → INSERT member_billing
    → INSERT member_packages (status='active')
    → UPDATE transfer_slips (status='approved')
    → Fire gamification event (package_purchase)
```

### Reject/Void Flow
```
Admin → SlipDetailDialog → UPDATE transfer_slips (status='rejected'|'voided')
```

---

## Route Contract

| Path Pattern | Surface | Auth Required |
|-------------|---------|---------------|
| `/` | Admin Dashboard | Yes (level_2+) |
| `/member/*` | Member App | Yes (member) |
| `/trainer/*` | Trainer App | Yes (trainer) |
| `/staff/*` | Staff App | Yes (staff) |
| `/login` | Auth | No |
| `/member/login` | Member Auth | No |

---

## Database Key Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `transfer_slips` | Canonical receipt/slip review entity | Operators+ |
| `transactions` | Completed financial transactions | Operators+ |
| `gamification_rules` | XP/Coin rule definitions | Staff read, Manager write |
| `status_tier_sp_rules` | SP rule definitions | Staff read, Manager write |
| `xp_ledger` | XP transaction log (idempotent) | Member own + Staff read |
| `points_ledger` | Coin transaction log (idempotent) | Member own + Staff read |
| `member_gamification_profiles` | Aggregated gamification state | Member own + Staff read |

---

## Atomic Write RPCs (Phase 1 — race-condition hardening)

All multi-step financial / inventory writes are wrapped in `SECURITY DEFINER` Postgres functions that use `SELECT ... FOR UPDATE` to eliminate TOCTOU races. Edge functions call these via `.rpc(...)` instead of issuing multiple `INSERT`/`UPDATE` statements.

| RPC | Replaces | Guarantees |
|-----|----------|------------|
| `process_redeem_reward(p_member_id, p_reward_id)` | 6-step block in `gamification-redeem-reward` | Locks profile + reward rows; atomic balance check, stock decrement, redemption insert, ledger entry. Returns `OUT_OF_STOCK` / `INSUFFICIENT_BALANCE` error codes. |
| `process_package_sale(p_member_id, p_package_id, p_amount, p_payment_method, p_idempotency_key, p_discount_amount, p_processed_by)` | Multi-step writes in `sell-package` | Atomic insert of `transactions` + `member_billing` + `member_packages` (entitlement) + coupon usage + promotion counters. Idempotency-key dedupe. |
| `process_slip_approval(p_slip_id, p_approved_by)` | Multi-step approval in `approve-slip` | Locks `transfer_slips` row, calls `process_package_sale` internally, updates slip status to `approved` — all in one transaction. Eliminates "paid but no package" orphan state. |

> **Stripe webhook** uses `process_stripe_payment` (added earlier) for the same atomic guarantees.
