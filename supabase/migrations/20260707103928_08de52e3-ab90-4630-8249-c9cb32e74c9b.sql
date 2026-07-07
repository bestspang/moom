-- LINE push outbox: table, RLS, RPCs, and enqueue hooks in booking safe RPCs

-- 1. Table
CREATE TABLE public.line_push_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES public.members(id) ON DELETE CASCADE,
  line_user_id text NOT NULL DEFAULT '',
  template text NOT NULL CHECK (template IN (
    'booking_confirmed','booking_cancelled','class_reminder',
    'package_expiring','slip_approved','slip_rejected'
  )),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','skipped')),
  attempts int NOT NULL DEFAULT 0,
  last_error text,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  dedupe_key text,
  related_booking_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.line_push_outbox TO authenticated;
GRANT ALL ON public.line_push_outbox TO service_role;

ALTER TABLE public.line_push_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "line_push_outbox_read_manager"
  ON public.line_push_outbox
  FOR SELECT
  TO authenticated
  USING (public.has_min_access_level(auth.uid(), 'level_3_manager'::access_level));

-- Indexes
CREATE INDEX idx_line_push_outbox_ready
  ON public.line_push_outbox (scheduled_at)
  WHERE status = 'pending';

CREATE UNIQUE INDEX idx_line_push_outbox_dedupe
  ON public.line_push_outbox (dedupe_key)
  WHERE dedupe_key IS NOT NULL;

CREATE INDEX idx_line_push_outbox_member ON public.line_push_outbox (member_id);
CREATE INDEX idx_line_push_outbox_related_booking
  ON public.line_push_outbox (related_booking_id)
  WHERE related_booking_id IS NOT NULL;

