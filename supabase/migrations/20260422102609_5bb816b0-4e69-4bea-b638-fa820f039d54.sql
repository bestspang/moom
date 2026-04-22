-- Atomic slip-approval RPC
-- Wraps transactions + member_packages + member_billing + transfer_slips.status update
CREATE OR REPLACE FUNCTION public.process_slip_approval(
  p_slip_id                uuid,
  p_transaction_no         text,
  p_amount_gross           numeric,
  p_amount_ex_vat          numeric,
  p_amount_vat             numeric,
  p_vat_rate               numeric,
  p_member_id              uuid,
  p_package_id             uuid,
  p_package_name_snapshot  text,
  p_package_type           text,
  p_location_id            uuid,
  p_staff_id               uuid,
  p_note                   text,
  p_idempotency_key        text,
  p_payment_method         text,
  p_sold_to_name           text,
  p_sold_to_contact        text,
  p_sessions_total         integer,
  p_activation_date        timestamptz,
  p_expiry_date            timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_existing_tx record;
  v_tx_id uuid;
  v_member_package_id uuid;
  v_slip transfer_slips%ROWTYPE;
BEGIN
  -- Lock the slip
  SELECT * INTO v_slip
  FROM transfer_slips
  WHERE id = p_slip_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SLIP_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  -- Idempotency: if slip already approved + tx already exists, return it
  SELECT id, transaction_id INTO v_existing_tx
  FROM transactions
  WHERE idempotency_key = p_idempotency_key
  LIMIT 1;

  IF v_existing_tx.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'idempotent', true,
      'transaction_id', v_existing_tx.id,
      'transaction_no', v_existing_tx.transaction_id,
      'slip_id', p_slip_id
    );
  END IF;

  IF v_slip.status <> 'needs_review' THEN
    RAISE EXCEPTION 'SLIP_INVALID_STATUS:%', v_slip.status USING ERRCODE = 'P0001';
  END IF;

  -- Insert transaction
  INSERT INTO transactions (
    transaction_id, member_id, package_id, order_name, type, amount,
    payment_method, status, location_id, staff_id, notes,
    source_type, source_ref, idempotency_key, currency,
    amount_gross, amount_ex_vat, amount_vat, vat_rate,
    discount_amount, paid_at, package_name_snapshot,
    sold_to_name, sold_to_contact, transfer_slip_url
  ) VALUES (
    p_transaction_no, p_member_id, p_package_id,
    COALESCE('Slip approval: ' || p_package_name_snapshot, 'Slip approval'),
    COALESCE(p_package_type, 'class')::transaction_type,
    p_amount_gross, COALESCE(p_payment_method, 'bank_transfer')::payment_method,
    'completed'::transaction_status, p_location_id, p_staff_id, p_note,
    'slip', p_slip_id::text, p_idempotency_key, 'THB',
    p_amount_gross, p_amount_ex_vat, p_amount_vat, p_vat_rate,
    0, COALESCE(v_slip.slip_datetime, now()), p_package_name_snapshot,
    p_sold_to_name, p_sold_to_contact, v_slip.slip_file_url
  )
  RETURNING id INTO v_tx_id;

  -- Create member_packages entitlement
  IF p_package_id IS NOT NULL THEN
    INSERT INTO member_packages (
      member_id, package_id, purchase_date, activation_date, expiry_date,
      sessions_total, sessions_remaining, sessions_used, status,
      purchase_transaction_id, package_name_snapshot
    ) VALUES (
      p_member_id, p_package_id, COALESCE(v_slip.slip_datetime, now()),
      p_activation_date, p_expiry_date,
      p_sessions_total, p_sessions_total, 0, 'active',
      v_tx_id, p_package_name_snapshot
    )
    RETURNING id INTO v_member_package_id;
  END IF;

  -- Insert billing line
  INSERT INTO member_billing (
    member_id, transaction_id, amount, description, billing_date
  ) VALUES (
    p_member_id, v_tx_id, p_amount_gross,
    COALESCE('Slip approval: ' || p_package_name_snapshot, 'Slip approval'),
    COALESCE(v_slip.slip_datetime, now())
  );

  -- Mark slip approved
  UPDATE transfer_slips
  SET status = 'approved',
      reviewer_staff_id = p_staff_id,
      reviewed_at = now(),
      review_note = p_note,
      linked_transaction_id = v_tx_id,
      updated_at = now()
  WHERE id = p_slip_id;

  RETURN jsonb_build_object(
    'transaction_id', v_tx_id,
    'transaction_no', p_transaction_no,
    'member_package_id', v_member_package_id,
    'slip_id', p_slip_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_slip_approval(
  uuid, text, numeric, numeric, numeric, numeric, uuid, uuid, text, text,
  uuid, uuid, text, text, text, text, text, integer, timestamptz, timestamptz
) TO authenticated, service_role;