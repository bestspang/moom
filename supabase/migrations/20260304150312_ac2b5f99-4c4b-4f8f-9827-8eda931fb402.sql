
-- Add bilingual message columns
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS message_en text;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS message_th text;

-- Add LINE broadcast status for future integration
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS line_broadcast_status jsonb NULL;

-- Add indexes for query performance
CREATE INDEX IF NOT EXISTS idx_announcements_status ON public.announcements (status);
CREATE INDEX IF NOT EXISTS idx_announcements_publish_date ON public.announcements (publish_date);
CREATE INDEX IF NOT EXISTS idx_announcements_end_date ON public.announcements (end_date);

-- Backfill: copy existing message to message_en
UPDATE public.announcements SET message_en = message WHERE message_en IS NULL AND message IS NOT NULL;
