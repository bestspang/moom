import { supabase } from '@/integrations/supabase/client';
import type {
  MomentumProfile, MemberBadgeEarning, RewardItem, RewardRedemption,
  PointsLedgerEntry, SquadInfo, SquadMemberInfo, BadgeDefinition,
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
        badgeType: b.badge_type,
        effectType: b.effect_type,
        effectValue: b.effect_value,
        durationDays: b.duration_days,
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
    badgeType: b.badge_type,
    effectType: b.effect_type,
    effectValue: b.effect_value,
    durationDays: b.duration_days,
  }));
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
    cashPrice: r.cash_price ?? 0,
    rewardType: r.reward_type ?? 'digital',
    requiredBadgeId: r.required_badge_id,
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

export async function redeemReward(memberId: string, rewardId: string, _pointsCost: number) {
  const idempotencyKey = `${memberId}-${rewardId}-${Date.now()}`;

  const { data, error } = await supabase.functions.invoke('gamification-redeem-reward', {
    body: {
      reward_id: rewardId,
      member_id: memberId,
      idempotency_key: idempotencyKey,
    },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
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

// ─── Quest Instances ────────────────────────────────────────

export interface QuestInstance {
  id: string;
  memberId: string;
  questTemplateId: string;
  startAt: string;
  endAt: string;
  progressValue: number;
  status: string;
  claimedAt: string | null;
  template: {
    id: string;
    nameEn: string;
    nameTh: string | null;
    descriptionEn: string | null;
    questPeriod: string;
    goalValue: number;
    goalType: string;
    xpReward: number;
    coinReward: number;
  } | null;
}

export async function fetchMyQuests(memberId: string): Promise<QuestInstance[]> {
  if (!memberId) return [];

  const { data, error } = await supabase
    .from('quest_instances')
    .select('*, quest_templates(*)')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;

  return (data ?? []).map((row: any) => {
    const t = row.quest_templates;
    return {
      id: row.id,
      memberId: row.member_id,
      questTemplateId: row.quest_template_id,
      startAt: row.start_at,
      endAt: row.end_at,
      progressValue: row.progress_value,
      status: row.status,
      claimedAt: row.claimed_at,
      template: t ? {
        id: t.id,
        nameEn: t.name_en,
        nameTh: t.name_th,
        descriptionEn: t.description_en,
        questPeriod: t.quest_period,
        goalValue: t.goal_value,
        goalType: t.goal_type,
        xpReward: t.xp_reward,
        coinReward: t.coin_reward,
      } : null,
    };
  });
}

export async function assignQuests(memberId: string, period: 'daily' | 'weekly'): Promise<QuestInstance[]> {
  const { data, error } = await supabase.functions.invoke('gamification-assign-quests', {
    body: { member_id: memberId, period },
  });

  if (error) throw error;
  return data?.quests ?? [];
}

export async function claimQuest(memberId: string, questInstanceId: string) {
  const { data, error } = await supabase.functions.invoke('gamification-claim-quest', {
    body: { member_id: memberId, quest_instance_id: questInstanceId },
  });

  if (error) throw error;
  return data;
}

// ─── Coupon Wallet ──────────────────────────────────────────

export interface CouponWalletItem {
  id: string;
  memberId: string;
  couponTemplateId: string;
  issuedAt: string;
  expiresAt: string;
  usedAt: string | null;
  status: string;
  sourceType: string | null;
  template: {
    id: string;
    nameEn: string;
    nameTh: string | null;
    discountType: string;
    discountValue: number;
    maxDiscount: number | null;
    minSpend: number;
    appliesTo: string;
  } | null;
}

export async function fetchMyCoupons(memberId: string): Promise<CouponWalletItem[]> {
  if (!memberId) return [];

  const { data, error } = await supabase
    .from('coupon_wallet')
    .select('*, coupon_templates(*)')
    .eq('member_id', memberId)
    .order('issued_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => {
    const t = row.coupon_templates;
    return {
      id: row.id,
      memberId: row.member_id,
      couponTemplateId: row.coupon_template_id,
      issuedAt: row.issued_at,
      expiresAt: row.expires_at,
      usedAt: row.used_at,
      status: row.status,
      sourceType: row.source_type,
      template: t ? {
        id: t.id,
        nameEn: t.name_en,
        nameTh: t.name_th,
        discountType: t.discount_type,
        discountValue: t.discount_value,
        maxDiscount: t.max_discount,
        minSpend: t.min_spend,
        appliesTo: t.applies_to,
      } : null,
    };
  });
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

// ─── Leaderboard ────────────────────────────────────────────

export interface LeaderboardEntry {
  memberId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  totalXp: number;
  level: number;
  rank: number;
}

export async function fetchXpLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('member_gamification_profiles')
    .select('member_id, total_xp, current_level, member:members(first_name, last_name, avatar_url)')
    .order('total_xp', { ascending: false })
    .limit(20);

  if (error) throw error;

  return (data ?? []).map((row: any, idx: number) => ({
    memberId: row.member_id,
    firstName: row.member?.first_name ?? '',
    lastName: row.member?.last_name ?? '',
    avatarUrl: row.member?.avatar_url ?? null,
    totalXp: row.total_xp,
    level: row.current_level,
    rank: idx + 1,
  }));
}

export async function fetchSquadRankings(): Promise<SquadInfo[]> {
  const { data, error } = await supabase
    .from('squads')
    .select('*, squad_memberships(count)')
    .eq('is_active', true)
    .order('total_xp', { ascending: false })
    .limit(10);

  if (error) throw error;

  return (data ?? []).map((s: any) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    totalXp: s.total_xp,
    maxMembers: s.max_members,
    isActive: s.is_active,
    members: [],
    memberCount: s.squad_memberships?.[0]?.count ?? 0,
  }));
}

export interface ChallengeCompletionStat {
  challengeId: string;
  nameEn: string;
  completedCount: number;
  currentUserCompleted: boolean;
}

export async function fetchChallengeCompletionStats(memberId: string | null): Promise<ChallengeCompletionStat[]> {
  const { data: challenges, error: cErr } = await supabase
    .from('gamification_challenges')
    .select('id, name_en, status')
    .in('status', ['active', 'completed'])
    .order('end_date', { ascending: false })
    .limit(20);

  if (cErr) throw cErr;
  if (!challenges?.length) return [];

  const challengeIds = challenges.map(c => c.id);

  const { data: progress, error: pErr } = await supabase
    .from('challenge_progress')
    .select('challenge_id, member_id, status')
    .in('challenge_id', challengeIds)
    .eq('status', 'completed');

  if (pErr) throw pErr;

  const countMap: Record<string, number> = {};
  const userCompleted = new Set<string>();
  for (const p of (progress ?? [])) {
    countMap[p.challenge_id] = (countMap[p.challenge_id] ?? 0) + 1;
    if (memberId && p.member_id === memberId) {
      userCompleted.add(p.challenge_id);
    }
  }

  return challenges.map(c => ({
    challengeId: c.id,
    nameEn: c.name_en,
    completedCount: countMap[c.id] ?? 0,
    currentUserCompleted: userCompleted.has(c.id),
  }));
}
