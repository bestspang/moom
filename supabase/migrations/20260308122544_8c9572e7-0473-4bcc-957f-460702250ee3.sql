
-- =============================================
-- GAMIFICATION PLATFORM: Phase 1 Migration
-- New enums + 9 new tables + RLS + triggers
-- =============================================

-- 1) ENUMS
CREATE TYPE public.gamification_event_type AS ENUM (
  'check_in', 'class_attended', 'class_booked',
  'package_purchased', 'package_renewed',
  'streak_maintained', 'challenge_completed',
  'reward_redeemed', 'referral_converted',
  'profile_completed', 'first_visit',
  'merch_purchased', 'review_submitted',
  'manual_adjustment', 'rollback'
);

CREATE TYPE public.challenge_progress_status AS ENUM (
  'in_progress', 'completed', 'failed', 'expired'
);

CREATE TYPE public.reward_redemption_status AS ENUM (
  'pending', 'fulfilled', 'cancelled', 'rolled_back'
);

CREATE TYPE public.squad_role AS ENUM ('leader', 'member');

-- 2) MEMBER GAMIFICATION PROFILES
CREATE TABLE public.member_gamification_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  total_xp bigint NOT NULL DEFAULT 0,
  total_points bigint NOT NULL DEFAULT 0,
  available_points bigint NOT NULL DEFAULT 0,
  current_level integer NOT NULL DEFAULT 1,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_activity_at timestamptz,
  season_id uuid REFERENCES public.gamification_seasons(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(member_id)
);

ALTER TABLE public.member_gamification_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read all gamification profiles"
  ON public.member_gamification_profiles FOR SELECT
  USING (has_min_access_level(auth.uid(), 'level_1_minimum'::access_level));

CREATE POLICY "Members can read own gamification profile"
  ON public.member_gamification_profiles FOR SELECT
  USING (member_id IN (SELECT m.id FROM public.members m JOIN public.line_users lu ON lu.member_id = m.id WHERE lu.user_id = auth.uid()));

-- No direct client writes — Edge Functions use service_role

-- 3) XP LEDGER (append-only)
CREATE TABLE public.xp_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  event_type public.gamification_event_type NOT NULL,
  delta integer NOT NULL,
  balance_after bigint NOT NULL,
  rule_id uuid REFERENCES public.gamification_rules(id) ON DELETE SET NULL,
  idempotency_key text NOT NULL,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(idempotency_key)
);

ALTER TABLE public.xp_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read xp ledger"
  ON public.xp_ledger FOR SELECT
  USING (has_min_access_level(auth.uid(), 'level_1_minimum'::access_level));

CREATE POLICY "Members can read own xp ledger"
  ON public.xp_ledger FOR SELECT
  USING (member_id IN (SELECT m.id FROM public.members m JOIN public.line_users lu ON lu.member_id = m.id WHERE lu.user_id = auth.uid()));

-- 4) POINTS LEDGER (append-only)
CREATE TABLE public.points_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  event_type public.gamification_event_type NOT NULL,
  delta integer NOT NULL,
  balance_after bigint NOT NULL,
  rule_id uuid REFERENCES public.gamification_rules(id) ON DELETE SET NULL,
  redemption_id uuid,
  idempotency_key text NOT NULL,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(idempotency_key)
);

ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read points ledger"
  ON public.points_ledger FOR SELECT
  USING (has_min_access_level(auth.uid(), 'level_1_minimum'::access_level));

CREATE POLICY "Members can read own points ledger"
  ON public.points_ledger FOR SELECT
  USING (member_id IN (SELECT m.id FROM public.members m JOIN public.line_users lu ON lu.member_id = m.id WHERE lu.user_id = auth.uid()));

-- 5) STREAK SNAPSHOTS
CREATE TABLE public.streak_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_activity_date date NOT NULL,
  streak_type text NOT NULL DEFAULT 'daily',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(member_id, streak_type)
);

ALTER TABLE public.streak_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read streak snapshots"
  ON public.streak_snapshots FOR SELECT
  USING (has_min_access_level(auth.uid(), 'level_1_minimum'::access_level));

CREATE POLICY "Members can read own streaks"
  ON public.streak_snapshots FOR SELECT
  USING (member_id IN (SELECT m.id FROM public.members m JOIN public.line_users lu ON lu.member_id = m.id WHERE lu.user_id = auth.uid()));

-- 6) BADGE EARNINGS
CREATE TABLE public.badge_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.gamification_badges(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  event_ref text,
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE(member_id, badge_id)
);

ALTER TABLE public.badge_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read badge earnings"
  ON public.badge_earnings FOR SELECT
  USING (has_min_access_level(auth.uid(), 'level_1_minimum'::access_level));

CREATE POLICY "Members can read own badge earnings"
  ON public.badge_earnings FOR SELECT
  USING (member_id IN (SELECT m.id FROM public.members m JOIN public.line_users lu ON lu.member_id = m.id WHERE lu.user_id = auth.uid()));

