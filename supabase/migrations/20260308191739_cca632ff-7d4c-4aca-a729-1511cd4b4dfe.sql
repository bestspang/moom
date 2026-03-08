-- Add missing RLS policies (skip existing ones using IF NOT EXISTS pattern via DO block)

DO $$ BEGIN
  -- squads
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'squads' AND policyname = 'Authenticated can read active squads') THEN
    EXECUTE $pol$CREATE POLICY "Authenticated can read active squads" ON public.squads FOR SELECT TO authenticated USING (true)$pol$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'squads' AND policyname = 'Managers can manage squads') THEN
    EXECUTE $pol$CREATE POLICY "Managers can manage squads" ON public.squads FOR ALL TO authenticated USING (has_min_access_level(auth.uid(), 'level_3_manager'::access_level)) WITH CHECK (has_min_access_level(auth.uid(), 'level_3_manager'::access_level))$pol$;
  END IF;

  -- squad_memberships
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'squad_memberships' AND policyname = 'Authenticated can read squad memberships') THEN
    EXECUTE $pol$CREATE POLICY "Authenticated can read squad memberships" ON public.squad_memberships FOR SELECT TO authenticated USING (true)$pol$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'squad_memberships' AND policyname = 'Members can join squads') THEN
    EXECUTE $pol$CREATE POLICY "Members can join squads" ON public.squad_memberships FOR INSERT TO authenticated WITH CHECK (member_id IN (SELECT m.id FROM members m JOIN line_users lu ON lu.member_id = m.id WHERE lu.user_id = auth.uid()) OR has_min_access_level(auth.uid(), 'level_1_minimum'::access_level))$pol$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'squad_memberships' AND policyname = 'Members can leave squads') THEN
    EXECUTE $pol$CREATE POLICY "Members can leave squads" ON public.squad_memberships FOR DELETE TO authenticated USING (member_id IN (SELECT m.id FROM members m JOIN line_users lu ON lu.member_id = m.id WHERE lu.user_id = auth.uid()) OR has_min_access_level(auth.uid(), 'level_2_operator'::access_level))$pol$;
  END IF;

  -- member_gamification_profiles
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'member_gamification_profiles' AND policyname = 'Members can read own gamification profile') THEN
    EXECUTE $pol$CREATE POLICY "Members can read own gamification profile" ON public.member_gamification_profiles FOR SELECT TO authenticated USING (member_id IN (SELECT m.id FROM members m JOIN line_users lu ON lu.member_id = m.id WHERE lu.user_id = auth.uid()) OR has_min_access_level(auth.uid(), 'level_1_minimum'::access_level))$pol$;
  END IF;

  -- badge_earnings
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'badge_earnings' AND policyname = 'Members can read own badge earnings') THEN
    EXECUTE $pol$CREATE POLICY "Members can read own badge earnings" ON public.badge_earnings FOR SELECT TO authenticated USING (member_id IN (SELECT m.id FROM members m JOIN line_users lu ON lu.member_id = m.id WHERE lu.user_id = auth.uid()) OR has_min_access_level(auth.uid(), 'level_1_minimum'::access_level))$pol$;
  END IF;

  -- challenge_progress
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'challenge_progress' AND policyname = 'Members can read own challenge progress') THEN
    EXECUTE $pol$CREATE POLICY "Members can read own challenge progress" ON public.challenge_progress FOR SELECT TO authenticated USING (member_id IN (SELECT m.id FROM members m JOIN line_users lu ON lu.member_id = m.id WHERE lu.user_id = auth.uid()) OR has_min_access_level(auth.uid(), 'level_1_minimum'::access_level))$pol$;
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_memberships ENABLE ROW LEVEL SECURITY;