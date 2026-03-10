
CREATE OR REPLACE FUNCTION public.get_squad_activity_feed(p_squad_id uuid, p_limit int DEFAULT 20)
RETURNS TABLE (
  member_id uuid,
  first_name text,
  avatar_url text,
  event_type text,
  action_key text,
  xp_delta int,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    gal.member_id,
    m.first_name,
    m.avatar_url,
    gal.event_type,
    gal.action_key,
    COALESCE(gal.xp_delta, 0) AS xp_delta,
    gal.created_at
  FROM gamification_audit_log gal
  JOIN squad_memberships sm ON sm.member_id = gal.member_id AND sm.squad_id = p_squad_id
  JOIN members m ON m.id = gal.member_id
  WHERE gal.member_id IS NOT NULL
  ORDER BY gal.created_at DESC
  LIMIT p_limit;
$$;
