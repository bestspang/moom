import { supabase } from '@/integrations/supabase/client';
import type { CoachImpactProfile, CoachLevel, PartnerReputationProfile, PartnerTier, TrainerQuest } from './types';

/**
 * Resolve the staff_id linked to the current auth user.
 */
async function getStaffId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  const uid = session?.user?.id;
  if (!uid) return null;

  const { data } = await supabase
    .from('staff')
    .select('id')
    .eq('user_id', uid)
    .maybeSingle();

  return data?.id ?? null;
}

function resolveCoachLevel(score: number): CoachLevel {
  if (score >= 90) return 'elite_coach';
  if (score >= 70) return 'master';
  if (score >= 50) return 'senior';
  if (score >= 30) return 'established';
  return 'rising';
}

function resolvePartnerTier(score: number): PartnerTier {
  if (score >= 80) return 'premium_partner';
  if (score >= 55) return 'preferred';
  if (score >= 30) return 'verified';
  return 'new_partner';
}

export async function fetchCoachImpactProfile(): Promise<CoachImpactProfile | null> {
  const staffId = await getStaffId();
  if (!staffId) return null;

  const { data, error } = await supabase
    .from('trainer_gamification_scores')
    .select('*')
    .eq('staff_id', staffId)
    .eq('trainer_type', 'in_house')
    .order('period_end', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const bd = (data.breakdown ?? {}) as Record<string, number>;

  return {
    id: data.id,
    staff_id: data.staff_id,
    impact_score: data.score,
    coach_level: resolveCoachLevel(data.score),
    coin_balance: (data as any).coin_balance ?? 0,
    total_classes_taught: bd.total_classes_taught ?? 0,
    avg_attendance_rate: bd.avg_attendance_rate ?? 0,
    member_return_rate: bd.member_return_rate ?? 0,
    pt_log_completion_rate: bd.pt_log_completion_rate ?? 0,
    current_streak_weeks: bd.current_streak_weeks ?? 0,
  };
}

export async function fetchPartnerReputationProfile(): Promise<PartnerReputationProfile | null> {
  const staffId = await getStaffId();
  if (!staffId) return null;

  const { data, error } = await supabase
    .from('trainer_gamification_scores')
    .select('*')
    .eq('staff_id', staffId)
    .eq('trainer_type', 'freelance')
    .order('period_end', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const bd = (data.breakdown ?? {}) as Record<string, number>;

  return {
    id: data.id,
    staff_id: data.staff_id,
    reputation_score: data.score,
    partner_tier: resolvePartnerTier(data.score),
    coin_balance: (data as any).coin_balance ?? 0,
    total_sessions: bd.total_sessions ?? 0,
    punctuality_rate: bd.punctuality_rate ?? 0,
    repeat_booking_rate: bd.repeat_booking_rate ?? 0,
    avg_rating: bd.avg_rating ?? 0,
    cancellation_rate: bd.cancellation_rate ?? 0,
    is_verified: bd.is_verified === 1,
  };
}

export async function fetchTrainerType(): Promise<'in_house' | 'freelance'> {
  const { data: { session } } = await supabase.auth.getSession();
  const uid = session?.user?.id;
  if (!uid) return 'in_house';

  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', uid)
    .in('role', ['trainer', 'freelance_trainer']);

  if (!data?.length) return 'in_house';
  const hasFreelance = data.some(r => r.role === 'freelance_trainer');
  return hasFreelance ? 'freelance' : 'in_house';
}

export async function fetchTrainerQuests(audienceType: 'trainer_inhouse' | 'trainer_freelance'): Promise<TrainerQuest[]> {
  const { data, error } = await supabase
    .from('quest_templates')
    .select('id, name_en, name_th, quest_period, goal_value, xp_reward, coin_reward')
    .eq('audience_type', audienceType)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(4);

  if (error) return [];
  return (data ?? []).map(q => ({
    id: q.id,
    name_en: q.name_en,
    name_th: q.name_th,
    quest_period: q.quest_period,
    goal_value: q.goal_value,
    xp_reward: q.xp_reward,
    coin_reward: q.coin_reward,
  }));
}
