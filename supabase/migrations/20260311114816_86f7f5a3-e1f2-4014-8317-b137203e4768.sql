
-- B1 Fix: SECURITY DEFINER RPC for member slip upload (bypasses RLS on transactions)
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
    RETURN json_build_object('error', 'member_not_found', 'message', 'Member not found');
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

-- B2 Fix: SECURITY DEFINER RPC for member booking cancellation (bypasses RLS on class_bookings)
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
