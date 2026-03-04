ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS channels jsonb DEFAULT '{"in_app": true, "line": false}'::jsonb,
  ADD COLUMN IF NOT EXISTS target_mode text DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS target_location_ids uuid[] DEFAULT '{}'::uuid[];

ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;