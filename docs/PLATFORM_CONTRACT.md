# Shared Backend / API Platform Contract — MOOM

> **Version**: 1.0  
> **Last updated**: 2026-03-08  
> **Scope**: Shared contract for Admin App (admin.moom.fit) + Experience App (member.moom.fit)

---

## 1 — Platform Principles

1. **Supabase-native architecture** — Both apps use the same Supabase project via `@supabase/supabase-js`. Edge Functions serve as the "API layer" for complex mutations.
2. **RLS as the permission boundary** — Row-Level Security is the single source of truth for data access.
3. **Edge Functions for commands** — All multi-step mutations (payment finalization, slip approval, staff invitation) go through Edge Functions for atomicity and idempotency.
4. **Direct SDK for queries** — Both apps query tables directly. RLS ensures data isolation by role.
5. **Shared types, separate UIs** — Both apps consume the same auto-generated `types.ts`.
6. **Audience-safe responses** — Admin sees all columns; Experience App uses column projection. RLS prevents unauthorized row access.

---

## 2 — Cross-Domain Standards

### Response Envelope (Edge Functions)
```typescript
{ data: T, error: null }           // Success
{ data: null, error: { code, message, details? } }  // Error
```

### Pagination
Default: page=1, per_page=50, max=100

### Date/Time
- Storage: UTC `timestamptz`
- Display: `Asia/Bangkok` (client-side)
- Date-only: `date` type

### Money
- Currency: THB as `numeric`
- VAT: 7% stored as `vat_rate`
- Fields: `amount`, `amount_gross`, `amount_ex_vat`, `amount_vat`, `discount_amount`

### IDs
- UUID v4 for entities
- Human-readable: `M-XXXXXXX` (members), `T-XXXXXXX` (transactions)
- Idempotency: `idempotency_key` column on transactions

### Error Codes
`VALIDATION_ERROR` | `NOT_FOUND` | `FORBIDDEN` | `CONFLICT` | `INTERNAL`

---

## 3 — App / Origin / Session Model

### Origins
| App | Origin |
|-----|--------|
| Admin | `https://admin.moom.fit` |
| Experience | `https://member.moom.fit` |
| Preview | `https://moom.lovable.app` |

### CORS
All Edge Functions use dynamic CORS with a 3-origin allowlist.

### Auth
- Token-based via Supabase Auth (JWT)
- Admin: Email/password
- Experience: LINE LIFF → `line-auth` Edge Function
- Refresh: Supabase SDK `onAuthStateChange`

### Redirect URLs
| Flow | Admin | Experience |
|------|-------|------------|
| Post-login | `/` | `/` |
| Stripe success | `/finance?payment=success` | `/payment-success` |
| Stripe cancel | `/finance?payment=cancelled` | `/payment-cancelled` |
| LINE callback | N/A | `/liff/callback` |
| Password reset | `/reset-password` | N/A |

---

## 4 — Shared Enums & Lifecycles

### Member Status
`active` → `suspended` → `active` | `on_hold` → `active` | `inactive`

### Lead Status
`new` → `contacted` → `interested` → `converted` | `not_interested`

### Transaction Status
`pending` → `paid` | `voided` | `failed` | `needs_review`
`paid` → `refunded` | `voided`

### Transfer Slip Status
`needs_review` → `approved` | `rejected` → `voided`

### Booking Status
`booked` → `attended` | `cancelled` | `no_show`

### Package Status
`drafts` → `on_sale` | `scheduled` → `archive`

---

## 5 — Edge Functions

### Core
| Function | Purpose | Access | Origins |
|----------|---------|--------|---------|
| `approve-slip` | Approve transfer slip → transaction + entitlement | level_3_manager | Admin |
| `stripe-create-checkout` | Create Stripe checkout session | level_3_manager | Admin, Experience |
| `stripe-webhook` | Handle Stripe events | Webhook (no auth) | Stripe |
| `invite-staff` | Send staff invitation | level_3_manager | Admin |
| `line-auth` | LINE LIFF authentication | Public | Experience |
| `daily-briefing` | Generate AI daily briefing | level_2_operator | Admin |
| `auto-notifications` | Process notification outbox | System | System |

### Gamification
| Function | Purpose | Access | Origins |
|----------|---------|--------|---------|
| `gamification-process-event` | Core event pipeline: XP/coin/SP/badge/challenge/quest processing | System (service_role via triggers/other functions) | Admin, Experience |
| `gamification-redeem-reward` | Member redeems a reward from the shop | Member (JWT) | Experience |
| `gamification-claim-quest` | Member claims a completed quest | Member (JWT) | Experience |
| `gamification-assign-quests` | Assign available quests to eligible members | System / level_3_manager | Admin |
| `gamification-issue-coupon` | Issue a coupon to a member's wallet | System (called by process-event) | Internal |
| `gamification-admin-ops` | Admin manual operations: adjust XP/coins, grant/revoke badges, season management | level_3_manager | Admin |
| `sync-gamification-config` | Sync gamification rules/levels/rewards from DB to edge cache | level_3_manager | Admin |
| `streak-freeze` | Member uses a streak freeze to preserve streak | Member (JWT) | Experience |
| `evaluate-tiers-daily` | Daily cron: evaluates status tier for all active members | System (service_role, cron) | Internal |

### Implemented as RPCs (not Edge Functions)
| RPC | Purpose | Access |
|-----|---------|--------|
| `create_booking_safe` | Member books a class with capacity/duplicate checks | Member |
| `cancel_booking_safe` | Member cancels a booking | Member |
| `member_self_checkin` | Member self-service check-in | Member |
| `evaluate_member_tier` | Evaluate and update a member's status tier | System (SECURITY DEFINER) |

---

## 6 — Permission Matrix

| Domain | Admin (L3+) | Staff (L1-2) | Member |
|--------|-------------|--------------|--------|
| Members | Full CRUD | Read | Own only |
| Leads | Full CRUD | Read (L2+) | — |
| Finance | Full CRUD | — | Own billing |
| Transfer Slips | Full CRUD | — | — |
| Staff | Full CRUD (L3+) | Read own | — |
| Roles | Full CRUD (L4) | — | — |
| Schedule | Full CRUD (L2+) | Read + book | Read + book |
| Packages | Full CRUD (L3+) | Read | Read (on_sale) |

---

## 7 — Shared Types Strategy

Both projects import from the same Supabase project → same auto-generated `types.ts`.
Each project defines domain types in `src/types/domain.ts`.
Edge Function contracts documented in `docs/`.

---

## 8 — Rollout Plan

1. **Phase 1** (Done): CORS allowlist expanded to 3 origins
2. **Phase 2**: Member-level RLS policies for self-service data access
3. **Phase 3**: Experience App Edge Functions (booking, profile)
4. **Phase 4**: Experience App frontend screens

---

## 9 — Open Questions

1. Member auth strategy (Supabase accounts vs service-role proxy)
2. Storage buckets for avatars, slips, contracts
3. LINE push notification credentials
4. Booking engine business rules (cancellation cutoff, waitlist, eligibility)
5. Member self-purchase Stripe flow
