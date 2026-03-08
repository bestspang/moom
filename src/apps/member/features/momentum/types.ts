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
