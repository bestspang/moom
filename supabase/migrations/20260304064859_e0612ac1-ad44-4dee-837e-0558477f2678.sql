ALTER TABLE packages ADD COLUMN IF NOT EXISTS access_locations uuid[] DEFAULT '{}'::uuid[];
ALTER TABLE packages ADD COLUMN IF NOT EXISTS all_locations boolean DEFAULT true;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS schedule_start_at timestamptz;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS schedule_end_at timestamptz;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS ai_tags jsonb DEFAULT '[]'::jsonb;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS ai_price_suggestion jsonb;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS ai_copy_suggestions jsonb;