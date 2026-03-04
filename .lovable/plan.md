

# Robust Schedule Creation with Server-Side Validation

## Overview

Add a PostgreSQL RPC function `create_schedule_with_validation` that validates room overlap, room-location match, and category compatibility before inserting. Update the frontend to use it with smart UX (auto-capacity, location→room filtering, class duration→end_time).

---

## 1. Database Migration

### A. RPC Function: `create_schedule_with_validation`

```sql
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
```

### B. Performance Index

```sql
CREATE INDEX IF NOT EXISTS idx_schedule_room_date_time 
  ON schedule (room_id, scheduled_date, start_time, end_time) 
  WHERE status != 'cancelled';
```

---

## 2. Frontend Hook: `useCreateScheduleValidated`

In `src/hooks/useSchedule.ts`, add new mutation:

- Calls `supabase.rpc('create_schedule_with_validation', params)`
- Checks returned JSON for `error` field → shows translated friendly error via toast
- On success: invalidates `schedule`, `schedule-stats`, `dashboard-stats` using `queryKeys`
- Error mapping: `room_overlap` → "This room is already booked at this time", etc.

Keep existing `useCreateSchedule` untouched for backward compatibility.

---

## 3. Update `ScheduleClassDialog`

Changes:
1. **Location → Room filtering**: When `location_id` changes, filter rooms list to only show rooms at that location. Clear `room_id` if no longer valid.
2. **Room → Auto-capacity**: When `room_id` selected, set `capacity` to that room's `max_capacity`.
3. **Class → Auto-duration**: When class selected, compute `end_time = start_time + class.duration` (from `classes.duration` field).
4. **Use `useCreateScheduleValidated`** instead of `useCreateSchedule`.
5. **Error display**: Show server validation errors as form-level or toast messages.

---

## 4. i18n Keys

Add error message translations for:
- `schedule.error.roomOverlap`
- `schedule.error.roomLocationMismatch`
- `schedule.error.categoryMismatch`
- `schedule.error.endTimeBeforeStart`
- `schedule.error.roomNotFound`

---

## 5. Files Summary

| Action | File |
|--------|------|
| Migration | SQL: RPC function + index |
| Modify | `src/hooks/useSchedule.ts` — add `useCreateScheduleValidated` |
| Modify | `src/components/schedule/ScheduleClassDialog.tsx` — smart form UX |
| Modify | `src/i18n/locales/en.ts` — error keys |
| Modify | `src/i18n/locales/th.ts` — error keys |

No existing behavior changed. Old `useCreateSchedule` remains. Realtime sync already handles cross-page updates via `useRealtimeSync`.