-- 7) CHALLENGE PROGRESS
CREATE TABLE public.challenge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.gamification_challenges(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  current_value integer NOT NULL DEFAULT 0,
  status public.challenge_progress_status NOT NULL DEFAULT 'in_progress',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, member_id)
);

ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read challenge progress"
  ON public.challenge_progress FOR SELECT
  USING (has_min_access_level(auth.uid(), 'level_1_minimum'::access_level));

CREATE POLICY "Members can read own challenge progress"
  ON public.challenge_progress FOR SELECT
  USING (member_id IN (SELECT m.id FROM public.members m JOIN public.line_users lu ON lu.member_id = m.id WHERE lu.user_id = auth.uid()));

-- 8) REWARD REDEMPTIONS
CREATE TABLE public.reward_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id uuid NOT NULL REFERENCES public.gamification_rewards(id) ON DELETE RESTRICT,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  points_spent integer NOT NULL,
  status public.reward_redemption_status NOT NULL DEFAULT 'pending',
  fulfilled_at timestamptz,
  cancelled_at timestamptz,
  fulfilled_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  idempotency_key text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(idempotency_key)
);

ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read reward redemptions"
  ON public.reward_redemptions FOR SELECT
  USING (has_min_access_level(auth.uid(), 'level_1_minimum'::access_level));

CREATE POLICY "Members can read own redemptions"
  ON public.reward_redemptions FOR SELECT
  USING (member_id IN (SELECT m.id FROM public.members m JOIN public.line_users lu ON lu.member_id = m.id WHERE lu.user_id = auth.uid()));

-- Add FK from points_ledger to reward_redemptions
ALTER TABLE public.points_ledger
  ADD CONSTRAINT points_ledger_redemption_id_fkey
  FOREIGN KEY (redemption_id) REFERENCES public.reward_redemptions(id) ON DELETE SET NULL;

-- 9) SQUADS + SQUAD MEMBERSHIPS
CREATE TABLE public.squads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  season_id uuid REFERENCES public.gamification_seasons(id) ON DELETE SET NULL,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  max_members integer NOT NULL DEFAULT 10,
  is_active boolean NOT NULL DEFAULT true,
  total_xp bigint NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.members(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active squads"
  ON public.squads FOR SELECT
  USING (true);

CREATE POLICY "Managers can manage squads"
  ON public.squads FOR ALL
  USING (has_min_access_level(auth.uid(), 'level_3_manager'::access_level));

CREATE TABLE public.squad_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id uuid NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  role public.squad_role NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(squad_id, member_id)
);

ALTER TABLE public.squad_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read squad memberships"
  ON public.squad_memberships FOR SELECT
  USING (true);

CREATE POLICY "Managers can manage squad memberships"
  ON public.squad_memberships FOR ALL
  USING (has_min_access_level(auth.uid(), 'level_3_manager'::access_level));

-- 10) TRAINER GAMIFICATION SCORES
CREATE TABLE public.trainer_gamification_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  trainer_type text NOT NULL DEFAULT 'in_house',
  score integer NOT NULL DEFAULT 0,
  tier_id uuid REFERENCES public.gamification_trainer_tiers(id) ON DELETE SET NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  breakdown jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(staff_id, period_start, period_end)
);

ALTER TABLE public.trainer_gamification_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read trainer scores"
  ON public.trainer_gamification_scores FOR SELECT
  USING (has_min_access_level(auth.uid(), 'level_1_minimum'::access_level));

CREATE POLICY "Managers can manage trainer scores"
  ON public.trainer_gamification_scores FOR ALL
  USING (has_min_access_level(auth.uid(), 'level_3_manager'::access_level));

-- 11) UPDATED_AT TRIGGERS
CREATE TRIGGER set_updated_at_member_gamification_profiles
  BEFORE UPDATE ON public.member_gamification_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_challenge_progress
  BEFORE UPDATE ON public.challenge_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_reward_redemptions
  BEFORE UPDATE ON public.reward_redemptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_squads
  BEFORE UPDATE ON public.squads
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_trainer_gamification_scores
  BEFORE UPDATE ON public.trainer_gamification_scores
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 12) INDEXES for common query patterns
CREATE INDEX idx_xp_ledger_member ON public.xp_ledger(member_id, created_at DESC);
CREATE INDEX idx_points_ledger_member ON public.points_ledger(member_id, created_at DESC);
CREATE INDEX idx_badge_earnings_member ON public.badge_earnings(member_id);
CREATE INDEX idx_challenge_progress_member ON public.challenge_progress(member_id, status);
CREATE INDEX idx_challenge_progress_challenge ON public.challenge_progress(challenge_id, status);
CREATE INDEX idx_reward_redemptions_member ON public.reward_redemptions(member_id, status);
CREATE INDEX idx_trainer_scores_staff ON public.trainer_gamification_scores(staff_id, period_start DESC);
CREATE INDEX idx_streak_snapshots_member ON public.streak_snapshots(member_id);
