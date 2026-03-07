
CREATE OR REPLACE FUNCTION public.delete_member_cascade(p_member_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Nullify FKs in tables with NO ACTION constraints
  UPDATE activity_log SET member_id = NULL WHERE member_id = p_member_id;
  UPDATE promotion_redemptions SET member_id = NULL WHERE member_id = p_member_id;
  UPDATE leads SET converted_member_id = NULL WHERE converted_member_id = p_member_id;
  UPDATE transfer_slips SET member_id = NULL WHERE member_id = p_member_id;
  UPDATE line_users SET member_id = NULL WHERE member_id = p_member_id;
  UPDATE line_message_log SET member_id = NULL WHERE member_id = p_member_id;

  -- Delete the member; CASCADE handles member_packages, member_notes, etc.
  DELETE FROM members WHERE id = p_member_id;
END;
$$;
