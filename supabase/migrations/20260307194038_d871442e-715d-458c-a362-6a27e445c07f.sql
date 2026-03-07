
-- Expenses table for P&L
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL DEFAULT 'general',
  amount numeric NOT NULL DEFAULT 0,
  description text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read expenses" ON public.expenses
  FOR SELECT TO authenticated
  USING (has_min_access_level(auth.uid(), 'level_1_minimum'::access_level));

CREATE POLICY "Managers can manage expenses" ON public.expenses
  FOR ALL TO authenticated
  USING (has_min_access_level(auth.uid(), 'level_3_manager'::access_level));

-- Add note_type to member_notes for communication tracking
ALTER TABLE public.member_notes
  ADD COLUMN IF NOT EXISTS note_type text DEFAULT 'note';
