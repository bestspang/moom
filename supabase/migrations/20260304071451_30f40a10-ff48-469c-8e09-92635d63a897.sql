
-- Training templates (groups)
CREATE TABLE public.training_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean DEFAULT true,
  ai_tags jsonb DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Workout items within a training
CREATE TABLE public.workout_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id uuid NOT NULL REFERENCES public.training_templates(id) ON DELETE CASCADE,
  name text NOT NULL,
  track_metric text,
  unit text,
  goal_type text,
  description text,
  ai_cues jsonb DEFAULT '{}'::jsonb,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.training_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_items ENABLE ROW LEVEL SECURITY;

-- Read policies
CREATE POLICY "All can read training_templates" ON public.training_templates FOR SELECT USING (true);
CREATE POLICY "All can read workout_items" ON public.workout_items FOR SELECT USING (true);

-- Write policies (manager+)
CREATE POLICY "Managers can manage training_templates" ON public.training_templates FOR ALL USING (has_min_access_level(auth.uid(), 'level_3_manager'::access_level));
CREATE POLICY "Managers can manage workout_items" ON public.workout_items FOR ALL USING (has_min_access_level(auth.uid(), 'level_3_manager'::access_level));

-- updated_at trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.training_templates FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.training_templates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workout_items;
