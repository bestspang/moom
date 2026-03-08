

# Phase 2: Wire Events to Gamification Engine

## What We're Building

Add gamification event firing to three existing flows — check-in, class attendance, and purchase — by calling the `gamification-process-event` Edge Function after each successful action. No new tables or Edge Functions needed.

## Approach: Shared Helper + Fire-and-Forget

Create a single helper function that calls the Edge Function. Wire it into existing `onSuccess` callbacks. Gamification calls are **fire-and-forget** — failures are logged but never block the primary flow.

## Implementation Plan

### 1. Create `src/lib/gamificationEvents.ts` helper

A thin wrapper that calls `supabase.functions.invoke('gamification-process-event', ...)` with the standard payload shape. Includes:
- `fireGamificationEvent(params: { event_type, member_id, idempotency_key, location_id?, metadata? })`
- Catches and logs errors silently (never throws)
- Requires an active session (reads auth header automatically via the supabase client)

### 2. Wire check-in → `check_in` event

In `src/hooks/useLobby.ts` `useCreateCheckIn` → `onSuccess`:
- Call `fireGamificationEvent({ event_type: 'check_in', member_id, idempotency_key: 'checkin:{attendance_id}', location_id })`
- The attendance record ID from `data.id` serves as the idempotency key

### 3. Wire class attendance → `class_attended` event

In `src/hooks/useClassBookings.ts` `useMarkAttendance` → `onSuccess`:
- Only fire when `variables.status === 'attended'`
- Call `fireGamificationEvent({ event_type: 'class_attended', member_id: data.member_id, idempotency_key: 'class_attended:{bookingId}', location_id, metadata: { schedule_id: data.schedule_id } })`

Also wire `useBatchMarkAttendance` → `onSuccess` to fire one event per attended booking.

### 4. Wire purchase → `package_purchased` event (server-side)

In `supabase/functions/approve-slip/index.ts` after step 10 (activity log):
- Add a call to process gamification event directly via the service client (same DB, no HTTP hop needed — just insert into the same tables the Edge Function would)
- Actually, cleaner approach: call the gamification Edge Function internally OR replicate the minimal logic. Since both are in the same Supabase project, we'll **invoke the function via HTTP** from within the Edge Function using `fetch` to `${SUPABASE_URL}/functions/v1/gamification-process-event`.
- Idempotency key: `purchase:{transaction_id}`

Similarly wire `supabase/functions/stripe-webhook/index.ts` for Stripe-based purchases.

### 5. Files touched

| File | Change |
|------|--------|
| `src/lib/gamificationEvents.ts` | **New** — shared helper |
| `src/hooks/useLobby.ts` | Add import + 1 call in `onSuccess` |
| `src/hooks/useClassBookings.ts` | Add import + 2 calls in `onSuccess` (single + batch) |
| `supabase/functions/approve-slip/index.ts` | Add gamification event call after activity log |
| `supabase/functions/stripe-webhook/index.ts` | Add gamification event call after package creation |

### 6. Safety

- All gamification calls are wrapped in try/catch — failures never break primary flows
- Idempotency keys prevent double-crediting (enforced by unique constraint in `xp_ledger`)
- No schema changes needed — all tables and Edge Functions already exist
- No changes to existing behavior — only additive `onSuccess` side-effects

### 7. Risks

- If `gamification_rules` has no matching `action_key` for `check_in`, `class_attended`, or `package_purchased`, the Edge Function returns `no_matching_rule` gracefully (already handled in existing code)
- Admin must configure rules with these action keys for XP/points to actually be granted

