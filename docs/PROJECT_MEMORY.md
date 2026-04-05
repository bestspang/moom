# Project Memory — MOOM Fitness Platform

> **Last updated:** 2026-04-05
> **Status:** ACTIVE — authoritative source for architecture decisions

---

## Architecture Overview

4 surfaces sharing one Supabase backend:
- **Admin** (`/`) — Desktop dashboard for gym owners/managers
- **Member** (`/member/*`) — Mobile-first member app (gamification, bookings, check-in)
- **Trainer** (`/trainer/*`) — Mobile-first trainer app (impact, roster, schedule)
- **Staff** (`/staff/*`) — Mobile-first front-desk app (check-in, member lookup)

### Surface Detection
- Production: hostname-based (`admin.moom.fit`, `member.moom.fit`)
- Preview: path-based (`/member/*` = member, `/trainer/*` = trainer, `/staff/*` = staff, `/` = admin)
- **⚠️ Preview root `/` is ALWAYS admin** — do not test member features at `/`

### Auth
- Supabase Auth with `user_roles` table (never on profile/users)
- `access_level` enum for permission hierarchy
- `ProtectedRoute` component enforces route-level access
- `identity_map` bridges admin entities ↔ experience user accounts

---

## Key Invariants (DO NOT BREAK)

### 1. MobilePageHeader Everywhere (UI Invariant)
- **ALL** member/trainer/staff pages MUST use `MobilePageHeader` component
- Do NOT add inline `ArrowLeft` back buttons or custom header divs
- Back navigation goes in the `action` prop of MobilePageHeader

### 2. Coming Soon Pattern
- Items not yet implemented use: `opacity-60 pointer-events-none`
- Show subtitle like "Coming Soon" — do NOT add click handlers or toast
- Do NOT add chevron icons on disabled items
- This applies to Staff Profile, Trainer Profile, and any future placeholder items

### 3. No Fake Actions on Live Surfaces
- Every clickable button must be wired to real logic OR use the Coming Soon pattern above
- `toast.info("coming soon")` on clickable items is NOT acceptable

### 4. Gamification Event Keys
- `gamification_rules.action_key` uses: `class_attend`, `package_purchase`, `check_in`, etc.
- `status_tier_sp_rules.action_key` uses: `class_attend`, `package_purchased_1m/3m/6m/12m`
- **Emitters MUST send keys matching `gamification_rules.action_key`** (e.g. `class_attend` NOT `class_attended`)
- The DB enum `gamification_event_type` still has legacy names — ignore for emitter keys
- See `docs/gamification-event-map.md` for full mapping

### 5. Receipt/Transfer Slip Flow
- `transfer_slips` is the **canonical review entity**
- `member_upload_slip` RPC writes to `transfer_slips` (fixed 2026-04-05)
- `approve-slip` edge function reads from `transfer_slips`, creates `transactions` + `member_packages`
- Admin reviews via `TransferSlips.tsx` → `SlipDetailDialog.tsx`
- Staff views via `StaffPaymentsPage.tsx`

### 6. Generated Files (DO NOT EDIT)
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`
- `.env`

---

## Do-Not-Touch Zones

| Zone | Why |
|------|-----|
| Auth/RLS policies | Security-critical, blast radius = entire app |
| `src/integrations/supabase/` | Auto-generated |
| Shared UI components (`src/components/ui/`) | Used everywhere, changes cascade |
| Core routing (`src/App.tsx`) | Affects all surfaces |
| `supabase/config.toml` project settings | Auto-managed |

---

## Edge Functions

| Function | Purpose | Auth |
|----------|---------|------|
| `approve-slip` | Atomic slip approval → transaction + package | level_3_manager |
| `gamification-process-event` | XP/Coin/SP/Badge/Challenge processor | Bearer token |
| `gamification-redeem-reward` | Reward redemption | Bearer token |
| `stripe-webhook` | Stripe payment processing | Stripe signature |
| `auto-notifications` | Pending slip notifications | Service role |
| `daily-briefing` | AI daily briefing generation | Service role |
| `evaluate-tiers-daily` | Status tier evaluation | Service role |
| `line-auth` | LINE OAuth flow | Public |
| `streak-freeze` | Streak freeze purchase | Bearer token |

---

## Testing Rules

1. **Preview** shows admin surface at `/` — navigate to `/member/check-in` to test member features
2. **Published site** (`moom.lovable.app`) uses hostname detection correctly
3. Always verify on published site for member/trainer/staff features
4. Edge function changes deploy automatically — no manual deploy needed
