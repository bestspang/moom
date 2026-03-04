
CREATE INDEX IF NOT EXISTS idx_workout_items_training_id ON public.workout_items (training_id);
CREATE INDEX IF NOT EXISTS idx_workout_items_sort_order ON public.workout_items (training_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_training_templates_created_at ON public.training_templates (created_at);
