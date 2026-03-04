
-- RPC function: create_schedule_with_validation
CREATE OR REPLACE FUNCTION public.create_schedule_with_validation(
  p_scheduled_date date,
  p_start_time time,
  p_end_time time,
  p_class_id uuid,
  p_trainer_id uuid DEFAULT NULL,
  p_location_id uuid DEFAULT NULL,
  p_room_id uuid DEFAULT NULL,
  p_capacity integer DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room rooms%ROWTYPE;
  v_class classes%ROWTYPE;
  v_category_name text;
  v_final_capacity integer;
  v_result schedule%ROWTYPE;
BEGIN
  -- Validate time range
  IF p_end_time <= p_start_time THEN
    RETURN json_build_object('error', 'end_time_before_start', 'message', 'End time must be after start time');
  END IF;

  -- If room provided, validate it
  IF p_room_id IS NOT NULL THEN
    SELECT * INTO v_room FROM rooms WHERE id = p_room_id;
    IF NOT FOUND THEN
      RETURN json_build_object('error', 'room_not_found', 'message', 'Room not found');
    END IF;

    -- Check room belongs to location
    IF p_location_id IS NOT NULL AND v_room.location_id IS NOT NULL 
       AND v_room.location_id != p_location_id THEN
      RETURN json_build_object('error', 'room_location_mismatch', 'message', 'Room does not belong to selected location');
    END IF;

    -- Check category compatibility
    SELECT * INTO v_class FROM classes WHERE id = p_class_id;
    IF v_class.category_id IS NOT NULL AND v_room.categories IS NOT NULL 
       AND array_length(v_room.categories, 1) > 0 THEN
      SELECT name INTO v_category_name FROM class_categories WHERE id = v_class.category_id;
      IF v_category_name IS NOT NULL AND NOT (v_category_name = ANY(v_room.categories)) THEN
        RETURN json_build_object('error', 'category_mismatch', 'message', 
          format('Room does not support category: %s', v_category_name));
      END IF;
    END IF;

    -- Check overlapping schedule
    IF EXISTS (
      SELECT 1 FROM schedule
      WHERE room_id = p_room_id
        AND scheduled_date = p_scheduled_date
        AND status != 'cancelled'
        AND start_time < p_end_time
        AND end_time > p_start_time
    ) THEN
      RETURN json_build_object('error', 'room_overlap', 'message', 
        'This room already has a class scheduled at this time');
    END IF;
  END IF;

  -- Determine capacity
  v_final_capacity := COALESCE(p_capacity, v_room.max_capacity, 20);

  -- Insert
  INSERT INTO schedule (class_id, trainer_id, room_id, location_id, scheduled_date, start_time, end_time, capacity, status)
  VALUES (p_class_id, p_trainer_id, p_room_id, COALESCE(p_location_id, v_room.location_id), p_scheduled_date, p_start_time, p_end_time, v_final_capacity, 'scheduled')
  RETURNING * INTO v_result;

  RETURN row_to_json(v_result);
END;
$$;

-- Performance index for overlap checks
CREATE INDEX IF NOT EXISTS idx_schedule_room_date_time 
  ON schedule (room_id, scheduled_date, start_time, end_time) 
  WHERE status != 'cancelled';
