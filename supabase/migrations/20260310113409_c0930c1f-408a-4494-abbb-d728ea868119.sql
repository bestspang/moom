
CREATE OR REPLACE FUNCTION public.get_xp_leaderboard(p_since timestamptz, p_limit int DEFAULT 20)
RETURNS TABLE (
  member_id uuid,
  first_name text,
  last_name text,
  avatar_url text,
  sum_xp bigint,
  current_level int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    xl.member_id,
    m.first_name,
    m.last_name,
    m.avatar_url,
    COALESCE(SUM(xl.delta), 0)::bigint AS sum_xp,
    COALESCE(mgp.current_level, 1) AS current_level
  FROM xp_ledger xl
  JOIN members m ON m.id = xl.member_id
  LEFT JOIN member_gamification_profiles mgp ON mgp.member_id = xl.member_id
  WHERE xl.created_at >= p_since
    AND xl.delta > 0
  GROUP BY xl.member_id, m.first_name, m.last_name, m.avatar_url, mgp.current_level
  ORDER BY sum_xp DESC
  LIMIT p_limit;
$$;
