-- Stop member-role accounts from reading every member's packages.
--
-- member_packages' only SELECT policy was has_min_access_level(level_1), which every
-- member satisfies, so a member could read all other members' package/session data.
-- The member app only ever reads its OWN packages (services.ts fetchMyPackages, filtered
-- by member_id) and never embeds other members' packages, so we can scope member reads
-- to the caller's own member while keeping full staff access.
--
-- is_staff() and auth_owns_member() are defined in 20260707120000.

DROP POLICY IF EXISTS "Staff with role can read member packages" ON public.member_packages;
CREATE POLICY "Staff with role can read member packages" ON public.member_packages
  FOR SELECT
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Members can read own packages" ON public.member_packages
  FOR SELECT
  USING (public.auth_owns_member(member_id));
