
ALTER TABLE members ADD COLUMN IF NOT EXISTS emergency_relationship text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS medical jsonb DEFAULT '{}'::jsonb;
ALTER TABLE members ADD COLUMN IF NOT EXISTS consents jsonb DEFAULT '{}'::jsonb;
ALTER TABLE members ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS package_interest_id uuid REFERENCES packages(id);
ALTER TABLE members ADD COLUMN IF NOT EXISTS line_user_id text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS line_display_name text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS line_picture_url text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS line_link_status text DEFAULT 'unlinked';
ALTER TABLE members ADD COLUMN IF NOT EXISTS ai_profile_summary text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS ai_tags jsonb DEFAULT '[]'::jsonb;
ALTER TABLE members ADD COLUMN IF NOT EXISTS ai_risk_signals jsonb DEFAULT '[]'::jsonb;
