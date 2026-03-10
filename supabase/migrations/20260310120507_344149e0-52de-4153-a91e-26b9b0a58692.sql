
-- Phase 10: Trainer Badge Earnings table
CREATE TABLE public.trainer_badge_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.gamification_badges(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE(staff_id, badge_id)
);

ALTER TABLE public.trainer_badge_earnings ENABLE ROW LEVEL SECURITY;

-- Trainers can read their own badges
CREATE POLICY "Trainers can read own badge earnings"
  ON public.trainer_badge_earnings
  FOR SELECT
  TO authenticated
  USING (staff_id IN (SELECT id FROM public.staff WHERE user_id = auth.uid()));

-- Staff can read all badge earnings
CREATE POLICY "Staff can read all trainer badge earnings"
  ON public.trainer_badge_earnings
  FOR SELECT
  TO public
  USING (has_min_access_level(auth.uid(), 'level_1_minimum'::access_level));

-- Managers can manage badge earnings
CREATE POLICY "Managers can manage trainer badge earnings"
  ON public.trainer_badge_earnings
  FOR ALL
  TO public
  USING (has_min_access_level(auth.uid(), 'level_3_manager'::access_level));
