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

  // Auto-provision a starter profile if none exists yet
  if (!data) {
    const { data: upserted, error: upsertErr } = await supabase
      .from('member_gamification_profiles')
      .upsert({
        member_id: memberId,
        total_xp: 0,
        current_level: 1,
        current_streak: 0,
        longest_streak: 0,
        available_points: 0,
        total_points: 0,
      }, { onConflict: 'member_id' })
      .select()
      .maybeSingle();

    if (upsertErr || !upserted) {
      // Fallback: return in-memory starter profile
      return {
        memberId,
        totalXp: 0,
        level: 1,
        tier: tierFromLevel(1),
        currentStreak: 0,
        longestStreak: 0,
        availablePoints: 0,
        totalPoints: 0,
        weeklyCheckinDays: [],
      };
    }

    return {
      memberId: upserted.member_id,
      totalXp: upserted.total_xp,
      level: upserted.current_level,
      tier: tierFromLevel(upserted.current_level),
      currentStreak: upserted.current_streak,
      longestStreak: upserted.longest_streak,
      availablePoints: upserted.available_points,
      totalPoints: upserted.total_points,
      weeklyCheckinDays: [],
    };
  }

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
    memberCount: s.squad_memberships?.[0]?.count ?? 0,
  }));
}

export interface SquadContribution {
  memberId: string;
  firstName: string;
  lastName: string;
  totalXp: number;
}

export async function fetchSquadContributions(squadId: string): Promise<SquadContribution[]> {
  // Get squad member IDs
  const { data: memberships, error: mErr } = await supabase
    .from('squad_memberships')
    .select('member_id, member:members(first_name, last_name)')
    .eq('squad_id', squadId);

  if (mErr) throw mErr;
  if (!memberships?.length) return [];

  const memberIds = memberships.map((m: any) => m.member_id);

  // Get XP for each member
  const { data: profiles, error: pErr } = await supabase
    .from('member_gamification_profiles')
    .select('member_id, total_xp')
    .in('member_id', memberIds);

  if (pErr) throw pErr;

  const xpMap = new Map<string, number>();
  for (const p of (profiles ?? [])) {
    xpMap.set(p.member_id, p.total_xp);
  }

  return memberships
    .map((m: any) => ({
      memberId: m.member_id,
      firstName: m.member?.first_name ?? '',
      lastName: m.member?.last_name ?? '',
      totalXp: xpMap.get(m.member_id) ?? 0,
    }))
    .sort((a: SquadContribution, b: SquadContribution) => b.totalXp - a.totalXp);
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
  currentStreak?: number;
  checkInCount?: number;
}

export type LeaderboardTimeWindow = 'all' | 'month' | 'week';

function getSinceDate(window: LeaderboardTimeWindow): string | null {
  if (window === 'all') return null;
  const now = new Date();
  if (window === 'month') {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01T00:00:00+07:00`;
  }
  // week: Monday of current week
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = 0 offset
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const d = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}T00:00:00+07:00`;
}

export async function fetchXpLeaderboard(): Promise<LeaderboardEntry[]> {
  return fetchXpLeaderboardByWindow('all');
}

export async function fetchXpLeaderboardByWindow(window: LeaderboardTimeWindow): Promise<LeaderboardEntry[]> {
  if (window === 'all') {
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

  const since = getSinceDate(window)!;
  const { data, error } = await supabase.rpc('get_xp_leaderboard', {
    p_since: since,
    p_limit: 20,
  });

  if (error) throw error;

  return (data ?? []).map((row: any, idx: number) => ({
    memberId: row.member_id,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    avatarUrl: row.avatar_url ?? null,
    totalXp: Number(row.sum_xp),
    level: row.current_level,
    rank: idx + 1,
  }));
}

export async function fetchStreakLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('member_gamification_profiles')
    .select('member_id, total_xp, current_level, current_streak, member:members(first_name, last_name, avatar_url)')
    .gt('current_streak', 0)
    .order('current_streak', { ascending: false })
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
    currentStreak: row.current_streak,
  }));
}

export async function fetchAttendanceLeaderboard(): Promise<LeaderboardEntry[]> {
  return fetchAttendanceLeaderboardByWindow('month');
}

