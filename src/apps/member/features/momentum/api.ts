import { supabase } from '@/integrations/supabase/client';
import type {
  MomentumProfile, MemberBadgeEarning, RewardItem, RewardRedemption,
  PointsLedgerEntry, SquadInfo, SquadMemberInfo, BadgeDefinition,
  ChallengeProgressEntry,
} from './types';
import { tierFromLevel } from './types';

// ─── Momentum Profile ───────────────────────────────────────

export async function fetchMomentumProfile(memberId: string): Promise<MomentumProfile | null> {
  if (!memberId) return null;

  const { data, error } = await supabase
    .from('member_gamification_profiles')
    .select('*')
    .eq('member_id', memberId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

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
    weeklyCheckinDays: [],
  };
}

// ─── Badges ─────────────────────────────────────────────────

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

export async function fetchAllBadges(): Promise<BadgeDefinition[]> {
  const { data, error } = await supabase
    .from('gamification_badges')
    .select('*')
    .eq('is_active', true)
    .order('display_priority', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((b: any) => ({
    id: b.id,
    nameEn: b.name_en,
    nameTh: b.name_th,
    descriptionEn: b.description_en,
    tier: b.tier,
    iconUrl: b.icon_url,
    unlockCondition: b.unlock_condition ?? {},
    displayPriority: b.display_priority ?? 0,
  }));
}

// ─── Challenges ─────────────────────────────────────────────

export async function fetchActiveChallenges() {
  const { data, error } = await supabase
    .from('gamification_challenges')
    .select('*')
    .eq('status', 'active')
    .order('end_date', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchMyChallengeProgress(memberId: string): Promise<ChallengeProgressEntry[]> {
  if (!memberId) return [];

  const { data, error } = await supabase
    .from('challenge_progress')
    .select('*, challenge:gamification_challenges(*)')
    .eq('member_id', memberId);

  if (error) throw error;

  return (data ?? []).map((row: any) => {
    const c = row.challenge;
    return {
      id: row.id,
      challengeId: row.challenge_id,
      memberId: row.member_id,
      currentValue: row.current_value,
      status: row.status,
      completedAt: row.completed_at,
      challenge: c ? {
        id: c.id,
        nameEn: c.name_en,
        goalValue: c.goal_value,
        goalType: c.goal_type,
        rewardXp: c.reward_xp ?? 0,
        rewardPoints: c.reward_points ?? 0,
        status: c.status,
      } : undefined,
    };
  });
}

// ─── Rewards ────────────────────────────────────────────────

export async function fetchRewards(): Promise<RewardItem[]> {
  const { data, error } = await supabase
    .from('gamification_rewards')
    .select('*')
    .eq('is_active', true)
    .order('points_cost', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((r: any) => ({
    id: r.id,
    nameEn: r.name_en,
    nameTh: r.name_th,
    descriptionEn: r.description_en,
    descriptionTh: r.description_th,
    category: r.category,
    pointsCost: r.points_cost,
    levelRequired: r.level_required ?? 0,
    stock: r.stock,
    redeemedCount: r.redeemed_count ?? 0,
    isUnlimited: r.is_unlimited,
    isActive: r.is_active,
  }));
}

export async function fetchMyRedemptions(memberId: string): Promise<RewardRedemption[]> {
  if (!memberId) return [];

  const { data, error } = await supabase
    .from('reward_redemptions')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((r: any) => ({
    id: r.id,
    memberId: r.member_id,
    rewardId: r.reward_id,
    pointsSpent: r.points_spent,
    status: r.status,
    createdAt: r.created_at,
  }));
}

export async function redeemReward(memberId: string, rewardId: string, pointsCost: number) {
  const idempotencyKey = `${memberId}-${rewardId}-${Date.now()}`;

  const { error } = await supabase
    .from('reward_redemptions')
    .insert({
      member_id: memberId,
      reward_id: rewardId,
      points_spent: pointsCost,
      idempotency_key: idempotencyKey,
      status: 'pending',
    });

  if (error) throw error;
}

// ─── Points History ─────────────────────────────────────────

export async function fetchPointsHistory(memberId: string): Promise<PointsLedgerEntry[]> {
  if (!memberId) return [];

  const { data, error } = await supabase
    .from('points_ledger')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    memberId: row.member_id,
    eventType: row.event_type,
    delta: row.delta,
    balanceAfter: row.balance_after,
    createdAt: row.created_at,
    metadata: row.metadata,
  }));
}

// ─── Squad ──────────────────────────────────────────────────

export async function fetchMySquad(memberId: string): Promise<SquadInfo | null> {
  if (!memberId) return null;

  const { data: membership } = await supabase
    .from('squad_memberships')
    .select('squad_id')
    .eq('member_id', memberId)
    .maybeSingle();

  if (!membership?.squad_id) return null;

  const { data: squad, error } = await supabase
    .from('squads')
    .select('*')
    .eq('id', membership.squad_id)
    .single();

  if (error || !squad) return null;

  const { data: members } = await supabase
    .from('squad_memberships')
    .select('*, member:members(first_name, last_name)')
    .eq('squad_id', squad.id);

  const memberList: SquadMemberInfo[] = (members ?? []).map((m: any) => ({
    id: m.id,
    memberId: m.member_id,
    role: m.role,
    joinedAt: m.joined_at,
    firstName: m.member?.first_name,
    lastName: m.member?.last_name,
  }));

  return {
    id: squad.id,
    name: squad.name,
    description: squad.description,
    totalXp: squad.total_xp,
    maxMembers: squad.max_members,
    isActive: squad.is_active,
    members: memberList,
  };
}

export async function fetchAvailableSquads(): Promise<SquadInfo[]> {
  const { data, error } = await supabase
    .from('squads')
    .select('*, squad_memberships(count)')
    .eq('is_active', true)
    .order('total_xp', { ascending: false })
    .limit(20);

  if (error) throw error;

  return (data ?? []).map((s: any) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    totalXp: s.total_xp,
    maxMembers: s.max_members,
    isActive: s.is_active,
    members: [],
  }));
}

export async function joinSquad(memberId: string, squadId: string) {
  const { error } = await supabase
    .from('squad_memberships')
    .insert({ member_id: memberId, squad_id: squadId, role: 'member' });

  if (error) throw error;
}

export async function leaveSquad(memberId: string) {
  const { error } = await supabase
    .from('squad_memberships')
    .delete()
    .eq('member_id', memberId);

  if (error) throw error;
}
