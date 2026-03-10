
CREATE OR REPLACE FUNCTION public.get_streak_around_me(p_member_id uuid, p_range int DEFAULT 2)
RETURNS TABLE(
  member_id uuid,
  first_name text,
  last_name text,
  avatar_url text,
  current_streak int,
  current_level int,
  total_xp bigint,
  rank bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked AS (
    SELECT
      mgp.member_id,
      m.first_name,
      m.last_name,
      m.avatar_url,
      mgp.current_streak,
      mgp.current_level,
      mgp.total_xp,
      ROW_NUMBER() OVER (ORDER BY mgp.current_streak DESC, mgp.total_xp DESC) AS rank
    FROM member_gamification_profiles mgp
    JOIN members m ON m.id = mgp.member_id
    WHERE mgp.current_streak > 0
  ),
  my_rank AS (
    SELECT rank FROM ranked WHERE ranked.member_id = p_member_id
  )
  SELECT
    r.member_id,
    r.first_name,
    r.last_name,
    r.avatar_url,
    r.current_streak,
    r.current_level,
    r.total_xp,
    r.rank
  FROM ranked r, my_rank mr
  WHERE r.rank BETWEEN mr.rank - p_range AND mr.rank + p_range
  ORDER BY r.rank;
$$;
