
ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS address_1 text,
  ADD COLUMN IF NOT EXISTS address_2 text,
  ADD COLUMN IF NOT EXISTS subdistrict text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS province text,
  ADD COLUMN IF NOT EXISTS postal_code text;
