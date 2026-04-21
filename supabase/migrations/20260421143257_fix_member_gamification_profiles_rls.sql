-- Fix overly-permissive RLS policy on member_gamification_profiles
-- The previous policy used USING (true) which allowed any authenticated user to read any member's profile.
-- Replace with a scoped policy: members can only see their own profile, staff can see all.

DROP POLICY IF EXISTS "Members can read gamification profiles" ON member_gamification_profiles;

CREATE POLICY "member_gamification_profiles_member_select" ON member_gamification_profiles
  FOR SELECT USING (
    member_id = get_my_member_id()
    OR EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND access_level IN ('level_1_minimum','level_2_operator','level_3_manager','level_4_master')
    )
  );
