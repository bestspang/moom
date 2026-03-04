ALTER TABLE public.activity_log
  ADD COLUMN IF NOT EXISTS location_id uuid;

CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_event_type ON public.activity_log (event_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_staff_id ON public.activity_log (staff_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_location_id ON public.activity_log (location_id);