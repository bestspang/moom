
-- Referral program table
CREATE TABLE public.member_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  referred_member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  referral_code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  reward_granted boolean DEFAULT false,
  referrer_reward_points integer DEFAULT 200,
  referred_reward_points integer DEFAULT 200,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- RLS
ALTER TABLE public.member_referrals ENABLE ROW LEVEL SECURITY;

-- Members can read their own referrals (as referrer)
CREATE POLICY "Members can read own referrals"
  ON public.member_referrals FOR SELECT
  TO authenticated
  USING (referrer_member_id = public.get_my_member_id(auth.uid()));

-- Members can insert referrals (create their code)
CREATE POLICY "Members can create own referral code"
  ON public.member_referrals FOR INSERT
  TO authenticated
  WITH CHECK (referrer_member_id = public.get_my_member_id(auth.uid()));

-- Staff can manage all referrals
CREATE POLICY "Staff can manage referrals"
  ON public.member_referrals FOR ALL
  TO authenticated
  USING (public.has_min_access_level(auth.uid(), 'level_2_operator'::access_level))
  WITH CHECK (public.has_min_access_level(auth.uid(), 'level_2_operator'::access_level));

-- Index for lookup by code
CREATE INDEX idx_member_referrals_code ON public.member_referrals(referral_code);
CREATE INDEX idx_member_referrals_referrer ON public.member_referrals(referrer_member_id);
