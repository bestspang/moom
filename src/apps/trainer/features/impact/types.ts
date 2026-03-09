export type CoachLevel = 'rising' | 'established' | 'senior' | 'master' | 'elite_coach';
export type PartnerTier = 'new_partner' | 'verified' | 'preferred' | 'premium_partner';

export interface CoachImpactProfile {
  id: string;
  staff_id: string;
  impact_score: number;
  coach_level: CoachLevel;
  total_classes_taught: number;
  avg_attendance_rate: number;
  member_return_rate: number;
  pt_log_completion_rate: number;
  current_streak_weeks: number;
}

export interface PartnerReputationProfile {
  id: string;
  staff_id: string;
  reputation_score: number;
  partner_tier: PartnerTier;
  total_sessions: number;
  punctuality_rate: number;
  repeat_booking_rate: number;
  avg_rating: number;
  cancellation_rate: number;
  is_verified: boolean;
}

export const COACH_LEVEL_CONFIG: Record<CoachLevel, { label: string; colorVar: string }> = {
  rising: { label: 'Rising', colorVar: '--coach-rising' },
  established: { label: 'Established', colorVar: '--coach-established' },
  senior: { label: 'Senior', colorVar: '--coach-senior' },
  master: { label: 'Master', colorVar: '--coach-master' },
  elite_coach: { label: 'Elite Coach', colorVar: '--coach-elite' },
};

export const PARTNER_TIER_CONFIG: Record<PartnerTier, { label: string; colorVar: string }> = {
  new_partner: { label: 'New Partner', colorVar: '--partner-new' },
  verified: { label: 'Verified', colorVar: '--partner-verified' },
  preferred: { label: 'Preferred', colorVar: '--partner-preferred' },
  premium_partner: { label: 'Premium Partner', colorVar: '--partner-premium' },
};
