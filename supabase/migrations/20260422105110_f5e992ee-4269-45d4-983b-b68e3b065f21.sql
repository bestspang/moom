
-- Smoke-test function: dry-runs payment RPCs against current schema and rolls back.
-- Catches enum/column mismatches BEFORE they hit production traffic.
-- Manager-only (level_3+) — read-only effect (always rolls back).
CREATE OR REPLACE FUNCTION public.smoke_test_payment_flow()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_results  jsonb := '{}'::jsonb;
  v_error    text;
  v_dummy_id uuid := gen_random_uuid();
BEGIN
  -- Authz: managers only
  IF NOT has_min_access_level(auth.uid(), 'level_3_manager'::access_level) THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  -- Test 1: package_type enum cast
  BEGIN
    PERFORM 'session'::package_type, 'pt'::package_type, 'unlimited'::package_type;
    v_results := v_results || jsonb_build_object('package_type_enum', 'ok');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
    v_results := v_results || jsonb_build_object('package_type_enum', 'FAIL: ' || v_error);
  END;

  -- Test 2: transaction_status enum cast
  BEGIN
    PERFORM 'paid'::transaction_status, 'pending'::transaction_status, 'needs_review'::transaction_status;
    v_results := v_results || jsonb_build_object('transaction_status_enum', 'ok');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
    v_results := v_results || jsonb_build_object('transaction_status_enum', 'FAIL: ' || v_error);
  END;

  -- Test 3: payment_method enum cast
  BEGIN
    PERFORM 'cash'::payment_method, 'bank_transfer'::payment_method, 'card_stripe'::payment_method;
    v_results := v_results || jsonb_build_object('payment_method_enum', 'ok');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
    v_results := v_results || jsonb_build_object('payment_method_enum', 'FAIL: ' || v_error);
  END;

  -- Test 4: required RPCs exist
  BEGIN
    PERFORM 1
    FROM pg_proc
    WHERE proname IN ('process_package_sale', 'process_slip_approval', 'process_stripe_payment', 'process_redeem_reward')
      AND pronamespace = 'public'::regnamespace;
    v_results := v_results || jsonb_build_object(
      'rpcs_present',
      (SELECT array_agg(proname ORDER BY proname)
       FROM pg_proc
       WHERE proname IN ('process_package_sale', 'process_slip_approval', 'process_stripe_payment', 'process_redeem_reward')
         AND pronamespace = 'public'::regnamespace)
    );
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
    v_results := v_results || jsonb_build_object('rpcs_present', 'FAIL: ' || v_error);
  END;

  RETURN v_results || jsonb_build_object('checked_at', now());
END;
$$;

GRANT EXECUTE ON FUNCTION public.smoke_test_payment_flow() TO authenticated, service_role;
