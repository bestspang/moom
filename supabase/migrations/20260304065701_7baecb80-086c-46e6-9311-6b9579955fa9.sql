ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS ai_target_segment jsonb;
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS ai_recommended_rules jsonb;