export type MomentumTier = 'starter' | 'regular' | 'dedicated' | 'elite' | 'champion' | 'legend';

export interface MomentumProfile {
  memberId: string;
  totalXp: number;
  level: number;
  tier: MomentumTier;
  currentStreak: number;
  longestStreak: number;
  availablePoints: number;
  totalPoints: number;
  weeklyCheckinDays: number[];
}

export interface MemberBadgeEarning {
  id: string;
  memberId: string;
  badgeId: string;
  earnedAt: string;
  badge?: {
    id: string;
    nameEn: string;
    nameTh: string | null;
    descriptionEn: string | null;
    tier: string;
    iconUrl: string | null;
  };
}

export interface RewardItem {
  id: string;
  nameEn: string;
  nameTh: string | null;
  descriptionEn: string | null;
  descriptionTh: string | null;
  category: string;
  pointsCost: number;
  levelRequired: number;
  stock: number | null;
  redeemedCount: number;
  isUnlimited: boolean;
  isActive: boolean;
}

export interface RewardRedemption {
  id: string;
  memberId: string;
  rewardId: string;
  pointsSpent: number;
  status: string;
  createdAt: string;
}

export interface PointsLedgerEntry {
  id: string;
  memberId: string;
  eventType: string;
  delta: number;
  balanceAfter: number;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

export interface SquadInfo {
  id: string;
  name: string;
  description: string | null;
  totalXp: number;
  maxMembers: number;
  isActive: boolean;
  members: SquadMemberInfo[];
}

export interface SquadMemberInfo {
  id: string;
  memberId: string;
  role: string;
  joinedAt: string;
  firstName?: string;
  lastName?: string;
}

export interface BadgeDefinition {
  id: string;
  nameEn: string;
  nameTh: string | null;
  descriptionEn: string | null;
  tier: string;
  iconUrl: string | null;
  unlockCondition: Record<string, unknown>;
  displayPriority: number;
}

export interface ChallengeProgressEntry {
  id: string;
  challengeId: string;
  memberId: string;
  currentValue: number;
  status: string;
  completedAt: string | null;
  challenge?: {
    id: string;
    nameEn: string;
    goalValue: number;
    goalType: string;
    rewardXp: number;
    rewardPoints: number;
    status: string;
  };
}

export const TIER_CONFIG: Record<MomentumTier, { label: string; colorVar: string; minLevel: number }> = {
  starter: { label: 'Starter', colorVar: '--tier-starter', minLevel: 1 },
  regular: { label: 'Regular', colorVar: '--tier-regular', minLevel: 10 },
  dedicated: { label: 'Dedicated', colorVar: '--tier-dedicated', minLevel: 20 },
  elite: { label: 'Elite', colorVar: '--tier-elite', minLevel: 30 },
  champion: { label: 'Champion', colorVar: '--tier-champion', minLevel: 40 },
  legend: { label: 'Legend', colorVar: '--tier-legend', minLevel: 50 },
};

/** XP needed to reach a given level */
export function xpForLevel(level: number): number {
  return level * level * 100;
}

/** Derive tier from level */
export function tierFromLevel(level: number): MomentumTier {
  if (level >= 50) return 'legend';
  if (level >= 40) return 'champion';
  if (level >= 30) return 'elite';
  if (level >= 20) return 'dedicated';
  if (level >= 10) return 'regular';
  return 'starter';
}
