
-- Allow members to read gamification profiles for leaderboard
CREATE POLICY "Members can read gamification profiles"
ON public.member_gamification_profiles
FOR SELECT
TO authenticated
USING (true);
