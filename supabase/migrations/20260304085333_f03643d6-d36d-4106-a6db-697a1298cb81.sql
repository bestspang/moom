
-- Verify columns exist (no-op if already added)
ALTER TABLE public.member_attendance
  ADD COLUMN IF NOT EXISTS checkin_method text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.staff(id) ON DELETE SET NULL;
