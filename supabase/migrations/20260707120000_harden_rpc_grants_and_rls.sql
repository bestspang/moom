-- Security hardening: stop member-role accounts from bypassing the edge-function
-- authorization layer or reading staff-only data.
--
-- Root cause: has_min_access_level() maps the `member` role (and role-less users)
-- to level_1_minimum, so every logged-in member satisfied the "front desk and
-- above" floor used by many RLS policies, and the money-path SECURITY DEFINER
-- RPCs were EXECUTE-able by the `authenticated` role. A member could therefore
-- call those RPCs directly (bypassing the edge-function checks) or read staff-only
-- rows. This migration:
--   1. adds is_staff() — true only for real staff roles, never members;
--   2. revokes direct EXECUTE on the edge-function-only money RPCs;
--   3. binds the member-facing RPCs to the caller's own member id;
--   4. re-scopes the slip-images / member_notes read policies to is_staff().
--
-- NOTE: the members / member_packages / member_attendance PII reads AND the staff
-- directory read are intentionally NOT tightened here. The member app reads other
-- members' names/avatars (social/leaderboard) and scheduled trainers' names from the
-- staff table (trainer:staff!schedule_trainer_id_fkey embeds in the schedule/booking/
-- class-detail queries). RLS is row-level, so blocking those tables would null out
-- trainer names and leaderboards in the member UI. Those need a column-scoped view
-- (e.g. a trainer_directory / member_directory view the member app reads instead of
-- the base table). Tracked as a follow-up.

-- ---------------------------------------------------------------------------
-- 1) Staff-only predicate. Unlike has_min_access_level(uid,'level_1_minimum'),
--    this is false for member-role and role-less accounts.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role IN ('front_desk', 'trainer', 'freelance_trainer', 'admin', 'owner')
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;

-- Ownership predicate for the current caller. Mirrors the member app's own
-- identity resolution (src/apps/member/hooks/useMemberSession.ts): a verified
-- identity_map link OR any line_users row for this user. Deliberately matches the
-- app (not the stricter get_my_member_id) so no legitimately logged-in member is
-- locked out, while still scoping strictly to the caller's own linked member.
CREATE OR REPLACE FUNCTION public.auth_owns_member(_member_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.identity_map
    WHERE experience_user_id = auth.uid()
      AND entity_type = 'member'
      AND is_verified = true
      AND admin_entity_id = _member_id
  ) OR EXISTS (
    SELECT 1 FROM public.line_users
    WHERE user_id = auth.uid()
      AND member_id = _member_id
  );
$$;

REVOKE EXECUTE ON FUNCTION public.auth_owns_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.auth_owns_member(uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2) Edge-function-only money RPCs: remove the `authenticated` grant so they can
--    only be invoked by edge functions running as service_role (sell-package,
--    approve-slip, gamification-redeem-reward), which enforce authorization in
--    code (see supabase/functions/_shared/authz.ts). Overload-safe via pg_proc.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  fn text;
  r  record;
BEGIN
  FOREACH fn IN ARRAY ARRAY['process_package_sale', 'process_slip_approval', 'process_redeem_reward']
  LOOP
    FOR r IN
      SELECT p.oid::regprocedure AS sig
      FROM pg_proc p
      WHERE p.proname = fn
        AND p.pronamespace = 'public'::regnamespace
    LOOP
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
    END LOOP;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 3) Member-facing RPCs: still callable by the member app (authenticated) but the
--    target member must be the caller's own linked member id. Staff may act on any
--    member. anon is blocked entirely. The ownership guard is prepended; the rest
--    of each body is unchanged from its current definition.
-- ---------------------------------------------------------------------------

-- 3a) create_booking_safe
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
  -- Ownership guard: a member may only book for themselves; staff may book anyone.
  IF NOT (public.auth_owns_member(p_member_id) OR public.is_staff(auth.uid())) THEN
    RETURN json_build_object('error', 'forbidden', 'message', 'Not authorized to book for this member');
  END IF;

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

