-- Step 1: Create get_my_member_id helper function
CREATE OR REPLACE FUNCTION public.get_my_member_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT admin_entity_id FROM identity_map 
     WHERE experience_user_id = _user_id AND entity_type = 'member' AND is_verified = true
     LIMIT 1),
    (SELECT member_id FROM line_users 
     WHERE user_id = _user_id
     LIMIT 1)
  )
$$;

-- Step 2: Fix member_gamification_profiles
DROP POLICY IF EXISTS "Members can read own gamification profile" ON member_gamification_profiles;
CREATE POLICY "Members can read own gamification profile"
  ON member_gamification_profiles FOR SELECT TO authenticated
  USING (member_id = public.get_my_member_id(auth.uid()));

-- Step 3: Fix xp_ledger
DROP POLICY IF EXISTS "Members can read own xp ledger" ON xp_ledger;
CREATE POLICY "Members can read own xp ledger"
  ON xp_ledger FOR SELECT TO authenticated
  USING (member_id = public.get_my_member_id(auth.uid()));

-- Step 4: Fix points_ledger
DROP POLICY IF EXISTS "Members can read own points ledger" ON points_ledger;
CREATE POLICY "Members can read own points ledger"
  ON points_ledger FOR SELECT TO authenticated
  USING (member_id = public.get_my_member_id(auth.uid()));

-- Step 5: Fix streak_snapshots
DROP POLICY IF EXISTS "Members can read own streaks" ON streak_snapshots;
CREATE POLICY "Members can read own streaks"
  ON streak_snapshots FOR SELECT TO authenticated
  USING (member_id = public.get_my_member_id(auth.uid()));

-- Step 6: Fix badge_earnings
DROP POLICY IF EXISTS "Members can read own badge earnings" ON badge_earnings;
CREATE POLICY "Members can read own badge earnings"
  ON badge_earnings FOR SELECT TO authenticated
  USING (member_id = public.get_my_member_id(auth.uid()));

-- Step 7: Fix challenge_progress
DROP POLICY IF EXISTS "Members can read own challenge progress" ON challenge_progress;
CREATE POLICY "Members can read own challenge progress"
  ON challenge_progress FOR SELECT TO authenticated
  USING (member_id = public.get_my_member_id(auth.uid()));

-- Step 8: Fix reward_redemptions
DROP POLICY IF EXISTS "Members can read own redemptions" ON reward_redemptions;
CREATE POLICY "Members can read own redemptions"
  ON reward_redemptions FOR SELECT TO authenticated
  USING (member_id = public.get_my_member_id(auth.uid()));

-- Step 9: Fix squad_memberships (join/leave)
DROP POLICY IF EXISTS "Members can join squads" ON squad_memberships;
CREATE POLICY "Members can join squads"
  ON squad_memberships FOR INSERT TO authenticated
  WITH CHECK (member_id = public.get_my_member_id(auth.uid()) OR has_min_access_level(auth.uid(), 'level_1_minimum'::access_level));

DROP POLICY IF EXISTS "Members can leave squads" ON squad_memberships;
CREATE POLICY "Members can leave squads"
  ON squad_memberships FOR DELETE TO authenticated
  USING (member_id = public.get_my_member_id(auth.uid()) OR has_min_access_level(auth.uid(), 'level_2_operator'::access_level));
