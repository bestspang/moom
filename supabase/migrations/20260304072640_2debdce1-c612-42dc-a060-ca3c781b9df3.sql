
-- role_permissions table
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  resource text NOT NULL,
  can_read boolean DEFAULT false,
  can_write boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role_id, resource)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All can read role_permissions" ON public.role_permissions
  FOR SELECT USING (true);

CREATE POLICY "Masters can manage role_permissions" ON public.role_permissions
  FOR ALL USING (has_min_access_level(auth.uid(), 'level_4_master'::access_level));

-- AI-ready field on roles
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS ai_policy jsonb DEFAULT '{}'::jsonb;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.role_permissions;
