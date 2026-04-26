-- Fix overly-permissive RLS policy on member_gamification_profiles
-- The previous policy used USING (true) which allowed any authenticated user to read any member's profile.
-- Replace with a scoped policy: members can only see their own profile, staff can see all.

DROP POLICY IF EXISTS "Members can read gamification profiles" ON member_gamification_profiles;
DROP POLICY IF EXISTS "Staff can read all gamification profiles" ON member_gamification_profiles;

CREATE POLICY "member_gamification_profiles_member_select" ON member_gamification_profiles
  FOR SELECT TO authenticated USING (
    member_id = public.get_my_member_id(auth.uid())
    OR (
      public.has_min_access_level(auth.uid(), 'level_1_minimum'::public.access_level)
      AND EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role <> 'member'::public.app_role
      )
    )
  );
