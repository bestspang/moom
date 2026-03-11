
-- B2: Create safe booking function with atomic duplicate + capacity check
CREATE OR REPLACE FUNCTION public.create_booking_safe(
  p_schedule_id uuid,
  p_member_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_schedule schedule%ROWTYPE;
  v_existing_count integer;
  v_booked_count integer;
BEGIN
  -- Get the schedule
  SELECT * INTO v_schedule FROM schedule WHERE id = p_schedule_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'schedule_not_found', 'message', 'Schedule not found');
  END IF;

  -- Check schedule is not cancelled
  IF v_schedule.status = 'cancelled' THEN
    RETURN json_build_object('error', 'schedule_cancelled', 'message', 'This class has been cancelled');
  END IF;

  -- Check for duplicate booking (same member + same schedule, not cancelled)
  SELECT COUNT(*) INTO v_existing_count
  FROM class_bookings
  WHERE schedule_id = p_schedule_id
    AND member_id = p_member_id
    AND status != 'cancelled';

  IF v_existing_count > 0 THEN
    RETURN json_build_object('error', 'already_booked', 'message', 'You have already booked this class');
  END IF;

  -- Check capacity
  SELECT COUNT(*) INTO v_booked_count
  FROM class_bookings
  WHERE schedule_id = p_schedule_id
    AND status IN ('booked', 'attended');

  IF v_booked_count >= COALESCE(v_schedule.capacity, 20) THEN
    RETURN json_build_object('error', 'class_full', 'message', 'This class is full');
  END IF;

  -- Insert booking
  INSERT INTO class_bookings (schedule_id, member_id, status, booked_at)
  VALUES (p_schedule_id, p_member_id, 'booked', now());

  RETURN json_build_object('success', true);
END;
$$;

-- B1: Create safe check-in function with duplicate check + package verification
CREATE OR REPLACE FUNCTION public.member_self_checkin(
  p_member_id uuid,
  p_checkin_method text DEFAULT 'self_service'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_member members%ROWTYPE;
  v_today date := CURRENT_DATE;
  v_existing_count integer;
  v_has_active_package boolean;
  v_attendance_id uuid;
BEGIN
  -- Verify member exists and is active
  SELECT * INTO v_member FROM members WHERE id = p_member_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'member_not_found', 'message', 'Member not found');
  END IF;
  IF v_member.status != 'active' THEN
    RETURN json_build_object('error', 'member_inactive', 'message', 'Your membership is not active');
  END IF;

  -- Check for duplicate check-in today
  SELECT COUNT(*) INTO v_existing_count
  FROM member_attendance
  WHERE member_id = p_member_id
    AND check_in_time::date = v_today;

  IF v_existing_count > 0 THEN
    RETURN json_build_object('error', 'already_checked_in', 'message', 'You have already checked in today');
  END IF;

  -- Check for active package (optional — allows walk-in but flags it)
  SELECT EXISTS (
    SELECT 1 FROM member_packages
    WHERE member_id = p_member_id
      AND status = 'active'
      AND (expiry_date IS NULL OR expiry_date >= v_today)
      AND (sessions_remaining IS NULL OR sessions_remaining > 0)
  ) INTO v_has_active_package;

  -- Insert attendance
  INSERT INTO member_attendance (member_id, checkin_method, check_in_type, check_in_time)
  VALUES (p_member_id, p_checkin_method, CASE WHEN v_has_active_package THEN 'package' ELSE 'walk_in' END, now())
  RETURNING id INTO v_attendance_id;

  RETURN json_build_object(
    'success', true,
    'attendance_id', v_attendance_id,
    'has_active_package', v_has_active_package,
    'check_in_type', CASE WHEN v_has_active_package THEN 'package' ELSE 'walk_in' END
  );
END;
$$;
