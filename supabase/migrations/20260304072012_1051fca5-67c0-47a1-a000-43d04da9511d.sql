
-- Create staff_positions table for multi-role assignment
CREATE TABLE public.staff_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  scope_all_locations boolean DEFAULT true,
  location_ids uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.staff_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read positions" ON public.staff_positions
  FOR SELECT USING (has_min_access_level(auth.uid(), 'level_1_minimum'::access_level));

CREATE POLICY "Managers can manage positions" ON public.staff_positions
  FOR ALL USING (has_min_access_level(auth.uid(), 'level_3_manager'::access_level));

-- Add address column to staff table
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS address text;

-- Enable realtime for staff_positions
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_positions;