export async function fetchAttendanceLeaderboardByWindow(window: LeaderboardTimeWindow): Promise<LeaderboardEntry[]> {
  const since = window === 'all' ? null : getSinceDate(window);

  let query = supabase
    .from('member_attendance')
    .select('member_id, members(first_name, last_name, avatar_url)');

  if (since) {
    query = query.gte('check_in_time', since);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Aggregate by member
  const countMap = new Map<string, { count: number; member: any }>();
  for (const row of (data ?? []) as any[]) {
    const existing = countMap.get(row.member_id);
    if (existing) {
      existing.count++;
    } else {
      countMap.set(row.member_id, { count: 1, member: row.members });
    }
  }

  // Sort and return top 20
  const sorted = [...countMap.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20);

  return sorted.map(([memberId, { count, member }], idx) => ({
    memberId,
    firstName: member?.first_name ?? '',
    lastName: member?.last_name ?? '',
    avatarUrl: member?.avatar_url ?? null,
    totalXp: 0,
    level: 0,
    rank: idx + 1,
    checkInCount: count,
  }));
}

// ─── Streak Around Me ───────────────────────────────────────

export async function fetchStreakAroundMe(memberId: string): Promise<LeaderboardEntry[]> {
  if (!memberId) return [];

  const { data, error } = await supabase.rpc('get_streak_around_me', {
    p_member_id: memberId,
    p_range: 2,
  });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    memberId: row.member_id,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    avatarUrl: row.avatar_url ?? null,
    totalXp: Number(row.total_xp),
    level: row.current_level,
    rank: Number(row.rank),
    currentStreak: row.current_streak,
  }));
}

export async function fetchAroundMeLeaderboard(memberId: string): Promise<LeaderboardEntry[]> {
  return fetchAroundMeByWindow(memberId, 'all');
}

export async function fetchAroundMeByWindow(memberId: string, window: LeaderboardTimeWindow): Promise<LeaderboardEntry[]> {
  if (!memberId) return [];

  if (window === 'all') {
    // Original logic using profiles table
    const { data: myProfile } = await supabase
      .from('member_gamification_profiles')
      .select('total_xp')
      .eq('member_id', memberId)
      .maybeSingle();

    if (!myProfile) return [];

    const myXp = myProfile.total_xp;

    const { data: above } = await supabase
      .from('member_gamification_profiles')
      .select('member_id, total_xp, current_level, member:members(first_name, last_name, avatar_url)')
      .gt('total_xp', myXp)
      .order('total_xp', { ascending: true })
      .limit(5);

    const { data: below } = await supabase
      .from('member_gamification_profiles')
      .select('member_id, total_xp, current_level, member:members(first_name, last_name, avatar_url)')
      .lt('total_xp', myXp)
      .order('total_xp', { ascending: false })
      .limit(5);

    const { data: me } = await supabase
      .from('member_gamification_profiles')
      .select('member_id, total_xp, current_level, member:members(first_name, last_name, avatar_url)')
      .eq('member_id', memberId);

    const { count: aboveCount } = await supabase
      .from('member_gamification_profiles')
      .select('member_id', { count: 'exact', head: true })
      .gt('total_xp', myXp);

    const myRank = (aboveCount ?? 0) + 1;

    const combined = [
      ...((above ?? []).reverse()),
      ...(me ?? []),
      ...(below ?? []),
    ];

    return combined.map((row: any, idx: number) => ({
      memberId: row.member_id,
      firstName: row.member?.first_name ?? '',
      lastName: row.member?.last_name ?? '',
      avatarUrl: row.member?.avatar_url ?? null,
      totalXp: row.total_xp,
      level: row.current_level,
      rank: myRank - ((above ?? []).length) + idx,
    }));
  }

  // For week/month windows, use RPC to get a larger set and find user position
  const since = getSinceDate(window)!;
  const { data, error } = await supabase.rpc('get_xp_leaderboard', {
    p_since: since,
    p_limit: 200,
  });

  if (error) throw error;
  if (!data?.length) return [];

  const rows = data as any[];
  const myIdx = rows.findIndex((r: any) => r.member_id === memberId);
  if (myIdx === -1) return [];

  const start = Math.max(0, myIdx - 5);
  const end = Math.min(rows.length, myIdx + 6);
  const slice = rows.slice(start, end);

  return slice.map((row: any, idx: number) => ({
    memberId: row.member_id,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    avatarUrl: row.avatar_url ?? null,
    totalXp: Number(row.sum_xp),
    level: row.current_level,
    rank: start + idx + 1,
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
  // Quest-based stats (replaced legacy challenge_progress)
  const { data: templates, error: tErr } = await supabase
    .from('quest_templates')
    .select('id, name_en')
    .eq('is_active', true)
    .in('quest_period', ['monthly', 'seasonal'])
    .order('sort_order', { ascending: true })
    .limit(20);

  if (tErr) throw tErr;
  if (!templates?.length) return [];

  const templateIds = templates.map(t => t.id);

  const { data: instances, error: iErr } = await supabase
    .from('quest_instances')
    .select('quest_template_id, member_id, status')
    .in('quest_template_id', templateIds)
    .in('status', ['completed', 'claimed']);

  if (iErr) throw iErr;

  const countMap: Record<string, number> = {};
  const userCompleted = new Set<string>();
  for (const inst of (instances ?? [])) {
    countMap[inst.quest_template_id] = (countMap[inst.quest_template_id] ?? 0) + 1;
    if (memberId && inst.member_id === memberId) {
      userCompleted.add(inst.quest_template_id);
    }
  }

  return templates.map(t => ({
    challengeId: t.id,
    nameEn: t.name_en,
    completedCount: countMap[t.id] ?? 0,
    currentUserCompleted: userCompleted.has(t.id),
  }));
}

// ─── Squad Activity Feed ────────────────────────────────────

export interface SquadActivityEntry {
  auditLogId: string;
  memberId: string;
  firstName: string | null;
  avatarUrl: string | null;
  eventType: string;
  actionKey: string | null;
  xpDelta: number;
  createdAt: string;
}

export async function fetchSquadActivityFeed(squadId: string, limit = 15): Promise<SquadActivityEntry[]> {
  const { data, error } = await supabase.rpc('get_squad_activity_feed', {
    p_squad_id: squadId,
    p_limit: limit,
  });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    auditLogId: r.audit_log_id,
    memberId: r.member_id,
    firstName: r.first_name,
    avatarUrl: r.avatar_url,
    eventType: r.event_type,
    actionKey: r.action_key,
    xpDelta: r.xp_delta,
    createdAt: r.created_at,
  }));
}

