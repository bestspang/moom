
-- Identity mapping table for cross-project resolution
-- Links Admin DB entities to Experience DB entities
CREATE TABLE public.identity_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL, -- 'member', 'staff', 'location'
  admin_entity_id uuid NOT NULL,
  experience_user_id uuid, -- auth.users.id in Experience DB
  experience_entity_id uuid, -- entity ID in Experience DB (e.g. branch id)
  shared_identifier text, -- LINE user ID, email, or member_code
  shared_identifier_type text, -- 'line_user_id', 'email', 'member_code'
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, admin_entity_id),
  UNIQUE (entity_type, experience_user_id)
);

-- Index for lookups from Experience side
CREATE INDEX idx_identity_map_experience_user ON public.identity_map (experience_user_id) WHERE experience_user_id IS NOT NULL;
CREATE INDEX idx_identity_map_shared_id ON public.identity_map (shared_identifier_type, shared_identifier) WHERE shared_identifier IS NOT NULL;

-- RLS
ALTER TABLE public.identity_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can manage identity_map"
  ON public.identity_map FOR ALL
  TO authenticated
  USING (has_min_access_level(auth.uid(), 'level_3_manager'::access_level))
  WITH CHECK (has_min_access_level(auth.uid(), 'level_3_manager'::access_level));

CREATE POLICY "Staff can read identity_map"
  ON public.identity_map FOR SELECT
  TO authenticated
  USING (has_min_access_level(auth.uid(), 'level_1_minimum'::access_level));

-- updated_at trigger
CREATE TRIGGER handle_identity_map_updated_at
  BEFORE UPDATE ON public.identity_map
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
