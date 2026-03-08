import { supabase } from '@/integrations/supabase/client';
import type { MomentumProfile, MemberBadgeEarning } from './types';
import { tierFromLevel } from './types';

/**
 * Fetch momentum profile for a given member_id.
 * Uses `member_gamification_profiles` table from this project's schema.
 */
export async function fetchMomentumProfile(memberId: string): Promise<MomentumProfile | null> {
  if (!memberId) return null;

  const { data, error } = await supabase
    .from('member_gamification_profiles')
    .select('*')
    .eq('member_id', memberId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  // Derive weekly checkin days from streak_snapshots if available
  const { data: streakData } = await supabase
    .from('streak_snapshots')
    .select('last_activity_date, current_streak')
    .eq('member_id', memberId)
    .eq('streak_type', 'daily')
    .maybeSingle();

  return {
    memberId: data.member_id,
    totalXp: data.total_xp,
    level: data.current_level,
    tier: tierFromLevel(data.current_level),
    currentStreak: streakData?.current_streak ?? data.current_streak,
    longestStreak: data.longest_streak,
    availablePoints: data.available_points,
    totalPoints: data.total_points,
    weeklyCheckinDays: [], // Would require attendance query per week — keep empty for now
  };
}

/**
 * Fetch badges earned by a member.
 * Uses `badge_earnings` + `gamification_badges` from this project's schema.
 */
export async function fetchMyBadges(memberId: string): Promise<MemberBadgeEarning[]> {
  if (!memberId) return [];

  const { data, error } = await supabase
    .from('badge_earnings')
    .select('*, badge:gamification_badges(*)')
    .eq('member_id', memberId)
    .order('earned_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => {
    const b = row.badge;
    return {
      id: row.id,
      memberId: row.member_id,
      badgeId: row.badge_id,
      earnedAt: row.earned_at,
      badge: b ? {
        id: b.id,
        nameEn: b.name_en,
        nameTh: b.name_th,
        descriptionEn: b.description_en,
        tier: b.tier,
        iconUrl: b.icon_url,
      } : undefined,
    };
  });
}

/**
 * Fetch active challenges.
 */
export async function fetchActiveChallenges() {
  const { data, error } = await supabase
    .from('gamification_challenges')
    .select('*')
    .eq('status', 'active')
    .order('end_date', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Fetch challenge progress for a member.
 */
export async function fetchMyChallengeProgress(memberId: string) {
  if (!memberId) return [];

  const { data, error } = await supabase
    .from('challenge_progress')
    .select('*, challenge:gamification_challenges(*)')
    .eq('member_id', memberId);

  if (error) throw error;
  return data ?? [];
}
