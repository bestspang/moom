
-- Add missing process_stripe_payment RPC
-- Called by stripe-webhook on checkout.session.completed
-- Atomically: update transaction → paid, insert billing line, create member_packages
-- Idempotent on stripe_session_id (re-deliveries return existing result)
CREATE OR REPLACE FUNCTION public.process_stripe_payment(
  p_transaction_id     uuid,
  p_stripe_session_id  text,
  p_package_id         uuid,
  p_member_id          uuid,
  p_amount             numeric,
  p_package_name       text,
  p_sessions_total     integer,
  p_expiry_date        timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tx               record;
  v_member_package_id uuid;
  v_existing_billing uuid;
  v_existing_mp      uuid;
BEGIN
  -- Lock the transaction row
  SELECT id, status, type, paid_at
    INTO v_tx
  FROM transactions
  WHERE id = p_transaction_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TRANSACTION_NOT_FOUND:%', p_transaction_id USING ERRCODE = 'P0002';
  END IF;

  -- Idempotency: already paid → return existing entitlement
  IF v_tx.status = 'paid' THEN
    SELECT id INTO v_member_package_id
    FROM member_packages
    WHERE purchase_transaction_id = p_transaction_id
    LIMIT 1;
    RETURN jsonb_build_object(
      'idempotent', true,
      'transaction_id', p_transaction_id,
      'member_package_id', v_member_package_id
    );
  END IF;

  -- Mark transaction paid + record stripe ref
  UPDATE transactions
  SET status        = 'paid'::transaction_status,
      paid_at       = COALESCE(paid_at, now()),
      source_type   = COALESCE(source_type, 'stripe'),
      source_ref    = COALESCE(source_ref, p_stripe_session_id)
  WHERE id = p_transaction_id;

  -- Billing line (skip if already present — defensive)
  SELECT id INTO v_existing_billing
  FROM member_billing
  WHERE transaction_id = p_transaction_id
  LIMIT 1;

  IF v_existing_billing IS NULL THEN
    INSERT INTO member_billing (
      member_id, transaction_id, amount, description, billing_date
    ) VALUES (
      p_member_id, p_transaction_id, p_amount,
      COALESCE('Stripe: ' || p_package_name, 'Stripe payment'),
      now()
    );
  END IF;

  -- Member package entitlement (skip if already present)
  IF p_package_id IS NOT NULL THEN
    SELECT id INTO v_existing_mp
    FROM member_packages
    WHERE purchase_transaction_id = p_transaction_id
    LIMIT 1;

    IF v_existing_mp IS NULL THEN
      INSERT INTO member_packages (
        member_id, package_id, purchase_date, activation_date, expiry_date,
        sessions_total, sessions_remaining, sessions_used, status,
        purchase_transaction_id, package_name_snapshot
      ) VALUES (
        p_member_id, p_package_id, now(), now(), p_expiry_date,
        p_sessions_total, p_sessions_total, 0, 'active',
        p_transaction_id, p_package_name
      )
      RETURNING id INTO v_member_package_id;
    ELSE
      v_member_package_id := v_existing_mp;
    END IF;
  END IF;

  -- Audit log
  INSERT INTO activity_log (event_type, activity, entity_type, entity_id, member_id, new_value)
  VALUES (
    'stripe.paid',
    'Stripe payment captured',
    'finance_transaction',
    p_transaction_id,
    p_member_id,
    jsonb_build_object('amount', p_amount, 'stripe_session_id', p_stripe_session_id)
  );

  RETURN jsonb_build_object(
    'transaction_id', p_transaction_id,
    'member_package_id', v_member_package_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_stripe_payment(
  uuid, text, uuid, uuid, numeric, text, integer, timestamptz
) TO service_role;
