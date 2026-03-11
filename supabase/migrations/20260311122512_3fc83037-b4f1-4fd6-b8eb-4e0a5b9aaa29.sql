
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
BEGIN
  -- 1) Calculate rolling SP
  SELECT COALESCE(SUM(delta), 0) INTO v_sp_90d
  FROM sp_ledger
  WHERE member_id = p_member_id AND created_at >= v_now - interval '90 days';

  -- 2) Calculate active days from member_attendance
  SELECT COUNT(DISTINCT check_in_time::date) INTO v_active_30d
  FROM member_attendance
  WHERE member_id = p_member_id AND check_in_time >= v_now - interval '30 days';

  SELECT COUNT(DISTINCT check_in_time::date) INTO v_active_60d
  FROM member_attendance
  WHERE member_id = p_member_id AND check_in_time >= v_now - interval '60 days';

  SELECT COUNT(DISTINCT check_in_time::date) INTO v_active_90d
  FROM member_attendance
  WHERE member_id = p_member_id AND check_in_time >= v_now - interval '90 days';

  -- 3) Current level
  SELECT COALESCE(current_level, 1) INTO v_current_level
  FROM member_gamification_profiles WHERE member_id = p_member_id;
  v_current_level := COALESCE(v_current_level, 1);

  -- 4) Active package check (with 14-day grace)
  SELECT EXISTS (
    SELECT 1 FROM member_packages
    WHERE member_id = p_member_id AND status = 'active'
      AND (expiry_date IS NULL OR expiry_date >= v_today)
      AND (sessions_remaining IS NULL OR sessions_remaining > 0)
  ) INTO v_has_active_pkg;

  -- Grace: package expired within 14 days
  SELECT EXISTS (
    SELECT 1 FROM member_packages
    WHERE member_id = p_member_id AND status IN ('active', 'expired')
      AND expiry_date >= v_today - 14
      AND expiry_date < v_today
  ) INTO v_pkg_grace;

  -- 5) Evaluate against tier rules (highest first)
  FOR v_rule IN
    SELECT * FROM status_tier_rules
    WHERE is_active = true
    ORDER BY tier_order DESC
  LOOP
    -- Check minimum level
    IF v_current_level < v_rule.min_level THEN CONTINUE; END IF;
    -- Check SP
    IF v_sp_90d < v_rule.min_sp_90d THEN CONTINUE; END IF;
    -- Check active days for the specified window
    IF v_rule.active_days_window <= 30 AND v_active_30d < v_rule.min_active_days_period THEN CONTINUE; END IF;
    IF v_rule.active_days_window > 30 AND v_rule.active_days_window <= 60 AND v_active_60d < v_rule.min_active_days_period THEN CONTINUE; END IF;
    IF v_rule.active_days_window > 60 AND v_active_90d < v_rule.min_active_days_period THEN CONTINUE; END IF;
    -- Check active package (grace counts)
    IF v_rule.requires_active_package AND NOT v_has_active_pkg AND NOT v_pkg_grace THEN CONTINUE; END IF;
    -- Passed all checks
    v_best_tier := v_rule.tier_code;
    v_best_order := v_rule.tier_order;
    EXIT; -- Already sorted DESC, first match = highest tier
  END LOOP;

  -- 6) Get current state
  SELECT * INTO v_current_row FROM member_status_tiers WHERE member_id = p_member_id;

  -- 7) Apply downgrade protection: max 1 tier drop per evaluation
  IF v_current_row IS NOT NULL THEN
    DECLARE
      v_current_order integer;
    BEGIN
      SELECT tier_order INTO v_current_order FROM status_tier_rules WHERE tier_code = v_current_row.current_tier;
      IF v_current_order IS NOT NULL AND v_best_order < v_current_order THEN
        -- Max 1 tier drop
        IF (v_current_order - v_best_order) > 1 THEN
          SELECT tier_code INTO v_best_tier FROM status_tier_rules WHERE tier_order = v_current_order - 1 AND is_active = true;
          v_best_order := v_current_order - 1;
        END IF;
        -- Grace period protection
        IF v_current_row.grace_until IS NOT NULL AND v_current_row.grace_until >= v_now THEN
          v_best_tier := v_current_row.current_tier;
          v_best_order := v_current_order;
        END IF;
      END IF;
    END;
  END IF;

  -- 8) Upsert member_status_tiers
  INSERT INTO member_status_tiers (member_id, current_tier, sp_90d, active_days_30d, active_days_60d, active_days_90d, last_evaluated_at, tier_changed_at, previous_tier,
    grace_until)
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
