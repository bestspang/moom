
-- ================================================
-- 1. level_benefits table
-- ================================================
CREATE TABLE public.level_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_number integer NOT NULL,
  benefit_code text NOT NULL,
  benefit_type text NOT NULL DEFAULT 'pride',
  frequency text NOT NULL DEFAULT 'one_time',
  description_en text NOT NULL DEFAULT '',
  description_th text,
  business_cost text NOT NULL DEFAULT 'zero',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (level_number, benefit_code)
);

-- ================================================
-- 2. prestige_criteria table
-- ================================================
CREATE TABLE public.prestige_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_number integer NOT NULL CHECK (level_number >= 18 AND level_number <= 20),
  criterion_code text NOT NULL,
  criterion_type text NOT NULL DEFAULT 'numeric',
  target_value integer NOT NULL DEFAULT 0,
  description_en text NOT NULL DEFAULT '',
  description_th text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (level_number, criterion_code)
);

-- ================================================
-- 3. RLS policies
-- ================================================
ALTER TABLE public.level_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prestige_criteria ENABLE ROW LEVEL SECURITY;

-- level_benefits: anyone can read (public-facing benefit info)
CREATE POLICY "Anyone can read level_benefits"
  ON public.level_benefits FOR SELECT
  TO authenticated
  USING (true);

-- level_benefits: managers can manage
CREATE POLICY "Managers can manage level_benefits"
  ON public.level_benefits FOR ALL
  TO authenticated
  USING (public.has_min_access_level(auth.uid(), 'level_3_manager'))
  WITH CHECK (public.has_min_access_level(auth.uid(), 'level_3_manager'));

-- prestige_criteria: anyone can read
CREATE POLICY "Anyone can read prestige_criteria"
  ON public.prestige_criteria FOR SELECT
  TO authenticated
  USING (true);

-- prestige_criteria: managers can manage
CREATE POLICY "Managers can manage prestige_criteria"
  ON public.prestige_criteria FOR ALL
  TO authenticated
  USING (public.has_min_access_level(auth.uid(), 'level_3_manager'))
  WITH CHECK (public.has_min_access_level(auth.uid(), 'level_3_manager'));

-- ================================================
-- 4. check_prestige_eligibility function
-- ================================================
CREATE OR REPLACE FUNCTION public.check_prestige_eligibility(p_member_id uuid, p_target_level integer)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb := '[]'::jsonb;
  v_eligible boolean := true;
  v_criterion record;
  v_current integer;
  v_met boolean;
  -- Cached stats
  v_total_xp bigint;
  v_confirmed_visits bigint;
  v_monthly_quests_completed integer;
  v_seasonal_badges integer;
  v_referral_conversions integer;
  v_tenure_months integer;
  v_achievement_badges integer;
BEGIN
  -- Only applies to 18-20
  IF p_target_level < 18 OR p_target_level > 20 THEN
    RETURN jsonb_build_object('eligible', true, 'criteria', '[]'::jsonb);
  END IF;

  -- Cache stats
  SELECT COALESCE(total_xp, 0) INTO v_total_xp
  FROM member_gamification_profiles WHERE member_id = p_member_id;

  SELECT COUNT(*) INTO v_confirmed_visits
  FROM class_bookings WHERE member_id = p_member_id AND status = 'attended';

  -- Monthly quests completed in last 6 months
  SELECT COUNT(*) INTO v_monthly_quests_completed
  FROM challenge_progress cp
  JOIN gamification_challenges gc ON gc.id = cp.challenge_id
  WHERE cp.member_id = p_member_id
    AND cp.status = 'completed'
    AND gc.type = 'monthly'
    AND cp.completed_at >= (now() - interval '6 months');

  -- Seasonal badges earned
  SELECT COUNT(*) INTO v_seasonal_badges
  FROM badge_earnings be
  JOIN gamification_badges gb ON gb.id = be.badge_id
  WHERE be.member_id = p_member_id
    AND gb.badge_type = 'seasonal';

  -- Referral conversions
  SELECT COUNT(*) INTO v_referral_conversions
  FROM member_referrals
  WHERE referrer_member_id = p_member_id
    AND status = 'completed';

  -- Tenure months
  SELECT COALESCE(
    EXTRACT(MONTH FROM age(now(), m.created_at))::integer +
    EXTRACT(YEAR FROM age(now(), m.created_at))::integer * 12,
    0
  ) INTO v_tenure_months
  FROM members m WHERE m.id = p_member_id;

  -- Achievement badges (Elite Finisher, Community Heart, Package Keeper, Referral Hero)
  SELECT COUNT(*) INTO v_achievement_badges
  FROM badge_earnings be
  JOIN gamification_badges gb ON gb.id = be.badge_id
  WHERE be.member_id = p_member_id
    AND gb.badge_type = 'achievement';

  -- Evaluate each active criterion for this level
  FOR v_criterion IN
    SELECT * FROM prestige_criteria
    WHERE level_number = p_target_level AND is_active = true
  LOOP
    v_current := 0;
    v_met := false;

    CASE v_criterion.criterion_code
      WHEN 'min_xp' THEN
        v_current := v_total_xp;
      WHEN 'min_visits' THEN
        v_current := v_confirmed_visits;
      WHEN 'monthly_quests_4of6' THEN
        v_current := v_monthly_quests_completed;
      WHEN 'good_standing' THEN
        -- For now, always met (no abuse flags)
        v_current := 1;
      WHEN 'seasonal_badge_1' THEN
        v_current := v_seasonal_badges;
      WHEN 'referral_conversion_1' THEN
        v_current := v_referral_conversions;
      WHEN 'continuous_6mo' THEN
        v_current := v_tenure_months;
      WHEN 'min_tenure_months' THEN
        v_current := v_tenure_months;
      WHEN 'achievement_badges_2of4' THEN
        v_current := v_achievement_badges;
      ELSE
        v_current := 0;
    END CASE;

    v_met := v_current >= v_criterion.target_value;
    IF NOT v_met THEN
      v_eligible := false;
    END IF;

    v_result := v_result || jsonb_build_object(
      'code', v_criterion.criterion_code,
      'met', v_met,
      'current', v_current,
      'target', v_criterion.target_value,
      'description_en', v_criterion.description_en
    );
  END LOOP;

  RETURN jsonb_build_object('eligible', v_eligible, 'criteria', v_result);
END;
$$;

-- updated_at trigger for level_benefits
CREATE TRIGGER set_updated_at_level_benefits
  BEFORE UPDATE ON public.level_benefits
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
