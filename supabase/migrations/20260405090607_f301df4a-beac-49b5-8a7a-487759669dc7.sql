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
SET search_path = public
AS $$
DECLARE
  v_member members%ROWTYPE;
  v_slip_id uuid;
BEGIN
  SELECT * INTO v_member FROM members WHERE id = p_member_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'member_not_found', 'message', 'Member not found');
  END IF;

  INSERT INTO transfer_slips (
    member_id,
    member_name_text,
    member_phone_text,
    amount_thb,
    bank_reference,
    payment_method,
    slip_file_url,
    slip_datetime,
    status
  ) VALUES (
    p_member_id,
    v_member.first_name || ' ' || v_member.last_name,
    v_member.phone,
    p_amount,
    'Bank: ' || p_bank_name || ', Date: ' || p_transfer_date,
    'bank_transfer',
    p_slip_url,
    now(),
    'needs_review'
  )
  RETURNING id INTO v_slip_id;

  RETURN json_build_object('success', true, 'slip_id', v_slip_id);
END;
$$;