CREATE OR REPLACE FUNCTION public.evaluate_member_tier(p_member_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_sp_90d integer;
  v_active_30d integer;
  v_active_60d integer;
  v_active_90d integer;
  v_current_level integer;
  v_has_active_pkg boolean;
  v_pkg_grace boolean;
  v_current_row member_status_tiers%ROWTYPE;
  v_best_tier text := 'bronze';
  v_best_order integer := 1;
  v_rule record;
  v_now timestamptz := now();
  v_today date := CURRENT_DATE;
  v_extra jsonb;
  v_extra_met boolean;
BEGIN
  SELECT COALESCE(SUM(delta), 0) INTO v_sp_90d
  FROM sp_ledger
  WHERE member_id = p_member_id AND created_at >= v_now - interval '90 days';

  SELECT COUNT(DISTINCT check_in_time::date) INTO v_active_30d
  FROM member_attendance
  WHERE member_id = p_member_id AND check_in_time >= v_now - interval '30 days';

  SELECT COUNT(DISTINCT check_in_time::date) INTO v_active_60d
  FROM member_attendance
  WHERE member_id = p_member_id AND check_in_time >= v_now - interval '60 days';

  SELECT COUNT(DISTINCT check_in_time::date) INTO v_active_90d
  FROM member_attendance
  WHERE member_id = p_member_id AND check_in_time >= v_now - interval '90 days';

  SELECT COALESCE(current_level, 1) INTO v_current_level
  FROM member_gamification_profiles WHERE member_id = p_member_id;
  v_current_level := COALESCE(v_current_level, 1);

  SELECT EXISTS (
    SELECT 1 FROM member_packages
    WHERE member_id = p_member_id AND status = 'active'
      AND (expiry_date IS NULL OR expiry_date >= v_today)
      AND (sessions_remaining IS NULL OR sessions_remaining > 0)
  ) INTO v_has_active_pkg;

  SELECT EXISTS (
    SELECT 1 FROM member_packages
    WHERE member_id = p_member_id AND status IN ('active', 'expired')
      AND expiry_date >= v_today - 14
      AND expiry_date < v_today
  ) INTO v_pkg_grace;

  FOR v_rule IN
    SELECT * FROM status_tier_rules
    WHERE is_active = true
    ORDER BY tier_order DESC
  LOOP
    IF v_current_level < v_rule.min_level THEN CONTINUE; END IF;
    IF v_sp_90d < v_rule.min_sp_90d THEN CONTINUE; END IF;
    IF v_rule.active_days_window <= 30 AND v_active_30d < v_rule.min_active_days_period THEN CONTINUE; END IF;
    IF v_rule.active_days_window > 30 AND v_rule.active_days_window <= 60 AND v_active_60d < v_rule.min_active_days_period THEN CONTINUE; END IF;
    IF v_rule.active_days_window > 60 AND v_active_90d < v_rule.min_active_days_period THEN CONTINUE; END IF;
    IF v_rule.requires_active_package AND NOT v_has_active_pkg AND NOT v_pkg_grace THEN CONTINUE; END IF;

    v_extra := v_rule.extra_criteria;
    v_extra_met := true;

    IF v_extra IS NOT NULL AND v_extra != '{}'::jsonb AND v_extra != 'null'::jsonb THEN
      IF v_extra ? 'monthly_quest_min' THEN
        DECLARE
          v_mq_min integer := (v_extra->>'monthly_quest_min')::integer;
          v_mq_window integer := COALESCE((v_extra->>'monthly_quest_window_days')::integer, 60);
          v_mq_count integer;
        BEGIN
          SELECT COUNT(*) INTO v_mq_count
          FROM challenge_progress cp
          JOIN gamification_challenges gc ON gc.id = cp.challenge_id
          WHERE cp.member_id = p_member_id
            AND cp.status = 'completed'
            AND gc.type = 'monthly'
            AND cp.completed_at >= v_now - (v_mq_window || ' days')::interval;
          IF v_mq_count < v_mq_min THEN v_extra_met := false; END IF;
        END;
      END IF;

      IF v_extra_met AND v_extra ? 'challenge_min' THEN
        DECLARE
          v_ch_min integer := (v_extra->>'challenge_min')::integer;
          v_ch_window integer := COALESCE((v_extra->>'challenge_window_days')::integer, 90);
          v_ch_count integer;
        BEGIN
          SELECT COUNT(*) INTO v_ch_count
          FROM challenge_progress cp
          JOIN gamification_challenges gc ON gc.id = cp.challenge_id
          WHERE cp.member_id = p_member_id
            AND cp.status = 'completed'
            AND gc.type IN ('monthly', 'seasonal')
            AND cp.completed_at >= v_now - (v_ch_window || ' days')::interval;
          IF v_ch_count < v_ch_min THEN v_extra_met := false; END IF;
        END;
      END IF;

      IF v_extra_met AND v_extra ? 'extra_2of4' THEN
        DECLARE
          v_dims_met integer := 0;
          v_seasonal_badges integer;
          v_referral_conv integer;
          v_monthly_q2 integer;
          v_community_ev2 integer;
        BEGIN
          SELECT COUNT(*) INTO v_seasonal_badges
          FROM badge_earnings be
          JOIN gamification_badges gb ON gb.id = be.badge_id
          WHERE be.member_id = p_member_id AND gb.badge_type = 'seasonal';
          IF v_seasonal_badges >= 1 THEN v_dims_met := v_dims_met + 1; END IF;

          SELECT COUNT(*) INTO v_referral_conv
          FROM member_referrals
          WHERE referrer_member_id = p_member_id AND status = 'completed';
          IF v_referral_conv >= 1 THEN v_dims_met := v_dims_met + 1; END IF;

          SELECT COUNT(*) INTO v_monthly_q2
          FROM challenge_progress cp
          JOIN gamification_challenges gc ON gc.id = cp.challenge_id
          WHERE cp.member_id = p_member_id
            AND cp.status = 'completed'
            AND gc.type = 'monthly'
            AND cp.completed_at >= v_now - interval '90 days';
          IF v_monthly_q2 >= 2 THEN v_dims_met := v_dims_met + 1; END IF;

          -- FIX: use event_type (correct column) instead of action_key (does not exist)
          SELECT COUNT(*) INTO v_community_ev2
          FROM sp_ledger
          WHERE member_id = p_member_id
            AND event_type = 'community_event'
            AND created_at >= v_now - interval '90 days';
          IF v_community_ev2 >= 2 THEN v_dims_met := v_dims_met + 1; END IF;

          IF v_dims_met < 2 THEN v_extra_met := false; END IF;
        END;
      END IF;
    END IF;

    IF NOT v_extra_met THEN CONTINUE; END IF;

    v_best_tier := v_rule.tier_code;
    v_best_order := v_rule.tier_order;
    EXIT;
  END LOOP;

  SELECT * INTO v_current_row FROM member_status_tiers WHERE member_id = p_member_id;

  IF v_current_row IS NOT NULL THEN
    DECLARE
      v_current_order integer;
    BEGIN
      SELECT tier_order INTO v_current_order FROM status_tier_rules WHERE tier_code = v_current_row.current_tier;
      IF v_current_order IS NOT NULL AND v_best_order < v_current_order THEN
        IF (v_current_order - v_best_order) > 1 THEN
          SELECT tier_code INTO v_best_tier FROM status_tier_rules WHERE tier_order = v_current_order - 1 AND is_active = true;
          v_best_order := v_current_order - 1;
        END IF;
        IF v_current_row.grace_until IS NOT NULL AND v_current_row.grace_until >= v_now THEN
          v_best_tier := v_current_row.current_tier;
          v_best_order := v_current_order;
        END IF;
      END IF;
    END;
  END IF;

  INSERT INTO member_status_tiers (member_id, current_tier, sp_90d, active_days_30d, active_days_60d, active_days_90d, last_evaluated_at, tier_changed_at, previous_tier, grace_until)
  VALUES (p_member_id, v_best_tier, v_sp_90d, v_active_30d, v_active_60d, v_active_90d, v_now,
    CASE WHEN v_current_row IS NULL OR v_current_row.current_tier != v_best_tier THEN v_now ELSE v_current_row.tier_changed_at END,
    CASE WHEN v_current_row IS NOT NULL THEN v_current_row.current_tier ELSE NULL END,
    CASE WHEN v_pkg_grace AND NOT v_has_active_pkg THEN v_now + interval '14 days' ELSE NULL END)
  ON CONFLICT (member_id) DO UPDATE SET
    current_tier = EXCLUDED.current_tier,
    sp_90d = EXCLUDED.sp_90d,
    active_days_30d = EXCLUDED.active_days_30d,
    active_days_60d = EXCLUDED.active_days_60d,
    active_days_90d = EXCLUDED.active_days_90d,
    last_evaluated_at = EXCLUDED.last_evaluated_at,
    tier_changed_at = EXCLUDED.tier_changed_at,
    previous_tier = EXCLUDED.previous_tier,
    grace_until = EXCLUDED.grace_until;

  RETURN jsonb_build_object(
    'tier', v_best_tier,
    'sp_90d', v_sp_90d,
    'active_days_30d', v_active_30d,
    'active_days_60d', v_active_60d,
    'active_days_90d', v_active_90d,
    'level', v_current_level,
    'has_active_package', v_has_active_pkg,
    'grace', v_pkg_grace
  );
END;
$function$;