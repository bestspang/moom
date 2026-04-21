-- Atomic write RPCs for sell-package, approve-slip, and stripe-webhook
-- Wraps multi-table writes in a single Postgres transaction to prevent partial writes

-- ============================================================
-- 1. process_package_sale — atomic version of sell-package writes
-- ============================================================
CREATE OR REPLACE FUNCTION public.process_package_sale(
  p_transaction_id         text,
  p_transaction_no         text,
  p_order_name             text,
  p_amount                 numeric,
  p_amount_gross           numeric,
  p_amount_ex_vat          numeric,
  p_amount_vat             numeric,
  p_vat_rate               numeric,
  p_currency               text,
  p_type                   text,
  p_payment_method         text,
  p_paid_at                timestamptz,
  p_member_id              uuid,
  p_package_id             uuid,
  p_package_name_snapshot  text,
  p_location_id            uuid,
  p_staff_id               uuid,
  p_notes                  text,
  p_source_type            text,
  p_source_ref             text,
  p_idempotency_key        text,
  p_discount_amount        numeric,
  p_sold_to_name           text,
  p_sold_to_contact        text,
  p_sessions_total         integer,
  p_activation_date        timestamptz,
  p_expiry_date            timestamptz,
  p_promotion_id           uuid,
  p_promotion_usage_count  integer,
  p_promotion_discount     numeric,
  p_coupon_wallet_id       uuid,
  p_coupon_discount        numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx_id    uuid;
  v_mp_id    uuid;
BEGIN
  -- 1. Insert finance transaction
  INSERT INTO transactions (
    transaction_id, order_name, amount, amount_gross, amount_ex_vat, amount_vat,
    vat_rate, currency, type, payment_method, status, paid_at, member_id, package_id,
    package_name_snapshot, location_id, staff_id, notes, source_type, source_ref,
    idempotency_key, discount_amount, sold_to_name, sold_to_contact
  )
  VALUES (
    p_transaction_no, p_order_name, p_amount, p_amount_gross, p_amount_ex_vat, p_amount_vat,
    p_vat_rate, p_currency, p_type, p_payment_method, 'paid', p_paid_at, p_member_id, p_package_id,
    p_package_name_snapshot, p_location_id, p_staff_id, p_notes, p_source_type, p_source_ref,
    p_idempotency_key, p_discount_amount, p_sold_to_name, p_sold_to_contact
  )
  RETURNING id INTO v_tx_id;

  -- 2. Insert member_packages entitlement
  INSERT INTO member_packages (
    member_id, package_id, package_name_snapshot, purchase_date, activation_date,
    expiry_date, sessions_total, sessions_remaining, sessions_used, status,
    purchase_transaction_id
  )
  VALUES (
    p_member_id, p_package_id, p_package_name_snapshot, p_paid_at, p_activation_date,
    p_expiry_date, p_sessions_total, p_sessions_total, 0, 'active', v_tx_id
  )
  RETURNING id INTO v_mp_id;

  -- 3. Insert member_billing
  INSERT INTO member_billing (member_id, transaction_id, amount, description)
  VALUES (p_member_id, v_tx_id, p_amount, 'Purchase: ' || p_package_name_snapshot);

  -- 4. Record promotion redemption + bump usage_count (only if promotion used)
  IF p_promotion_id IS NOT NULL AND p_promotion_discount > 0 THEN
    INSERT INTO promotion_redemptions (
      promotion_id, member_id, transaction_id, discount_amount, gross_amount, net_amount
    )
    VALUES (
      p_promotion_id, p_member_id, v_tx_id, p_promotion_discount, p_amount_gross, p_amount
    );

    UPDATE promotions
    SET usage_count = COALESCE(usage_count, 0) + 1
    WHERE id = p_promotion_id;
  END IF;

  -- 5. Mark coupon as used (only if coupon used)
  IF p_coupon_wallet_id IS NOT NULL AND p_coupon_discount > 0 THEN
    UPDATE coupon_wallet
    SET status = 'used', used_at = NOW()
    WHERE id = p_coupon_wallet_id;
  END IF;

  -- 6. Activity log
  INSERT INTO activity_log (
    event_type, activity, entity_type, entity_id, staff_id, member_id, new_value
  )
  VALUES (
    'package_sold',
    'Package "' || p_package_name_snapshot || '" sold to member ' || p_member_id || '. Amount: ' || p_amount || ' THB.',
    'member',
    p_member_id::text,
    p_staff_id,
    p_member_id,
    jsonb_build_object(
      'transaction_id', v_tx_id,
      'transaction_no', p_transaction_no,
      'package_id', p_package_id,
      'package_name', p_package_name_snapshot,
      'amount', p_amount,
      'amount_gross', p_amount_gross,
      'amount_ex_vat', p_amount_ex_vat,
      'amount_vat', p_amount_vat,
      'discount_amount', p_discount_amount,
      'payment_method', p_payment_method,
      'promotion_id', p_promotion_id,
      'coupon_wallet_id', p_coupon_wallet_id
    )
  );

  RETURN jsonb_build_object(
    'transaction_id', v_tx_id,
    'transaction_no', p_transaction_no,
    'member_package_id', v_mp_id
  );
END;
$$;

-- ============================================================
-- 2. process_slip_approval — atomic version of approve-slip writes
-- ============================================================
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
SET search_path = public
AS $$
DECLARE
  v_tx_id uuid;
BEGIN
  -- 1. Create finance transaction
  INSERT INTO transactions (
    transaction_id, order_name, amount, amount_gross, amount_ex_vat, amount_vat,
    vat_rate, currency, type, payment_method, status, paid_at,
    member_id, package_id, package_name_snapshot, location_id, staff_id,
    notes, source_type, source_ref, idempotency_key,
    sold_to_name, sold_to_contact
  )
  VALUES (
    p_transaction_no,
    COALESCE(p_package_name_snapshot, 'Transfer Slip Payment'),
    p_amount_gross, p_amount_gross, p_amount_ex_vat, p_amount_vat,
    p_vat_rate, 'THB', p_package_type, p_payment_method, 'paid', NOW(),
    p_member_id, p_package_id, p_package_name_snapshot, p_location_id, p_staff_id,
    p_note, 'transfer_slip', p_slip_id::text, p_idempotency_key,
    p_sold_to_name, p_sold_to_contact
  )
  RETURNING id INTO v_tx_id;

  -- 2. Create member_billing (only when member exists)
  IF p_member_id IS NOT NULL THEN
    INSERT INTO member_billing (member_id, transaction_id, amount, description)
    VALUES (
      p_member_id, v_tx_id, p_amount_gross,
      'Payment: ' || COALESCE(p_package_name_snapshot, p_transaction_no)
    );
  END IF;

  -- 3. Create member_package entitlement (only when package + member exist)
  IF p_package_id IS NOT NULL AND p_member_id IS NOT NULL AND p_package_name_snapshot IS NOT NULL THEN
    INSERT INTO member_packages (
      member_id, package_id, purchase_date, activation_date, expiry_date,
      sessions_remaining, sessions_used, sessions_total, status,
      purchase_transaction_id, package_name_snapshot
    )
    VALUES (
      p_member_id, p_package_id, NOW(), p_activation_date, p_expiry_date,
      p_sessions_total, 0, p_sessions_total, 'active',
      v_tx_id, p_package_name_snapshot
    );
  END IF;

  -- 4. Update slip status
  UPDATE transfer_slips
  SET
    status = 'approved',
    reviewed_at = NOW(),
    reviewer_staff_id = p_staff_id,
    review_note = p_note,
    linked_transaction_id = v_tx_id,
    package_id = COALESCE(p_package_id, package_id)
  WHERE id = p_slip_id;

  -- 5. Activity log
  INSERT INTO activity_log (
    event_type, activity, entity_type, entity_id, staff_id, member_id, new_value
  )
  VALUES (
    'transfer_slip.approved',
    'Transfer slip approved. Transaction ' || p_transaction_no || ' created. Amount: ' || p_amount_gross || ' THB.',
    'transfer_slip',
    p_slip_id::text,
    p_staff_id,
    p_member_id,
    jsonb_build_object(
      'transaction_id', v_tx_id,
      'transaction_no', p_transaction_no,
      'status', 'approved',
      'amount', p_amount_gross,
      'amount_ex_vat', p_amount_ex_vat,
      'amount_vat', p_amount_vat,
      'package_id', p_package_id,
      'package_name', p_package_name_snapshot
    )
  );

  RETURN jsonb_build_object(
    'transaction_id', v_tx_id,
    'transaction_no', p_transaction_no
  );
END;
$$;

-- ============================================================
-- 3. process_stripe_payment — atomic version of stripe-webhook writes
-- ============================================================
CREATE OR REPLACE FUNCTION public.process_stripe_payment(
  p_transaction_id      uuid,
  p_stripe_session_id   text,
  p_package_id          uuid,
  p_member_id           uuid,
  p_amount              numeric,
  p_package_name        text,
  p_sessions_total      integer,
  p_expiry_date         timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Update transaction to paid
  UPDATE transactions
  SET
    status = 'paid',
    paid_at = NOW(),
    source_ref = p_stripe_session_id
  WHERE id = p_transaction_id AND status != 'paid';

  -- 2. Create member_billing (only when member exists)
  IF p_member_id IS NOT NULL THEN
    INSERT INTO member_billing (member_id, transaction_id, amount, description)
    VALUES (
      p_member_id, p_transaction_id, p_amount,
      'Payment: ' || COALESCE(p_package_name, 'Stripe Payment')
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- 3. Create member_packages entitlement (only when package + member exist)
  IF p_package_id IS NOT NULL AND p_member_id IS NOT NULL AND p_expiry_date IS NOT NULL THEN
    INSERT INTO member_packages (
      member_id, package_id, purchase_date, activation_date, expiry_date,
      sessions_remaining, sessions_used, sessions_total, status,
      purchase_transaction_id, package_name_snapshot
    )
    VALUES (
      p_member_id, p_package_id, NOW(), NOW(), p_expiry_date,
      p_sessions_total, 0, p_sessions_total, 'active',
      p_transaction_id, p_package_name
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- 4. Activity log
  INSERT INTO activity_log (
    event_type, activity, entity_type, entity_id, member_id, new_value
  )
  VALUES (
    'stripe.payment_succeeded',
    'Stripe payment succeeded. Amount: ' || p_amount || ' THB. Package: ' || COALESCE(p_package_name, 'N/A') || '.',
    'finance_transaction',
    p_transaction_id::text,
    p_member_id,
    jsonb_build_object(
      'status', 'paid',
      'stripe_session_id', p_stripe_session_id,
      'amount', p_amount
    )
  );

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Grant execute to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.process_package_sale TO service_role;
GRANT EXECUTE ON FUNCTION public.process_slip_approval TO service_role;
GRANT EXECUTE ON FUNCTION public.process_stripe_payment TO service_role;