// ─── Squad Feed Reactions ───────────────────────────────────

export interface FeedReaction {
  count: number;
  reactedByMe: boolean;
}

export async function fetchSquadFeedReactions(auditLogIds: string[]): Promise<Map<string, FeedReaction>> {
  if (!auditLogIds.length) return new Map();

  const { data, error } = await (supabase.rpc as any)('get_squad_feed_reactions', {
    p_audit_log_ids: auditLogIds,
  });
  if (error) throw error;

  const map = new Map<string, FeedReaction>();
  for (const r of (data ?? []) as any[]) {
    map.set(r.audit_log_id, {
      count: Number(r.reaction_count),
      reactedByMe: !!r.reacted_by_me,
    });
  }
  return map;
}

export async function toggleSquadFeedReaction(auditLogId: string): Promise<FeedReaction> {
  const { data, error } = await (supabase.rpc as any)('toggle_squad_feed_reaction', {
    p_audit_log_id: auditLogId,
  });
  if (error) throw error;
  const row = (data as any)?.[0] ?? data;
  return {
    count: Number(row?.new_count ?? 0),
    reactedByMe: !!row?.reacted,
  };
}

// ─── Level Benefits & Prestige ──────────────────────────────

export interface LevelBenefit {
  id: string;
  levelNumber: number;
  benefitCode: string;
  benefitType: string;
  frequency: string;
  descriptionEn: string;
  descriptionTh: string | null;
  businessCost: string;
}

export async function fetchLevelBenefits(): Promise<LevelBenefit[]> {
  const { data, error } = await supabase
    .from('level_benefits')
    .select('*')
    .eq('is_active', true)
    .order('level_number', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((r: any) => ({
    id: r.id,
    levelNumber: r.level_number,
    benefitCode: r.benefit_code,
    benefitType: r.benefit_type,
    frequency: r.frequency,
    descriptionEn: r.description_en,
    descriptionTh: r.description_th,
    businessCost: r.business_cost,
  }));
}

export interface PrestigeCriterion {
  code: string;
  met: boolean;
  current: number;
  target: number;
  descriptionEn: string;
}

export interface PrestigeEligibility {
  eligible: boolean;
  criteria: PrestigeCriterion[];
}

export async function fetchPrestigeEligibility(memberId: string, targetLevel: number): Promise<PrestigeEligibility | null> {
  if (targetLevel < 18 || targetLevel > 20) return null;

  const { data, error } = await supabase.rpc('check_prestige_eligibility', {
    p_member_id: memberId,
    p_target_level: targetLevel,
  });

  if (error) throw error;
  if (!data) return null;

  return {
    eligible: data.eligible,
    criteria: (data.criteria ?? []).map((c: any) => ({
      code: c.code,
      met: c.met,
      current: c.current,
      target: c.target,
      descriptionEn: c.description_en,
    })),
  };
}

export interface PrestigeCriteriaRow {
  levelNumber: number;
  criterionCode: string;
  criterionType: string;
  targetValue: number;
  descriptionEn: string;
  descriptionTh: string | null;
}

export async function fetchPrestigeCriteria(): Promise<PrestigeCriteriaRow[]> {
  const { data, error } = await supabase
    .from('prestige_criteria')
    .select('*')
    .eq('is_active', true)
    .order('level_number', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((r: any) => ({
    levelNumber: r.level_number,
    criterionCode: r.criterion_code,
    criterionType: r.criterion_type,
    targetValue: r.target_value,
    descriptionEn: r.description_en,
    descriptionTh: r.description_th,
  }));
}