-- 2. enqueue_line_push
CREATE OR REPLACE FUNCTION public.enqueue_line_push(
  _member_id uuid,
  _template text,
  _payload jsonb DEFAULT '{}'::jsonb,
  _scheduled_at timestamptz DEFAULT now(),
  _dedupe_key text DEFAULT NULL,
  _related_booking_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_line_user_id text;
  v_id uuid;
  v_status text;
BEGIN
  -- Dedupe short-circuit
  IF _dedupe_key IS NOT NULL THEN
    SELECT id INTO v_id FROM line_push_outbox WHERE dedupe_key = _dedupe_key LIMIT 1;
    IF v_id IS NOT NULL THEN RETURN v_id; END IF;
  END IF;

  SELECT line_user_id INTO v_line_user_id
  FROM line_users
  WHERE member_id = _member_id AND status = 'linked'
  ORDER BY linked_at DESC NULLS LAST
  LIMIT 1;

  IF v_line_user_id IS NULL OR v_line_user_id = '' THEN
    v_status := 'skipped';
    v_line_user_id := '';
  ELSE
    v_status := 'pending';
  END IF;

  INSERT INTO line_push_outbox (
    member_id, line_user_id, template, payload, status,
    scheduled_at, dedupe_key, related_booking_id, last_error
  ) VALUES (
    _member_id, v_line_user_id, _template, COALESCE(_payload, '{}'::jsonb),
    v_status, _scheduled_at, _dedupe_key, _related_booking_id,
    CASE WHEN v_status = 'skipped' THEN 'no_linked_line_account' ELSE NULL END
  )
  ON CONFLICT (dedupe_key) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NULL AND _dedupe_key IS NOT NULL THEN
    SELECT id INTO v_id FROM line_push_outbox WHERE dedupe_key = _dedupe_key LIMIT 1;
  END IF;

  RETURN v_id;
END;
$$;

-- 3. claim_line_push_batch (service_role only)
CREATE OR REPLACE FUNCTION public.claim_line_push_batch(_limit int DEFAULT 100)
RETURNS SETOF public.line_push_outbox
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH picked AS (
    SELECT id FROM line_push_outbox
    WHERE status = 'pending' AND scheduled_at <= now()
    ORDER BY scheduled_at
    FOR UPDATE SKIP LOCKED
    LIMIT _limit
  ),
  bumped AS (
    UPDATE line_push_outbox o
    SET attempts = o.attempts + 1
    FROM picked
    WHERE o.id = picked.id
    RETURNING o.*
  )
  SELECT * FROM bumped;
END;
$$;

-- 4. mark_line_push_result
CREATE OR REPLACE FUNCTION public.mark_line_push_result(
  _id uuid, _ok boolean, _err text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _ok THEN
    UPDATE line_push_outbox
    SET status = 'sent', sent_at = now(), last_error = NULL
    WHERE id = _id;
  ELSE
    UPDATE line_push_outbox
    SET last_error = _err,
        status = CASE WHEN attempts >= 3 THEN 'failed' ELSE 'pending' END
    WHERE id = _id;
  END IF;
END;
$$;

-- 5. skip_pending_reminders_for_booking
CREATE OR REPLACE FUNCTION public.skip_pending_reminders_for_booking(_booking_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count int;
BEGIN
  UPDATE line_push_outbox
  SET status = 'skipped', last_error = 'booking_cancelled'
  WHERE status = 'pending'
    AND template = 'class_reminder'
    AND related_booking_id = _booking_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_line_push_batch(int) FROM public;
REVOKE ALL ON FUNCTION public.mark_line_push_result(uuid, boolean, text) FROM public;
REVOKE ALL ON FUNCTION public.skip_pending_reminders_for_booking(uuid) FROM public;
REVOKE ALL ON FUNCTION public.enqueue_line_push(uuid, text, jsonb, timestamptz, text, uuid) FROM public;

GRANT EXECUTE ON FUNCTION public.claim_line_push_batch(int) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_line_push_result(uuid, boolean, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.skip_pending_reminders_for_booking(uuid) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_line_push(uuid, text, jsonb, timestamptz, text, uuid) TO service_role, authenticated;

-- 6. Extend create_booking_safe: enqueue confirm + reminder
CREATE OR REPLACE FUNCTION public.create_booking_safe(p_schedule_id uuid, p_member_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_schedule schedule%ROWTYPE;
  v_existing_count integer;
  v_booked_count integer;
  v_booking_id uuid;
  v_class_name text;
  v_location_name text;
  v_trainer_name text;
  v_start_ts timestamptz;
  v_reminder_at timestamptz;
BEGIN
  SELECT * INTO v_schedule FROM schedule WHERE id = p_schedule_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'schedule_not_found', 'message', 'Schedule not found');
  END IF;

  IF v_schedule.status = 'cancelled' THEN
    RETURN json_build_object('error', 'schedule_cancelled', 'message', 'This class has been cancelled');
  END IF;

  SELECT COUNT(*) INTO v_existing_count
  FROM class_bookings
  WHERE schedule_id = p_schedule_id
    AND member_id = p_member_id
    AND status != 'cancelled';

  IF v_existing_count > 0 THEN
    RETURN json_build_object('error', 'already_booked', 'message', 'You have already booked this class');
  END IF;

  SELECT COUNT(*) INTO v_booked_count
  FROM class_bookings
  WHERE schedule_id = p_schedule_id
    AND status IN ('booked', 'attended');

  IF v_booked_count >= COALESCE(v_schedule.capacity, 20) THEN
    RETURN json_build_object('error', 'class_full', 'message', 'This class is full');
  END IF;

  INSERT INTO class_bookings (schedule_id, member_id, status, booked_at)
  VALUES (p_schedule_id, p_member_id, 'booked', now())
  RETURNING id INTO v_booking_id;

  -- Enqueue LINE push notifications (best effort, in-tx)
  BEGIN
    SELECT c.name_en, l.name, (s.first_name || ' ' || COALESCE(s.last_name, ''))
      INTO v_class_name, v_location_name, v_trainer_name
    FROM schedule sch
    LEFT JOIN classes c ON c.id = sch.class_id
    LEFT JOIN locations l ON l.id = sch.location_id
    LEFT JOIN staff s ON s.id = sch.trainer_id
    WHERE sch.id = p_schedule_id;

    v_start_ts := (v_schedule.scheduled_date + v_schedule.start_time) AT TIME ZONE 'Asia/Bangkok';

    PERFORM public.enqueue_line_push(
      p_member_id,
      'booking_confirmed',
      jsonb_build_object(
        'booking_id', v_booking_id,
        'class_name', v_class_name,
        'trainer_name', v_trainer_name,
        'location_name', v_location_name,
        'scheduled_date', v_schedule.scheduled_date,
        'start_time', v_schedule.start_time,
        'start_ts', v_start_ts
      ),
      now(),
      'confirm:' || v_booking_id::text,
      v_booking_id
    );

    v_reminder_at := v_start_ts - interval '2 hours';
    IF v_reminder_at > now() THEN
      PERFORM public.enqueue_line_push(
        p_member_id,
        'class_reminder',
        jsonb_build_object(
          'booking_id', v_booking_id,
          'class_name', v_class_name,
          'trainer_name', v_trainer_name,
          'location_name', v_location_name,
          'scheduled_date', v_schedule.scheduled_date,
          'start_time', v_schedule.start_time,
          'start_ts', v_start_ts
        ),
        v_reminder_at,
        'reminder:' || v_booking_id::text,
        v_booking_id
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Do not fail booking on notification enqueue error
    RAISE WARNING 'enqueue_line_push failed for booking %: %', v_booking_id, SQLERRM;
  END;

  RETURN json_build_object('success', true, 'booking_id', v_booking_id);
END;
$function$;

-- 7. Extend cancel_booking_safe: enqueue cancel + skip reminders
CREATE OR REPLACE FUNCTION public.cancel_booking_safe(p_booking_id uuid, p_member_id uuid, p_reason text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_booking class_bookings%ROWTYPE;
  v_schedule schedule%ROWTYPE;
  v_class_name text;
BEGIN
  SELECT * INTO v_booking FROM class_bookings
  WHERE id = p_booking_id AND member_id = p_member_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'not_found', 'message', 'Booking not found or not authorized');
  END IF;

  IF v_booking.status NOT IN ('booked', 'waitlisted') THEN
    RETURN json_build_object('error', 'not_cancellable', 'message', 'Booking cannot be cancelled');
  END IF;

  UPDATE class_bookings
  SET status = 'cancelled', cancelled_at = now(), cancellation_reason = p_reason
  WHERE id = p_booking_id;

  BEGIN
    SELECT * INTO v_schedule FROM schedule WHERE id = v_booking.schedule_id;
    SELECT name_en INTO v_class_name FROM classes WHERE id = v_schedule.class_id;

    PERFORM public.enqueue_line_push(
      p_member_id,
      'booking_cancelled',
      jsonb_build_object(
        'booking_id', p_booking_id,
        'class_name', v_class_name,
        'scheduled_date', v_schedule.scheduled_date,
        'start_time', v_schedule.start_time,
        'reason', p_reason
      ),
      now(),
      'cancel:' || p_booking_id::text,
      p_booking_id
    );

    PERFORM public.skip_pending_reminders_for_booking(p_booking_id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'cancel enqueue failed for booking %: %', p_booking_id, SQLERRM;
  END;

  RETURN json_build_object('success', true);
END;
$function$;