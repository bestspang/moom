-- Add unique constraint on section and key for upsert functionality
ALTER TABLE public.settings 
ADD CONSTRAINT settings_section_key_unique UNIQUE (section, key);