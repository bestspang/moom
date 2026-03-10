import { useQuery } from '@tanstack/react-query';
import { fetchAllBadges, fetchMyBadges, fetchMomentumProfile } from './api';
import { Award, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BadgeDefinition } from './types';
import { useTranslation } from 'react-i18next';

interface UpcomingMilestonesProps {
  memberId: string;
  className?: string;
  max?: number;
  nudgeOnly?: boolean;
}

interface MilestoneProgress {
  badge: BadgeDefinition;
  current: number;
  target: number;
  percent: number;
  remaining: number;
}

function getBadgeTarget(badge: BadgeDefinition): { type: string; value: number } {
  const cond = badge.unlockCondition as Record<string, any>;
  return {
    type: cond?.type ?? 'checkin_count',
    value: cond?.value ?? cond?.count ?? 10,
  };
}

export function UpcomingMilestones({ memberId, className, max = 3, nudgeOnly = false }: UpcomingMilestonesProps) {
  const { t } = useTranslation();
  const { data: allBadges } = useQuery({
    queryKey: ['all-badges'],
    queryFn: fetchAllBadges,
  });

  const { data: myBadges } = useQuery({
    queryKey: ['my-badges', memberId],
    queryFn: () => fetchMyBadges(memberId),
    enabled: !!memberId,
  });

  const { data: momentum } = useQuery({
    queryKey: ['momentum-profile', memberId],
    queryFn: () => fetchMomentumProfile(memberId),
    enabled: !!memberId,
  });

  if (!allBadges || !myBadges || !momentum) return null;

  const earnedIds = new Set(myBadges.map(mb => mb.badgeId));
  const estimatedAttendance = Math.floor(momentum.totalXp / 100);

  const upcoming: MilestoneProgress[] = allBadges
    .filter(b => !earnedIds.has(b.id))
    .map(badge => {
      const { type, value: target } = getBadgeTarget(badge);
      let current = 0;
      if (type === 'checkin_count' || type === 'attendance_count') current = estimatedAttendance;
      else if (type === 'streak_weeks') current = momentum.currentStreak;
      else if (type === 'xp_total') current = momentum.totalXp;
      else if (type === 'level') current = momentum.level;

      const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
      const remaining = Math.max(0, target - current);
      return { badge, current, target, percent, remaining };
    })
    .filter(m => m.percent > 0 && m.percent < 100)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, max);

  if (upcoming.length === 0) return null;

  const almostThere = upcoming.filter(m => m.remaining <= 1);

  if (nudgeOnly) {
    if (almostThere.length === 0) return null;
    const m = almostThere[0];
    return (
      <div className={cn('flex items-center gap-2 rounded-lg bg-accent/50 border border-border px-3 py-2', className)}>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent">
          <Target className="h-3.5 w-3.5 text-accent-foreground" />
        </div>
        <p className="text-xs font-medium text-foreground">
          <span className="text-primary font-bold">{t('member.almostThereLabel')}</span>{' '}
          {t('member.moreToUnlock', { n: m.remaining, name: m.badge.nameEn })}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
        <Target className="h-3 w-3 text-primary" />
        {t('member.nextMilestones')}
      </p>
      {upcoming.map(m => (
        <div key={m.badge.id} className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <svg width="44" height="44" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="18" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
              <circle
                cx="22" cy="22" r="18"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 18}`}
                strokeDashoffset={`${2 * Math.PI * 18 * (1 - m.percent / 100)}`}
                transform="rotate(-90 22 22)"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {m.badge.iconUrl ? (
                <img src={m.badge.iconUrl} alt="" className="h-5 w-5" />
              ) : (
                <Award className="h-4 w-4 text-primary" />
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{m.badge.nameEn}</p>
            <p className="text-xs text-muted-foreground">
              {m.remaining === 1 ? (
                <span className="text-primary font-medium">{t('member.oneMoreToUnlock')}</span>
              ) : (
                t('member.moreToGo', { n: m.remaining })
              )}
            </p>
          </div>

          <span className="text-xs font-bold text-primary tabular-nums">{m.percent}%</span>
        </div>
      ))}
    </div>
  );
}
