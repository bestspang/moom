-- Atomic reward redemption RPC
-- Locks profile + reward rows, validates balance/stock, deducts atomically
CREATE OR REPLACE FUNCTION public.process_redeem_reward(
  p_member_id uuid,
  p_reward_id uuid,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_profile member_gamification_profiles%ROWTYPE;
  v_reward gamification_rewards%ROWTYPE;
  v_redemption_id uuid;
  v_existing_id uuid;
  v_new_balance bigint;
  v_today date := CURRENT_DATE;
  v_today_count integer;
BEGIN
  -- Idempotency check
  SELECT id INTO v_existing_id
  FROM reward_redemptions
  WHERE idempotency_key = p_idempotency_key
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'idempotent', true,
      'redemption_id', v_existing_id
    );
  END IF;

  -- Lock the reward row
  SELECT * INTO v_reward
  FROM gamification_rewards
  WHERE id = p_reward_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'REWARD_NOT_FOUND');
  END IF;

  IF NOT v_reward.is_active THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'REWARD_INACTIVE');
  END IF;

  IF v_reward.available_from IS NOT NULL AND v_reward.available_from > now() THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'NOT_YET_AVAILABLE');
  END IF;

  IF v_reward.available_until IS NOT NULL AND v_reward.available_until < now() THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'EXPIRED');
  END IF;

  -- Stock check (skip if unlimited)
  IF NOT v_reward.is_unlimited THEN
    IF COALESCE(v_reward.stock, 0) - COALESCE(v_reward.redeemed_count, 0) <= 0 THEN
      RETURN jsonb_build_object('success', false, 'error_code', 'OUT_OF_STOCK');
    END IF;
  END IF;

  -- Daily limit check
  IF v_reward.daily_limit IS NOT NULL AND v_reward.daily_limit > 0 THEN
    SELECT COUNT(*) INTO v_today_count
    FROM reward_redemptions
    WHERE member_id = p_member_id
      AND reward_id = p_reward_id
      AND created_at::date = v_today
      AND status NOT IN ('rolled_back', 'cancelled');

    IF v_today_count >= v_reward.daily_limit THEN
      RETURN jsonb_build_object('success', false, 'error_code', 'DAILY_LIMIT_REACHED');
    END IF;
  END IF;

  -- Lock the profile row
  SELECT * INTO v_profile
  FROM member_gamification_profiles
  WHERE member_id = p_member_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'PROFILE_NOT_FOUND');
  END IF;

  -- Level requirement
  IF v_reward.level_required IS NOT NULL AND v_profile.current_level < v_reward.level_required THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'LEVEL_TOO_LOW',
      'required', v_reward.level_required,
      'current', v_profile.current_level
    );
  END IF;

  -- Balance check
  IF v_profile.available_points < v_reward.points_cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'INSUFFICIENT_POINTS',
      'required', v_reward.points_cost,
      'available', v_profile.available_points
    );
  END IF;

  v_new_balance := v_profile.available_points - v_reward.points_cost;

  -- Atomic writes
  UPDATE member_gamification_profiles
  SET available_points = v_new_balance,
      updated_at = now()
  WHERE member_id = p_member_id;

  UPDATE gamification_rewards
  SET redeemed_count = COALESCE(redeemed_count, 0) + 1,
      updated_at = now()
  WHERE id = p_reward_id;

  INSERT INTO reward_redemptions (
    reward_id, member_id, points_spent, status, idempotency_key
  ) VALUES (
    p_reward_id, p_member_id, v_reward.points_cost, 'pending', p_idempotency_key
  ) RETURNING id INTO v_redemption_id;

  INSERT INTO points_ledger (
    member_id, event_type, delta, balance_after, redemption_id, idempotency_key, metadata
  ) VALUES (
    p_member_id, 'reward_redeemed', -v_reward.points_cost, v_new_balance, v_redemption_id,
    'pts:redeem:' || p_idempotency_key,
    jsonb_build_object('reward_id', p_reward_id, 'reward_name', v_reward.name_en)
  );

  INSERT INTO gamification_audit_log (
    member_id, event_type, action_key, xp_delta, points_delta, metadata, flagged
  ) VALUES (
    p_member_id, 'reward_redeemed', 'redeem_reward', 0, -v_reward.points_cost,
    jsonb_build_object('reward_id', p_reward_id, 'redemption_id', v_redemption_id, 'reward_name', v_reward.name_en),
    false
  );

  RETURN jsonb_build_object(
    'success', true,
    'redemption_id', v_redemption_id,
    'points_spent', v_reward.points_cost,
    'available_points', v_new_balance,
    'reward_name', v_reward.name_en
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_redeem_reward(uuid, uuid, text) TO authenticated, service_role;