
-- 1. Create economy_guardrails table
CREATE TABLE public.economy_guardrails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_code text UNIQUE NOT NULL,
  rule_value text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.economy_guardrails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read economy guardrails"
  ON public.economy_guardrails FOR SELECT
  TO authenticated
  USING (public.has_min_access_level(auth.uid(), 'level_1_minimum'));

CREATE POLICY "Managers can manage economy guardrails"
  ON public.economy_guardrails FOR ALL
  TO authenticated
  USING (public.has_min_access_level(auth.uid(), 'level_3_manager'))
  WITH CHECK (public.has_min_access_level(auth.uid(), 'level_3_manager'));

-- 2. Create trainer_action_rewards table
CREATE TABLE public.trainer_action_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_code text NOT NULL,
  trainer_type text NOT NULL DEFAULT 'inhouse',
  score_delta integer DEFAULT 0,
  coin_delta integer DEFAULT 0,
  xp_delta integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (action_code, trainer_type)
);

ALTER TABLE public.trainer_action_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read trainer action rewards"
  ON public.trainer_action_rewards FOR SELECT
  TO authenticated
  USING (public.has_min_access_level(auth.uid(), 'level_1_minimum'));

CREATE POLICY "Managers can manage trainer action rewards"
  ON public.trainer_action_rewards FOR ALL
  TO authenticated
  USING (public.has_min_access_level(auth.uid(), 'level_3_manager'))
  WITH CHECK (public.has_min_access_level(auth.uid(), 'level_3_manager'));
