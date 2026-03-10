import { useQuery } from '@tanstack/react-query';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  fetchCoachImpactProfile,
  fetchPartnerReputationProfile,
  fetchTrainerQuests,
  fetchTrainerType,
} from '@/apps/trainer/features/impact/api';
import {
  COACH_LEVEL_CONFIG,
  PARTNER_TIER_CONFIG,
  type CoachLevel,
  type PartnerTier,
} from '@/apps/trainer/features/impact/types';
import { Users, TrendingUp, ClipboardCheck, Flame, Coins, Clock, Star, RefreshCw, Zap, ShieldCheck, Trophy, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

/* ------------------------------------------------------------------ */
/*  Tier thresholds for progress bars                                  */
/* ------------------------------------------------------------------ */
const COACH_THRESHOLDS: { level: CoachLevel; min: number }[] = [
  { level: 'rising', min: 0 },
  { level: 'established', min: 30 },
  { level: 'senior', min: 50 },
  { level: 'master', min: 70 },
  { level: 'elite_coach', min: 90 },
];

const PARTNER_THRESHOLDS: { tier: PartnerTier; min: number }[] = [
  { tier: 'new_partner', min: 0 },
  { tier: 'verified', min: 30 },
  { tier: 'preferred', min: 55 },
  { tier: 'premium_partner', min: 80 },
];

export default function TrainerImpactPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data: trainerType, isLoading: typeLoading } = useQuery({
    queryKey: ['trainer-type'],
    queryFn: fetchTrainerType,
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });

  const isCoach = (trainerType ?? 'in_house') === 'in_house';

  const { data: coachProfile, isLoading: coachLoading } = useQuery({
    queryKey: ['coach-impact-profile'],
    queryFn: fetchCoachImpactProfile,
    enabled: !!user && isCoach,
  });

  const { data: partnerProfile, isLoading: partnerLoading } = useQuery({
    queryKey: ['partner-reputation-profile'],
    queryFn: fetchPartnerReputationProfile,
    enabled: !!user && !isCoach,
  });

  const audienceType = isCoach ? 'trainer_inhouse' : 'trainer_freelance';
  const { data: quests } = useQuery({
    queryKey: ['trainer-quests', audienceType],
    queryFn: () => fetchTrainerQuests(audienceType as 'trainer_inhouse' | 'trainer_freelance'),
    enabled: !!user,
  });

  const isLoading = typeLoading || (isCoach ? coachLoading : partnerLoading);

  if (isLoading) {
    return (
      <div className="px-4 pt-3 space-y-4 animate-pulse">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    );
  }

  /* ---- Coach view ---- */
  if (isCoach && coachProfile) {
    const cfg = COACH_LEVEL_CONFIG[coachProfile.coach_level];
    const currentIdx = COACH_THRESHOLDS.findIndex(t => t.level === coachProfile.coach_level);
    const nextThreshold = COACH_THRESHOLDS[currentIdx + 1];
    const currentMin = COACH_THRESHOLDS[currentIdx]?.min ?? 0;
    const nextMin = nextThreshold?.min ?? 100;
    const tierProgress = ((coachProfile.impact_score - currentMin) / (nextMin - currentMin)) * 100;

    const metrics = [
      { label: t('trainer.classes'), value: coachProfile.total_classes_taught, icon: Users },
      { label: t('trainer.attendance'), value: `${Math.round(coachProfile.avg_attendance_rate)}%`, icon: TrendingUp },
      { label: t('trainer.returnRate'), value: `${Math.round(coachProfile.member_return_rate)}%`, icon: ClipboardCheck },
      { label: t('trainer.streak'), value: `${coachProfile.current_streak_weeks}w`, icon: Flame },
    ];

    return (
      <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
        <MobilePageHeader title={t('trainer.coachImpactTitle')} subtitle={t('trainer.impactSubtitle')} />

        {/* Hero */}
        <Section className="mb-4">
          <div className="rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-lg)' }}>
            <div className="h-1.5" style={{ backgroundColor: `hsl(var(${cfg.colorVar}))` }} />
            <div className="bg-card p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <span
                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold"
                    style={{
                      backgroundColor: `hsl(var(${cfg.colorVar}) / 0.15)`,
                      color: `hsl(var(${cfg.colorVar}))`,
                    }}
                  >
                    {cfg.label}
                  </span>
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600">
                    <Coins className="h-3 w-3" />
                    {coachProfile.coin_balance}
                  </span>
                </div>
                <ScoreCircle score={coachProfile.impact_score} colorVar={cfg.colorVar} />
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-4 gap-2">
                {metrics.map(m => {
                  const Icon = m.icon;
                  return (
                    <div key={m.label} className="text-center rounded-xl bg-card/60 py-2.5 px-1 border border-border/50">
                      <Icon className="h-4 w-4 mx-auto mb-1.5" style={{ color: `hsl(var(${cfg.colorVar}))` }} />
                      <p className="text-sm font-bold text-foreground tabular-nums">{m.value}</p>
                      <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">{m.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Section>

        {/* Tier Progress */}
        {nextThreshold && (
          <Section title={t('trainer.tierProgress')} className="mb-4">
            <div className="rounded-2xl bg-card p-4 border border-border/50">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-foreground">{cfg.label}</span>
                <span className="text-muted-foreground">
                  {t('trainer.nextTier')}: {COACH_LEVEL_CONFIG[nextThreshold.level].label}
                </span>
              </div>
              <Progress value={Math.min(tierProgress, 100)} className="h-2" />
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {t('trainer.impactScore')}: {coachProfile.impact_score} / {nextMin}
              </p>
            </div>
          </Section>
        )}

        {/* Badges link */}
        <BadgesLink t={t} />

        {/* Quests */}
        <QuestsSection quests={quests} t={t} />

        {/* Score History Placeholder */}
        <ScoreHistoryPlaceholder t={t} />
      </div>
    );
  }

  /* ---- Partner / Freelance view ---- */
  if (!isCoach && partnerProfile) {
    const cfg = PARTNER_TIER_CONFIG[partnerProfile.partner_tier];
    const currentIdx = PARTNER_THRESHOLDS.findIndex(t => t.tier === partnerProfile.partner_tier);
    const nextThreshold = PARTNER_THRESHOLDS[currentIdx + 1];
    const currentMin = PARTNER_THRESHOLDS[currentIdx]?.min ?? 0;
    const nextMin = nextThreshold?.min ?? 100;
    const tierProgress = ((partnerProfile.reputation_score - currentMin) / (nextMin - currentMin)) * 100;

    const metrics = [
      { label: t('trainer.sessions'), value: partnerProfile.total_sessions, icon: Users },
      { label: t('trainer.punctuality'), value: `${Math.round(partnerProfile.punctuality_rate)}%`, icon: Clock },
      { label: t('trainer.repeat'), value: `${Math.round(partnerProfile.repeat_booking_rate)}%`, icon: RefreshCw },
      { label: t('trainer.rating'), value: partnerProfile.avg_rating.toFixed(1), icon: Star },
    ];

    return (
      <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
        <MobilePageHeader title={t('trainer.partnerReputationTitle')} subtitle={t('trainer.reputationSubtitle')} />

        {/* Hero */}
        <Section className="mb-4">
          <div className="rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-lg)' }}>
            <div className="h-1.5" style={{ backgroundColor: `hsl(var(${cfg.colorVar}))` }} />
            <div className="bg-card p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <span
                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold"
                    style={{
                      backgroundColor: `hsl(var(${cfg.colorVar}) / 0.15)`,
                      color: `hsl(var(${cfg.colorVar}))`,
                    }}
                  >
                    {cfg.label}
                  </span>
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600">
                    <Coins className="h-3 w-3" />
                    {partnerProfile.coin_balance}
                  </span>
                  {partnerProfile.is_verified && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600">
                      <ShieldCheck className="h-3 w-3" />
                      {t('trainer.verified')}
                    </span>
                  )}
                </div>
                <ScoreCircle score={partnerProfile.reputation_score} colorVar={cfg.colorVar} />
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-4 gap-2">
                {metrics.map(m => {
                  const Icon = m.icon;
                  return (
                    <div key={m.label} className="text-center rounded-xl bg-card/60 py-2.5 px-1 border border-border/50">
                      <Icon className="h-4 w-4 mx-auto mb-1.5" style={{ color: `hsl(var(${cfg.colorVar}))` }} />
                      <p className="text-sm font-bold text-foreground tabular-nums">{m.value}</p>
                      <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">{m.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Section>

        {/* Tier Progress */}
        {nextThreshold && (
          <Section title={t('trainer.tierProgress')} className="mb-4">
            <div className="rounded-2xl bg-card p-4 border border-border/50">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-foreground">{cfg.label}</span>
                <span className="text-muted-foreground">
                  {t('trainer.nextTier')}: {PARTNER_TIER_CONFIG[nextThreshold.tier].label}
                </span>
              </div>
              <Progress value={Math.min(tierProgress, 100)} className="h-2" />
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {t('trainer.reputationScore')}: {partnerProfile.reputation_score} / {nextMin}
              </p>
            </div>
          </Section>
        )}

        {/* Quests */}
        <QuestsSection quests={quests} t={t} />

        {/* Score History Placeholder */}
        <ScoreHistoryPlaceholder t={t} />
      </div>
    );
  }

  /* ---- No data ---- */
  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <MobilePageHeader title={t('trainer.coachImpactTitle')} />
      <Section className="mb-4">
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">{t('trainer.noImpactData')}</p>
        </div>
      </Section>
    </div>
  );
}

/* ================================================================== */
/*  Sub-components                                                     */
/* ================================================================== */

function ScoreCircle({ score, colorVar }: { score: number; colorVar: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const scoreAngle = (score / 100) * 270;
  const arcLength = (scoreAngle / 360) * circumference;

  return (
    <div className="relative h-20 w-20 flex items-center justify-center">
      <div
        className="absolute inset-0 rounded-full blur-lg opacity-20"
        style={{ backgroundColor: `hsl(var(${colorVar}))` }}
      />
      <svg className="absolute inset-0 -rotate-[135deg]" viewBox="0 0 80 80">
        <circle
          cx="40" cy="40" r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="5"
          strokeDasharray={`${(270 / 360) * circumference} ${circumference}`}
          strokeLinecap="round"
        />
        <circle
          cx="40" cy="40" r={radius}
          fill="none"
          stroke={`hsl(var(${colorVar}))`}
          strokeWidth="6"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
          className="transition-all duration-1000"
          style={{ filter: `drop-shadow(0 0 4px hsl(var(${colorVar}) / 0.5))` }}
        />
      </svg>
      <span className="text-xl font-black text-foreground tabular-nums">{score}</span>
    </div>
  );
}

function QuestsSection({ quests, t }: { quests: any[] | undefined; t: any }) {
  if (!quests?.length) {
    return (
      <Section title={t('trainer.trainerQuests')} className="mb-4">
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">{t('trainer.noQuestsAvailable')}</p>
        </div>
      </Section>
    );
  }

  return (
    <Section title={t('trainer.trainerQuests')} className="mb-4">
      <div className="space-y-2">
        {quests.map(q => (
          <div key={q.id} className="flex items-center justify-between rounded-xl bg-card p-3.5 border border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{q.name_en}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{q.quest_period}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-primary">+{q.xp_reward} XP</p>
              <p className="text-[10px] text-amber-600 font-medium">+{q.coin_reward} Coin</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function ScoreHistoryPlaceholder({ t }: { t: any }) {
  return (
    <Section title={t('trainer.scoreBreakdown')} className="mb-4">
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">{t('trainer.scoreHistoryComingSoon')}</p>
      </div>
    </Section>
  );
}
