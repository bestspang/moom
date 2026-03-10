
-- Class ratings table
CREATE TABLE public.class_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL REFERENCES public.schedule(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(schedule_id, member_id)
);

-- RLS
ALTER TABLE public.class_ratings ENABLE ROW LEVEL SECURITY;

-- Members can insert their own rating
CREATE POLICY "Members can insert own rating"
  ON public.class_ratings FOR INSERT
  TO authenticated
  WITH CHECK (member_id = get_my_member_id(auth.uid()));

-- Members can read own ratings
CREATE POLICY "Members can read own ratings"
  ON public.class_ratings FOR SELECT
  TO authenticated
  USING (member_id = get_my_member_id(auth.uid()));

-- Staff can read all ratings
CREATE POLICY "Staff can read all ratings"
  ON public.class_ratings FOR SELECT
  TO authenticated
  USING (has_min_access_level(auth.uid(), 'level_1_minimum'::access_level));

-- Members can update own rating (within reason)
CREATE POLICY "Members can update own rating"
  ON public.class_ratings FOR UPDATE
  TO authenticated
  USING (member_id = get_my_member_id(auth.uid()))
  WITH CHECK (member_id = get_my_member_id(auth.uid()));

-- Index for trainer avg rating queries
CREATE INDEX idx_class_ratings_schedule ON public.class_ratings(schedule_id);
CREATE INDEX idx_class_ratings_member ON public.class_ratings(member_id);

-- RPC: Get avg rating for a trainer's classes
CREATE OR REPLACE FUNCTION public.get_trainer_avg_rating(p_staff_id uuid, p_days int DEFAULT 90)
RETURNS TABLE(avg_rating numeric, total_ratings bigint)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ROUND(AVG(cr.rating)::numeric, 1) AS avg_rating,
    COUNT(cr.id) AS total_ratings
  FROM class_ratings cr
  JOIN schedule s ON s.id = cr.schedule_id
  WHERE s.trainer_id = p_staff_id
    AND s.scheduled_date >= CURRENT_DATE - (p_days || ' days')::interval;
$$;
