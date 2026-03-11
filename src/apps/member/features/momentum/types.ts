export type MomentumTier = 'starter' | 'mover' | 'strong' | 'elite' | 'legend';

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
    badgeType?: string;
    effectType?: string;
    effectValue?: Record<string, unknown>;
    durationDays?: number | null;
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
  cashPrice?: number;
  rewardType?: string;
  requiredBadgeId?: string | null;
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
  memberCount?: number;
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
  badgeType?: string;
  effectType?: string;
  effectValue?: Record<string, unknown>;
  durationDays?: number | null;
}


export const TIER_CONFIG: Record<MomentumTier, { label: string; colorVar: string; minLevel: number }> = {
  starter: { label: 'Starter', colorVar: '--tier-starter', minLevel: 1 },
  mover: { label: 'Mover', colorVar: '--tier-mover', minLevel: 4 },
  strong: { label: 'Strong', colorVar: '--tier-strong', minLevel: 7 },
  elite: { label: 'Elite', colorVar: '--tier-elite', minLevel: 11 },
  legend: { label: 'Legend', colorVar: '--tier-legend', minLevel: 15 },
};

/**
 * XP thresholds from gamification_levels table (v1 economy spec).
 * Index = level number (0 = not yet level 1, 1..20 = actual levels).
 */
const XP_THRESHOLDS: number[] = [
  0,      // level 0 (placeholder)
  0,      // level 1: Starter I
  100,    // level 2: Starter II
  240,    // level 3: Starter III
  420,    // level 4: Mover I
  650,    // level 5: Mover II
  930,    // level 6: Mover III
  1260,   // level 7: Strong I
  1650,   // level 8: Strong II
  2100,   // level 9: Strong III
  2620,   // level 10: Strong IV
  3210,   // level 11: Elite I
  3870,   // level 12: Elite II
  4600,   // level 13: Elite III
  5400,   // level 14: Elite IV
  6280,   // level 15: Legend I
  7240,   // level 16: Legend II
  8280,   // level 17: Legend III
  9400,   // level 18: Apex Access (prestige)
  10900,  // level 19: Inner Circle (prestige)
  12600,  // level 20: Legend Circle (prestige)
];

/** XP needed to reach a given level (from DB lookup table) */
export function xpForLevel(level: number): number {
  if (level <= 0) return 0;
  if (level >= XP_THRESHOLDS.length) return XP_THRESHOLDS[XP_THRESHOLDS.length - 1];
  return XP_THRESHOLDS[level];
}

/** Derive tier from level (v1 economy spec) */
export function tierFromLevel(level: number): MomentumTier {
  if (level >= 15) return 'legend';
  if (level >= 11) return 'elite';
  if (level >= 7) return 'strong';
  if (level >= 4) return 'mover';
  return 'starter';
}
