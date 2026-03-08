
-- Gamification Studio: Core tables

-- 1. Gamification Rules (action-to-XP/points mapping)
CREATE TABLE public.gamification_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_key text NOT NULL UNIQUE,
  label_en text NOT NULL,
  label_th text,
  xp_value integer NOT NULL DEFAULT 0,
  points_value integer NOT NULL DEFAULT 0,
  cooldown_minutes integer DEFAULT 0,
  max_per_day integer,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Gamification Levels (tier definitions)
CREATE TABLE public.gamification_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_number integer NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_th text,
  xp_required integer NOT NULL DEFAULT 0,
  badge_color text,
  perks jsonb DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Gamification Seasons
CREATE TABLE public.gamification_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_th text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reset_xp boolean NOT NULL DEFAULT false,
  reset_points boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Gamification Challenges
CREATE TABLE public.gamification_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_th text,
  description_en text,
  description_th text,
  type text NOT NULL DEFAULT 'daily',
  goal_type text NOT NULL DEFAULT 'action_count',
  goal_value integer NOT NULL DEFAULT 1,
  goal_action_key text,
  reward_xp integer DEFAULT 0,
  reward_points integer DEFAULT 0,
  reward_badge_id uuid,
  eligibility jsonb DEFAULT '{}'::jsonb,
  target_location_ids uuid[] DEFAULT '{}',
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Gamification Badges
CREATE TABLE public.gamification_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_th text,
  description_en text,
  description_th text,
  tier text NOT NULL DEFAULT 'bronze',
  icon_url text,
  unlock_condition jsonb NOT NULL DEFAULT '{}'::jsonb,
  display_priority integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add FK for challenges -> badges
ALTER TABLE public.gamification_challenges
  ADD CONSTRAINT gamification_challenges_reward_badge_id_fkey
  FOREIGN KEY (reward_badge_id) REFERENCES public.gamification_badges(id);

-- 6. Gamification Rewards (catalog)
CREATE TABLE public.gamification_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_th text,
  description_en text,
  description_th text,
  category text NOT NULL DEFAULT 'perk',
  points_cost integer NOT NULL DEFAULT 0,
  level_required integer DEFAULT 0,
  stock integer,
  redeemed_count integer DEFAULT 0,
  is_unlimited boolean NOT NULL DEFAULT true,
  available_from timestamptz,
  available_until timestamptz,
  linked_package_id uuid REFERENCES public.packages(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. Gamification Trainer Tiers
CREATE TABLE public.gamification_trainer_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_type text NOT NULL DEFAULT 'in_house',
  tier_name_en text NOT NULL,
  tier_name_th text,
  min_score integer NOT NULL DEFAULT 0,
  perks jsonb DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 8. Gamification Audit Log
CREATE TABLE public.gamification_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid,
  staff_id uuid,
  event_type text NOT NULL,
  action_key text,
  xp_delta integer DEFAULT 0,
  points_delta integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  flagged boolean DEFAULT false,
  flag_reason text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.gamification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_trainer_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Managers can manage, Staff can read
CREATE POLICY "Managers can manage gamification_rules" ON public.gamification_rules FOR ALL USING (has_min_access_level(auth.uid(), 'level_3_manager'::access_level));
CREATE POLICY "Staff can read gamification_rules" ON public.gamification_rules FOR SELECT USING (has_min_access_level(auth.uid(), 'level_1_minimum'::access_level));

CREATE POLICY "Managers can manage gamification_levels" ON public.gamification_levels FOR ALL USING (has_min_access_level(auth.uid(), 'level_3_manager'::access_level));
CREATE POLICY "Staff can read gamification_levels" ON public.gamification_levels FOR SELECT USING (has_min_access_level(auth.uid(), 'level_1_minimum'::access_level));

CREATE POLICY "Managers can manage gamification_seasons" ON public.gamification_seasons FOR ALL USING (has_min_access_level(auth.uid(), 'level_3_manager'::access_level));
CREATE POLICY "Staff can read gamification_seasons" ON public.gamification_seasons FOR SELECT USING (has_min_access_level(auth.uid(), 'level_1_minimum'::access_level));

CREATE POLICY "Managers can manage gamification_challenges" ON public.gamification_challenges FOR ALL USING (has_min_access_level(auth.uid(), 'level_3_manager'::access_level));
CREATE POLICY "Staff can read gamification_challenges" ON public.gamification_challenges FOR SELECT USING (has_min_access_level(auth.uid(), 'level_1_minimum'::access_level));

CREATE POLICY "Managers can manage gamification_badges" ON public.gamification_badges FOR ALL USING (has_min_access_level(auth.uid(), 'level_3_manager'::access_level));
CREATE POLICY "Staff can read gamification_badges" ON public.gamification_badges FOR SELECT USING (has_min_access_level(auth.uid(), 'level_1_minimum'::access_level));

CREATE POLICY "Managers can manage gamification_rewards" ON public.gamification_rewards FOR ALL USING (has_min_access_level(auth.uid(), 'level_3_manager'::access_level));
CREATE POLICY "Staff can read gamification_rewards" ON public.gamification_rewards FOR SELECT USING (has_min_access_level(auth.uid(), 'level_1_minimum'::access_level));

CREATE POLICY "Managers can manage gamification_trainer_tiers" ON public.gamification_trainer_tiers FOR ALL USING (has_min_access_level(auth.uid(), 'level_3_manager'::access_level));
CREATE POLICY "Staff can read gamification_trainer_tiers" ON public.gamification_trainer_tiers FOR SELECT USING (has_min_access_level(auth.uid(), 'level_1_minimum'::access_level));

CREATE POLICY "Managers can manage gamification_audit_log" ON public.gamification_audit_log FOR ALL USING (has_min_access_level(auth.uid(), 'level_3_manager'::access_level));
CREATE POLICY "Staff can read gamification_audit_log" ON public.gamification_audit_log FOR SELECT USING (has_min_access_level(auth.uid(), 'level_1_minimum'::access_level));

-- Updated_at triggers
CREATE TRIGGER handle_gamification_rules_updated_at BEFORE UPDATE ON public.gamification_rules FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER handle_gamification_levels_updated_at BEFORE UPDATE ON public.gamification_levels FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER handle_gamification_seasons_updated_at BEFORE UPDATE ON public.gamification_seasons FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER handle_gamification_challenges_updated_at BEFORE UPDATE ON public.gamification_challenges FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER handle_gamification_badges_updated_at BEFORE UPDATE ON public.gamification_badges FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER handle_gamification_rewards_updated_at BEFORE UPDATE ON public.gamification_rewards FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER handle_gamification_trainer_tiers_updated_at BEFORE UPDATE ON public.gamification_trainer_tiers FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
