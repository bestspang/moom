
-- Enums
CREATE TYPE public.ai_suggestion_status AS ENUM ('pending', 'approved', 'rejected', 'applied');
CREATE TYPE public.ai_policy_scope AS ENUM ('global', 'location', 'role', 'user');
CREATE TYPE public.ai_run_status AS ENUM ('pending', 'running', 'completed', 'failed');

-- ai_prompt_templates
CREATE TABLE public.ai_prompt_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  purpose text,
  content text NOT NULL,
  input_schema jsonb DEFAULT '{}'::jsonb,
  output_schema jsonb DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_prompt_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can read prompt templates" ON public.ai_prompt_templates FOR SELECT TO authenticated USING (has_min_access_level(auth.uid(), 'level_1_minimum'::access_level));
CREATE POLICY "Managers can manage prompt templates" ON public.ai_prompt_templates FOR ALL TO authenticated USING (has_min_access_level(auth.uid(), 'level_3_manager'::access_level));
CREATE TRIGGER handle_ai_prompt_templates_updated_at BEFORE UPDATE ON public.ai_prompt_templates FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ai_runs
CREATE TABLE public.ai_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  scope_location_id uuid REFERENCES public.locations(id),
  prompt_template_id uuid REFERENCES public.ai_prompt_templates(id),
  input jsonb DEFAULT '{}'::jsonb,
  output jsonb DEFAULT '{}'::jsonb,
  model text,
  latency_ms integer,
  cost_usd numeric(10,6),
  status ai_run_status NOT NULL DEFAULT 'pending',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can read own AI runs" ON public.ai_runs FOR SELECT TO authenticated USING (actor_user_id = auth.uid());
CREATE POLICY "Managers can read all AI runs" ON public.ai_runs FOR SELECT TO authenticated USING (has_min_access_level(auth.uid(), 'level_3_manager'::access_level));
CREATE POLICY "Operators can insert AI runs" ON public.ai_runs FOR INSERT TO authenticated WITH CHECK (has_min_access_level(auth.uid(), 'level_2_operator'::access_level));
CREATE INDEX idx_ai_runs_actor_created ON public.ai_runs (actor_user_id, created_at DESC);

-- ai_suggestions
CREATE TABLE public.ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid,
  suggestion_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence numeric(4,3),
  status ai_suggestion_status NOT NULL DEFAULT 'pending',
  created_by_ai_run_id uuid REFERENCES public.ai_runs(id),
  approved_by uuid,
  approved_at timestamptz,
  applied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can read AI suggestions" ON public.ai_suggestions FOR SELECT TO authenticated USING (has_min_access_level(auth.uid(), 'level_1_minimum'::access_level));
CREATE POLICY "Operators can manage AI suggestions" ON public.ai_suggestions FOR ALL TO authenticated USING (has_min_access_level(auth.uid(), 'level_2_operator'::access_level));
CREATE INDEX idx_ai_suggestions_pending ON public.ai_suggestions (status) WHERE status = 'pending';
CREATE INDEX idx_ai_suggestions_entity ON public.ai_suggestions (entity_type, entity_id);
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_suggestions;

-- ai_policies
CREATE TABLE public.ai_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  scope ai_policy_scope NOT NULL DEFAULT 'global',
  scope_id uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can read AI policies" ON public.ai_policies FOR SELECT TO authenticated USING (has_min_access_level(auth.uid(), 'level_1_minimum'::access_level));
CREATE POLICY "Managers can manage AI policies" ON public.ai_policies FOR ALL TO authenticated USING (has_min_access_level(auth.uid(), 'level_3_manager'::access_level));
CREATE INDEX idx_ai_policies_key_scope ON public.ai_policies (key, scope);
CREATE TRIGGER handle_ai_policies_updated_at BEFORE UPDATE ON public.ai_policies FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
