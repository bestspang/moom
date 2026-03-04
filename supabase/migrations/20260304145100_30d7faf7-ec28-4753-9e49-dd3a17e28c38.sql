ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS emergency_first_name text,
  ADD COLUMN IF NOT EXISTS emergency_last_name text,
  ADD COLUMN IF NOT EXISTS emergency_phone text,
  ADD COLUMN IF NOT EXISTS emergency_relationship text,
  ADD COLUMN IF NOT EXISTS staff_code text UNIQUE;