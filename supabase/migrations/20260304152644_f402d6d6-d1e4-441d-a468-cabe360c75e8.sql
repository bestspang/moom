
-- Add flat emergency/medical/consent/line columns to members (matching leads pattern)
-- Keep legacy emergency_contact_name/emergency_contact_phone for backward compat

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS emergency_first_name text,
  ADD COLUMN IF NOT EXISTS emergency_last_name text,
  ADD COLUMN IF NOT EXISTS emergency_phone text,
  ADD COLUMN IF NOT EXISTS has_medical_conditions boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS medical_notes text,
  ADD COLUMN IF NOT EXISTS allow_physical_contact boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS physical_contact_notes text,
  ADD COLUMN IF NOT EXISTS line_id text;

-- Backfill: split legacy emergency_contact_name into first/last if populated
UPDATE public.members
SET
  emergency_first_name = COALESCE(emergency_first_name, emergency_contact_name),
  emergency_phone = COALESCE(emergency_phone, emergency_contact_phone)
WHERE emergency_contact_name IS NOT NULL
  AND emergency_first_name IS NULL;

-- Backfill: extract medical info from jsonb if populated
UPDATE public.members
SET
  has_medical_conditions = COALESCE(has_medical_conditions, (medical->>'has_conditions')::boolean, false),
  medical_notes = COALESCE(medical_notes, medical->>'notes')
WHERE medical IS NOT NULL
  AND medical_notes IS NULL;

-- Backfill: extract consent info from jsonb if populated
UPDATE public.members
SET
  allow_physical_contact = COALESCE(allow_physical_contact, (consents->>'allow_physical_contact')::boolean, false),
  physical_contact_notes = COALESCE(physical_contact_notes, consents->>'physical_contact_notes')
WHERE consents IS NOT NULL
  AND physical_contact_notes IS NULL;
