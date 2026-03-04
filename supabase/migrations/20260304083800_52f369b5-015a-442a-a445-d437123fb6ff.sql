
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS address_1 text,
  ADD COLUMN IF NOT EXISTS address_2 text,
  ADD COLUMN IF NOT EXISTS subdistrict text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS province text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS emergency_first_name text,
  ADD COLUMN IF NOT EXISTS emergency_last_name text,
  ADD COLUMN IF NOT EXISTS emergency_phone text,
  ADD COLUMN IF NOT EXISTS emergency_relationship text,
  ADD COLUMN IF NOT EXISTS has_medical_conditions boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS medical_notes text,
  ADD COLUMN IF NOT EXISTS allow_physical_contact boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS physical_contact_notes text,
  ADD COLUMN IF NOT EXISTS temperature text,
  ADD COLUMN IF NOT EXISTS internal_notes text;
