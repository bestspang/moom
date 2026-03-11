

# Post-Fix Re-Audit — Round 3

## SECTION A — Executive Summary

The previous rounds fixed server-side validation (check-in, booking creation), storage uploads, and i18n. However, **two critical RLS policy gaps** remain that will cause member-facing features to fail at runtime. The code looks correct but the database policies block member writes.

**Overall:** ~90% code-ready, but 2 runtime-breaking RLS issues make key member flows non-functional.

**Biggest Risks:**
1. Members cannot upload transfer slips — `transactions` INSERT requires `level_3_manager`
2. Members cannot cancel bookings — `class_bookings` UPDATE requires `level_2_operator`
3. Remaining `as any` casts mask type mismatches

**Biggest Strengths:** All prior critical fixes (B1-B4) are correctly implemented. Architecture is clean. Gamification engine is robust.

---

## SECTION B — Critical Bugs

### B1. CRITICAL: Slip Upload Fails for Members — RLS Blocks INSERT on `transactions`

**Severity:** CRITICAL — feature is completely broken for all members  
**Root Cause:** `transactions` table RLS only has policies for `level_3_manager+`. The `uploadTransferSlip()` function does a direct client-side `.insert()` into `transactions`, but members have `level_1_minimum` access. The insert will be silently rejected or throw an RLS error.

**Evidence:** DB query confirms only two policies on `transactions`:
- `Managers can manage transactions` (ALL, `level_3_manager`)
- `Managers can read transactions` (SELECT, `level_3_manager`)

No INSERT policy exists for members.

**Fix:** Create a `SECURITY DEFINER` RPC `member_upload_slip(p_member_id, p_amount, p_bank_name, p_transfer_date, p_slip_url)` that:
- Validates the member exists and is active
- Inserts into `transactions` with proper defaults
- Returns the transaction reference
Then update `uploadTransferSlip()` in `services.ts` to call this RPC instead of direct insert.

### B2. CRITICAL: Cancel Booking Fails for Members — RLS Blocks UPDATE on `class_bookings`

**Severity:** CRITICAL — members cannot cancel their own bookings  
**Root Cause:** `class_bookings` UPDATE policy requires `level_2_operator`. The `cancelBooking()` function does a direct `.update()` which will fail for members (`level_1_minimum`).

Note: `create_booking_safe` works because it's a `SECURITY DEFINER` RPC that bypasses RLS. But cancellation was implemented as a direct client update.

**Fix:** Create a `SECURITY DEFINER` RPC `cancel_booking_safe(p_booking_id, p_member_id, p_reason)` that:
- Verifies the booking belongs to the member
- Verifies the booking is in a cancellable state
- Updates the booking status
Then update `cancelBooking()` to call this RPC.

---

## SECTION C — Medium-Priority Issues

### C1. `as any` Casts on Enum Values in `services.ts`

`'bank_transfer' as any` and `'pending' as any` — these happen to be valid enum values, so they work at runtime. But the casts bypass compile-time checking. After fixing B1 (moving to RPC), these casts become moot since the RPC handles the insert.

### C2. Google OAuth SVG Duplicated in 3 Auth Files

The same Google icon SVG is copy-pasted in `AdminLogin.tsx`, `MemberLogin.tsx`, and `MemberSignup.tsx`. Extract to a shared component.

### C3. `member_attendance` SELECT Policy Uses `level_1_minimum`

This means any authenticated user can read ALL members' attendance. Not a security crisis but worth narrowing if needed.

---

## SECTION D — End-to-End Flow Matrix (Updated)

| Flow | Status | Notes |
|---|---|---|
| Member signup | Works | Trigger auto-provisions |
| Member login (password/Google) | Works | |
| Check-in | Works | Server-side RPC |
| Book class | Works | Server-side RPC |
| Cancel booking | **BROKEN** | RLS blocks member UPDATE (B2) |
| Upload slip | **BROKEN** | RLS blocks member INSERT on transactions (B1) |
| Redeem reward | Works | Server-side edge function |
| Trainer home | Works | staffId resolved from staff table |
| Staff surface | Works | i18n migrated |
| Admin operations | Works | |

---

## SECTION H — Priority Fix Plan

### Must Fix Before Launch
1. **B1** — Create `member_upload_slip` RPC (SECURITY DEFINER) + update `services.ts`
2. **B2** — Create `cancel_booking_safe` RPC (SECURITY DEFINER) + update `services.ts`

### Should Fix Soon After Launch
3. **C2** — Extract Google icon to shared component

### Nice to Improve Later
4. **C1** — Remove remaining `as any` casts
5. **C3** — Narrow attendance SELECT policy

---

## Implementation Plan

### Fix B1 — Member Slip Upload RPC

**Migration SQL:**
```sql
CREATE OR REPLACE FUNCTION public.member_upload_slip(
  p_member_id uuid,
  p_amount numeric,
  p_bank_name text,
  p_transfer_date text,
  p_slip_url text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_member members%ROWTYPE;
  v_txn_id text;
  v_order_name text;
BEGIN
  SELECT * INTO v_member FROM members WHERE id = p_member_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'member_not_found');
  END IF;

  v_txn_id := 'TXN-' || extract(epoch from now())::bigint;
  v_order_name := 'SLIP-' || extract(epoch from now())::bigint;

  INSERT INTO transactions (
    transaction_id, order_name, amount, member_id,
    payment_method, status, transfer_slip_url, notes, source_type
  ) VALUES (
    v_txn_id, v_order_name, p_amount, p_member_id,
    'bank_transfer', 'pending', p_slip_url,
    'Bank: ' || p_bank_name || ', Date: ' || p_transfer_date,
    'member_upload'
  );

  RETURN json_build_object('success', true, 'transaction_id', v_txn_id);
END;
$$;
```

**Frontend:** Update `uploadTransferSlip()` to call `supabase.rpc('member_upload_slip', {...})` instead of direct insert.

### Fix B2 — Cancel Booking RPC

**Migration SQL:**
```sql
CREATE OR REPLACE FUNCTION public.cancel_booking_safe(
  p_booking_id uuid,
  p_member_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_booking class_bookings%ROWTYPE;
BEGIN
  SELECT * INTO v_booking FROM class_bookings
  WHERE id = p_booking_id AND member_id = p_member_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'not_found', 'message', 'Booking not found or not authorized');
  END IF;

  IF v_booking.status NOT IN ('booked', 'waitlisted') THEN
    RETURN json_build_object('error', 'not_cancellable', 'message', 'Booking cannot be cancelled');
  END IF;

  UPDATE class_bookings
  SET status = 'cancelled', cancelled_at = now(), cancellation_reason = p_reason
  WHERE id = p_booking_id;

  RETURN json_build_object('success', true);
END;
$$;
```

**Frontend:** Update `cancelBooking()` to call `supabase.rpc('cancel_booking_safe', {...})` instead of direct update.

### Files to Edit
| File | Change |
|---|---|
| New migration | Create `member_upload_slip` + `cancel_booking_safe` RPCs |
| `src/apps/member/api/services.ts` | Replace direct insert/update with RPC calls |

## SECTION J — Final Launch Recommendation

**Not ready yet** — Two core member flows (slip upload and booking cancellation) will fail at runtime due to RLS policy restrictions. Both fixes are small (one migration + ~20 lines of frontend changes).

