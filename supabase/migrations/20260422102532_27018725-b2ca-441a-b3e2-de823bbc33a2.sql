-- Atomic package sale RPC
-- Wraps transactions + member_packages + member_billing in single transaction
CREATE OR REPLACE FUNCTION public.process_package_sale(
  p_transaction_id        uuid,
  p_transaction_no        text,
  p_order_name            text,
  p_amount                numeric,
  p_amount_gross          numeric,
  p_amount_ex_vat         numeric,
  p_amount_vat            numeric,
  p_vat_rate              numeric,
  p_currency              text,
  p_type                  text,
  p_payment_method        text,
  p_paid_at               timestamptz,
  p_member_id             uuid,
  p_package_id            uuid,
  p_package_name_snapshot text,
  p_location_id           uuid,
  p_staff_id              uuid,
  p_notes                 text,
  p_source_type           text,
  p_source_ref            text,
  p_idempotency_key       text,
  p_discount_amount       numeric,
  p_sold_to_name          text,
  p_sold_to_contact       text,
  p_sessions_total        integer,
  p_activation_date       timestamptz,
  p_expiry_date           timestamptz,
  p_promotion_id          uuid,
  p_promotion_usage_count integer,
  p_promotion_discount    numeric,
  p_coupon_wallet_id      uuid,
  p_coupon_discount       numeric
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
BEGIN
  -- Idempotency check (inside transaction)
  SELECT id, transaction_id INTO v_existing_tx
  FROM transactions
  WHERE idempotency_key = p_idempotency_key
  LIMIT 1;

  IF v_existing_tx.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'idempotent', true,
      'transaction_id', v_existing_tx.id,
      'transaction_no', v_existing_tx.transaction_id
    );
  END IF;

  -- Insert transaction
  INSERT INTO transactions (
    id, transaction_id, member_id, package_id, order_name, type, amount,
    payment_method, status, location_id, staff_id, notes, source_type, source_ref,
    idempotency_key, currency, amount_gross, amount_ex_vat, amount_vat, vat_rate,
    discount_amount, paid_at, package_name_snapshot, sold_to_name, sold_to_contact
  ) VALUES (
    COALESCE(p_transaction_id, gen_random_uuid()),
    p_transaction_no, p_member_id, p_package_id, p_order_name, p_type::transaction_type,
    p_amount, p_payment_method::payment_method, 'completed'::transaction_status,
    p_location_id, p_staff_id, p_notes, p_source_type, p_source_ref,
    p_idempotency_key, COALESCE(p_currency, 'THB'), p_amount_gross, p_amount_ex_vat,
    p_amount_vat, p_vat_rate, p_discount_amount, p_paid_at, p_package_name_snapshot,
    p_sold_to_name, p_sold_to_contact
  )
  RETURNING id INTO v_tx_id;

  -- Create member_packages entitlement
  IF p_package_id IS NOT NULL THEN
    INSERT INTO member_packages (
      member_id, package_id, purchase_date, activation_date, expiry_date,
      sessions_total, sessions_remaining, sessions_used, status,
      purchase_transaction_id, package_name_snapshot
    ) VALUES (
      p_member_id, p_package_id, p_paid_at, p_activation_date, p_expiry_date,
      p_sessions_total, p_sessions_total, 0, 'active',
      v_tx_id, p_package_name_snapshot
    )
    RETURNING id INTO v_member_package_id;
  END IF;

  -- Insert billing line
  INSERT INTO member_billing (
    member_id, transaction_id, amount, description, billing_date
  ) VALUES (
    p_member_id, v_tx_id, p_amount, p_order_name, p_paid_at
  );

  -- Mark coupon used
  IF p_coupon_wallet_id IS NOT NULL THEN
    UPDATE coupon_wallet
    SET status = 'used', used_at = now()
    WHERE id = p_coupon_wallet_id;
  END IF;

  -- Bump promotion usage
  IF p_promotion_id IS NOT NULL AND p_promotion_usage_count IS NOT NULL THEN
    UPDATE promotions
    SET usage_count = p_promotion_usage_count
    WHERE id = p_promotion_id;
  END IF;

  RETURN jsonb_build_object(
    'transaction_id', v_tx_id,
    'transaction_no', p_transaction_no,
    'member_package_id', v_member_package_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_package_sale(
  uuid, text, text, numeric, numeric, numeric, numeric, numeric, text, text, text,
  timestamptz, uuid, uuid, text, uuid, uuid, text, text, text, text, numeric,
  text, text, integer, timestamptz, timestamptz, uuid, integer, numeric, uuid, numeric
) TO authenticated, service_role;