-- Close the members / staff / member_attendance PII leak while keeping the member
-- app's social/leaderboard/schedule features working.
--
-- Problem: these tables' SELECT policies were has_min_access_level(level_1), which
-- every member satisfies, so any member could read all other members' email/phone,
-- the full staff directory, and everyone's check-ins. RLS is row-level (can't hide
-- just email/phone) and members+staff share the 'authenticated' role (column GRANTs
-- can't separate them). So: lock the base tables to own-row + is_staff(), and expose
-- ONLY safe columns of all rows through SECURITY DEFINER views / RPCs that the member
-- app reads for cross-member data.
--
-- is_staff() and auth_owns_member() are defined in 20260707120000.

-- ── Directory views (run as owner → bypass base-table RLS → all rows, safe cols only) ──
CREATE OR REPLACE VIEW public.member_directory
  WITH (security_invoker = false) AS
  SELECT id, first_name, last_name, nickname, avatar_url
  FROM public.members;

REVOKE ALL ON public.member_directory FROM PUBLIC, anon;
GRANT SELECT ON public.member_directory TO authenticated, service_role;

CREATE OR REPLACE VIEW public.trainer_directory
  WITH (security_invoker = false) AS
  SELECT id, first_name, last_name
  FROM public.staff;

REVOKE ALL ON public.trainer_directory FROM PUBLIC, anon;
GRANT SELECT ON public.trainer_directory TO authenticated, service_role;

-- ── Attendance RPCs (no directory view can cover cross-member attendance; base table
--    is now own+staff only). All SECURITY DEFINER, self-scoped, Bangkok-day bucketed. ──

-- Squadmates of the CALLER who checked in today. The squad is derived server-side from
-- the caller's own member id, so a member can only probe their own squad.
CREATE OR REPLACE FUNCTION public.get_squad_checkins_today()
RETURNS TABLE(member_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH me AS (SELECT public.get_my_member_id(auth.uid()) AS mid),
  my_squad AS (
    SELECT sm.squad_id
    FROM squad_memberships sm, me
    WHERE sm.member_id = me.mid
    LIMIT 1
  )
  SELECT DISTINCT ma.member_id
  FROM member_attendance ma
  JOIN squad_memberships sm ON sm.member_id = ma.member_id
  JOIN my_squad ms ON ms.squad_id = sm.squad_id
  WHERE ma.check_in_time >= (date_trunc('day', now() AT TIME ZONE 'Asia/Bangkok') AT TIME ZONE 'Asia/Bangkok');
$$;

REVOKE EXECUTE ON FUNCTION public.get_squad_checkins_today() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_squad_checkins_today() TO authenticated, service_role;

-- Gym-wide check-in count today (social-proof fallback; returns only an int).
CREATE OR REPLACE FUNCTION public.get_gym_checkin_count_today()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::int
  FROM member_attendance
  WHERE check_in_time >= (date_trunc('day', now() AT TIME ZONE 'Asia/Bangkok') AT TIME ZONE 'Asia/Bangkok');
$$;

REVOKE EXECUTE ON FUNCTION public.get_gym_checkin_count_today() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_gym_checkin_count_today() TO authenticated, service_role;

-- Attendance leaderboard (replaces a client-side aggregation that scanned ALL
-- member_attendance). Mirrors the existing get_xp_leaderboard shape.
CREATE OR REPLACE FUNCTION public.get_attendance_leaderboard(p_since timestamptz, p_limit int DEFAULT 20)
RETURNS TABLE(
  member_id uuid,
  first_name text,
  last_name text,
  avatar_url text,
  check_in_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT ma.member_id, m.first_name, m.last_name, m.avatar_url,
         COUNT(*)::bigint AS check_in_count
  FROM member_attendance ma
  JOIN members m ON m.id = ma.member_id
  WHERE p_since IS NULL OR ma.check_in_time >= p_since
  GROUP BY ma.member_id, m.first_name, m.last_name, m.avatar_url
  ORDER BY check_in_count DESC
  LIMIT p_limit;
$$;

REVOKE EXECUTE ON FUNCTION public.get_attendance_leaderboard(timestamptz, int) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_attendance_leaderboard(timestamptz, int) TO authenticated, service_role;

-- ── Lock the base tables. Only SELECT (all three) + member_attendance INSERT change;
--    the level_2/level_3 staff manage policies are left as-is (members never satisfy them). ──

-- members: own-row (member) OR real staff
DROP POLICY IF EXISTS "Staff with role can read members" ON public.members;
CREATE POLICY "Members read own, staff read all" ON public.members
  FOR SELECT
  USING (public.is_staff(auth.uid()) OR public.auth_owns_member(id));

-- staff: real staff only (plus a staffer reading their own record)
DROP POLICY IF EXISTS "Staff with role can read staff" ON public.staff;
CREATE POLICY "Staff read staff directory" ON public.staff
  FOR SELECT
  USING (public.is_staff(auth.uid()) OR user_id = auth.uid());

-- member_attendance SELECT: own-row (member) OR real staff
DROP POLICY IF EXISTS "Staff with role can read attendance" ON public.member_attendance;
CREATE POLICY "Members read own attendance, staff read all" ON public.member_attendance
  FOR SELECT
  USING (public.is_staff(auth.uid()) OR public.auth_owns_member(member_id));

-- member_attendance INSERT: preserve member self check-in (useCheckinQR inserts the
-- member's OWN attendance row directly) while blocking inserts for OTHER members.
DROP POLICY IF EXISTS "Staff with role can record attendance" ON public.member_attendance;
CREATE POLICY "Members insert own attendance, staff insert any" ON public.member_attendance
  FOR INSERT
  WITH CHECK (public.is_staff(auth.uid()) OR public.auth_owns_member(member_id));