-- 3b) member_self_checkin
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
  -- Ownership guard: a member may only check themselves in; staff may check anyone in.
  IF NOT (public.auth_owns_member(p_member_id) OR public.is_staff(auth.uid())) THEN
    RETURN json_build_object('error', 'forbidden', 'message', 'Not authorized to check in this member');
  END IF;

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

-- 3c) member_upload_slip
CREATE OR REPLACE FUNCTION public.member_upload_slip(
  p_member_id uuid,
  p_amount numeric,
  p_bank_name text,
  p_transfer_date text,
  p_slip_url text DEFAULT NULL,
  p_package_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member members%ROWTYPE;
  v_slip_id uuid;
  v_slip_datetime timestamptz;
BEGIN
  -- Ownership guard: a member may only upload a slip for themselves; staff may upload for anyone.
  IF NOT (public.auth_owns_member(p_member_id) OR public.is_staff(auth.uid())) THEN
    RETURN json_build_object('error', 'forbidden', 'message', 'Not authorized to upload a slip for this member');
  END IF;

  SELECT * INTO v_member FROM members WHERE id = p_member_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'member_not_found', 'message', 'Member not found');
  END IF;

  IF p_package_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM packages WHERE id = p_package_id) THEN
    RETURN json_build_object('error', 'package_not_found', 'message', 'Package not found');
  END IF;

  BEGIN
    v_slip_datetime := NULLIF(p_transfer_date, '')::date::timestamptz;
  EXCEPTION WHEN others THEN
    v_slip_datetime := now();
  END;

  INSERT INTO transfer_slips (
    member_id,
    member_name_text,
    member_phone_text,
    amount_thb,
    package_id,
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
    p_package_id,
    'Bank: ' || p_bank_name || ', Date: ' || p_transfer_date,
    'bank_transfer',
    p_slip_url,
    v_slip_datetime,
    'needs_review'
  )
  RETURNING id INTO v_slip_id;

  RETURN json_build_object('success', true, 'slip_id', v_slip_id, 'package_id', p_package_id);
END;
$$;

-- Restrict the member RPCs: authenticated (members) + service_role only, never anon.
REVOKE EXECUTE ON FUNCTION public.create_booking_safe(uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.create_booking_safe(uuid, uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.member_self_checkin(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.member_self_checkin(uuid, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.member_upload_slip(uuid, numeric, text, text, text, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.member_upload_slip(uuid, numeric, text, text, text, uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4) Re-scope staff-only read policies from has_min_access_level(level_1) — which
--    members satisfy — to is_staff(). Member-facing surfaces do not read these
--    tables, so this only removes the unintended member access.
-- ---------------------------------------------------------------------------

-- 4a) slip-images storage read: staff (front desk and above) OR the slip's owner-member.
--     The bucket is private, so this RLS policy is the real boundary.
DROP POLICY IF EXISTS "Slip images readable by staff or owner" ON storage.objects;
CREATE POLICY "Slip images readable by staff or owner"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'slip-images'
    AND (
      public.is_staff(auth.uid())
      OR EXISTS (
        SELECT 1
        FROM public.transfer_slips ts
        WHERE ts.slip_file_url LIKE '%' || storage.objects.name
          AND ts.member_id = public.get_my_member_id(auth.uid())
      )
    )
  );

-- 4b) staff directory: intentionally left at has_min_access_level(level_1). The member
--     app reads scheduled trainers' names from the staff table via
--     trainer:staff!schedule_trainer_id_fkey embeds, so tightening to is_staff() would
--     remove trainer names from the member schedule/booking UI. Deferred to a
--     column-scoped trainer_directory view (see NOTE at the top of this file).

-- 4c) member_notes (staff-only feature: private notes about members)
DROP POLICY IF EXISTS "Staff with role can read member notes" ON public.member_notes;
CREATE POLICY "Staff with role can read member notes" ON public.member_notes
  FOR SELECT
  USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff with role can manage member notes" ON public.member_notes;
CREATE POLICY "Staff with role can manage member notes" ON public.member_notes
  FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));
