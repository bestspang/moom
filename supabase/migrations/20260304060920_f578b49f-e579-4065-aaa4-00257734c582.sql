
ALTER TABLE public.leads ADD COLUMN nickname text;
ALTER TABLE public.leads ADD COLUMN gender text;
ALTER TABLE public.leads ADD COLUMN date_of_birth date;
ALTER TABLE public.leads ADD COLUMN register_location_id uuid REFERENCES public.locations(id);
ALTER TABLE public.leads ADD COLUMN line_user_id text;
ALTER TABLE public.leads ADD COLUMN line_display_name text;
ALTER TABLE public.leads ADD COLUMN line_picture_url text;
ALTER TABLE public.leads ADD COLUMN line_link_status text DEFAULT 'unlinked';
ALTER TABLE public.leads ADD COLUMN ai_tags jsonb DEFAULT '[]';
ALTER TABLE public.leads ADD COLUMN ai_summary text;
ALTER TABLE public.leads ADD COLUMN next_action text;
ALTER TABLE public.leads ADD COLUMN followup_at timestamptz;
ALTER TABLE public.leads ADD COLUMN address text;
ALTER TABLE public.leads ADD COLUMN package_interest_id uuid REFERENCES public.packages(id);
