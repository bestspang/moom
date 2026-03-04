ALTER TABLE public.members ADD COLUMN IF NOT EXISTS address_1 text;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS address_2 text;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS subdistrict text;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS district text;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS province text;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS postal_code text;