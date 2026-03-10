
CREATE OR REPLACE FUNCTION public.get_trainer_roster(p_staff_id uuid, p_days int DEFAULT 90)
RETURNS TABLE(
  member_id uuid,
  first_name text,
  last_name text,
  avatar_url text,
  total_sessions bigint,
  last_attended timestamptz,
  phone text,
  email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.id AS member_id,
    m.first_name,
    m.last_name,
    m.avatar_url,
    COUNT(cb.id) AS total_sessions,
    MAX(cb.attended_at) AS last_attended,
    m.phone,
    m.email
  FROM schedule s
  JOIN class_bookings cb ON cb.schedule_id = s.id
  JOIN members m ON m.id = cb.member_id
  WHERE s.trainer_id = p_staff_id
    AND s.scheduled_date >= CURRENT_DATE - p_days
    AND cb.status IN ('attended', 'booked')
  GROUP BY m.id, m.first_name, m.last_name, m.avatar_url, m.phone, m.email
  ORDER BY MAX(cb.attended_at) DESC NULLS LAST;
$$;
