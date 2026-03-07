
CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('revenue', 'new_members', 'retention', 'checkins')),
  target_value numeric NOT NULL DEFAULT 0,
  period_start date NOT NULL,
  period_end date NOT NULL,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read goals" ON public.goals
  FOR SELECT TO authenticated
  USING (has_min_access_level(auth.uid(), 'level_1_minimum'::access_level));

CREATE POLICY "Managers can manage goals" ON public.goals
  FOR ALL TO authenticated
  USING (has_min_access_level(auth.uid(), 'level_3_manager'::access_level));
