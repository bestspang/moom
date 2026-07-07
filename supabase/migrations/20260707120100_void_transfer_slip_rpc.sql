-- Atomic void for an approved transfer slip.
--
-- Previously the client (useVoidSlip) only flipped the linked transaction to
-- 'voided' and the slip to 'voided', leaving the member_packages entitlement
-- 'active' and the member_billing line intact — so a member kept sessions they
-- were never actually paid for. This RPC reverses the whole approval atomically:
--   - void the linked transaction,
--   - cancel the member_packages entitlement created from that transaction,
--   - remove the member_billing line for the reversed charge,
--   - mark the slip 'voided'.
-- Manager-gated (level_3_manager), matching the approve-slip edge function.
--
-- Not reversed here: the package_purchase gamification award. Reversing XP/coin
-- ledgers is a separate concern; tracked as a follow-up.

CREATE OR REPLACE FUNCTION public.void_transfer_slip(
  p_slip_id uuid,
  p_review_note text DEFAULT NULL,
  p_reviewer_staff_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_slip transfer_slips%ROWTYPE;
  v_txn_id uuid;
  v_txn_no text;
  v_cancelled_packages integer := 0;
BEGIN
  -- Manager-gated, matching approve-slip.
  IF NOT public.has_min_access_level(auth.uid(), 'level_3_manager'::access_level) THEN
    RAISE EXCEPTION 'Not authorized to void transfer slips' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_slip FROM transfer_slips WHERE id = p_slip_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'slip_not_found', 'message', 'Transfer slip not found');
  END IF;

  IF v_slip.status <> 'approved' THEN
    RETURN json_build_object('error', 'invalid_status', 'message', 'Only approved slips can be voided');
  END IF;

  v_txn_id := v_slip.linked_transaction_id;

  IF v_txn_id IS NOT NULL THEN
    -- Void the transaction (excludes it from paid-revenue P&L) and capture its number.
    UPDATE transactions
      SET status = 'voided'::transaction_status
      WHERE id = v_txn_id
      RETURNING transaction_id INTO v_txn_no;

    -- Cancel the entitlement minted from this transaction so the member no longer
    -- holds unpaid sessions/membership.
    UPDATE member_packages
      SET status = 'cancelled', updated_at = now()
      WHERE purchase_transaction_id = v_txn_id
        AND status = 'active';
    GET DIAGNOSTICS v_cancelled_packages = ROW_COUNT;

    -- Remove the billing line for the reversed charge (unique per transaction).
    DELETE FROM member_billing WHERE transaction_id = v_txn_id;
  END IF;

  UPDATE transfer_slips
    SET status = 'voided'::transfer_slip_status,
        reviewed_at = now(),
        review_note = p_review_note,
        reviewer_staff_id = COALESCE(p_reviewer_staff_id, reviewer_staff_id)
    WHERE id = p_slip_id;

  RETURN json_build_object(
    'success', true,
    'slip_id', p_slip_id,
    'transaction_id', v_txn_id,
    'transaction_no', v_txn_no,
    'cancelled_packages', v_cancelled_packages
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.void_transfer_slip(uuid, text, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.void_transfer_slip(uuid, text, uuid) TO authenticated, service_role;
