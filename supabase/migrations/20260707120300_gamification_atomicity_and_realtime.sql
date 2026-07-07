-- Gamification correctness: atomic profile updates, SP idempotency, realtime gaps.

-- H1: Atomic, relative profile delta. gamification-process-event previously did a
-- read-modify-write (profile.total_xp + delta -> UPDATE absolute), so concurrent
-- events for the same member lost increments and the profile drifted below the
-- append-only ledgers. Apply xp/points as relative increments in a single UPDATE.
-- level/longest_streak are monotonic (GREATEST); current_streak/level are only
-- written when provided so points-only callers (referral rewards) don't clobber them.
CREATE OR REPLACE FUNCTION public.apply_gamification_profile_delta(
  p_member_id uuid,
  p_xp_delta bigint,
  p_points_total_delta bigint,
  p_points_available_delta bigint,
  p_current_level integer DEFAULT NULL,
  p_current_streak integer DEFAULT NULL,
  p_longest_streak integer DEFAULT NULL
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.member_gamification_profiles
  SET total_xp         = total_xp + p_xp_delta,
      total_points     = total_points + p_points_total_delta,
      available_points = available_points + p_points_available_delta,
      current_level    = GREATEST(current_level, COALESCE(p_current_level, current_level)),
      current_streak   = COALESCE(p_current_streak, current_streak),
      longest_streak   = GREATEST(longest_streak, COALESCE(p_longest_streak, longest_streak)),
      last_activity_at = now(),
      updated_at       = now()
  WHERE member_id = p_member_id;
$$;

REVOKE EXECUTE ON FUNCTION public.apply_gamification_profile_delta(uuid, bigint, bigint, bigint, integer, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.apply_gamification_profile_delta(uuid, bigint, bigint, bigint, integer, integer, integer) TO service_role;

-- H2: SP ledger idempotency. sp_ledger had no idempotency guard, so a retry that
-- races past the xp_ledger pre-check double-counted status points (driving phantom
-- tier upgrades). Add an idempotency key + partial unique index; the emitter populates it.
ALTER TABLE public.sp_ledger ADD COLUMN IF NOT EXISTS idempotency_key text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_sp_ledger_idempotency
  ON public.sp_ledger(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- H3: Realtime gaps. xp_ledger drives the member-facing "+N XP" toast but was never
-- in the realtime publication (so the toast could never fire); expenses feed the P&L
-- but never broadcast. Add both. (ADD TABLE errors if already present, so guard it.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'xp_ledger'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.xp_ledger;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'expenses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
  END IF;
END $$;
