
-- Drop old function with different return type, then recreate with audit_log_id
DROP FUNCTION IF EXISTS public.get_squad_activity_feed(uuid, int);

CREATE OR REPLACE FUNCTION public.get_squad_activity_feed(p_squad_id uuid, p_limit int DEFAULT 20)
RETURNS TABLE (
  audit_log_id uuid,
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
    al.id AS audit_log_id,
    al.member_id,
    m.first_name,
    NULL::text AS avatar_url,
    al.event_type,
    al.action_key,
    COALESCE(al.xp_delta, 0) AS xp_delta,
    al.created_at
  FROM gamification_audit_log al
  JOIN squad_memberships sm ON sm.member_id = al.member_id AND sm.squad_id = p_squad_id
  JOIN members m ON m.id = al.member_id
  WHERE al.member_id IS NOT NULL
  ORDER BY al.created_at DESC
  LIMIT p_limit;
$$;
