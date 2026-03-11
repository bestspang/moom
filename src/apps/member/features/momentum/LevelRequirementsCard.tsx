import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { MomentumProfile } from './types';
import { xpForLevel } from './types';
import { useTranslation } from 'react-i18next';
import { fetchPrestigeEligibility } from './api';

interface LevelRequirementsCardProps {
  profile: MomentumProfile;
  completedQuests: number;
  totalBadges: number;
  className?: string;
}

interface Requirement {
  labelKey: string;
  label?: string;
  current: number;
  target: number;
}

export function LevelRequirementsCard({
  profile,
  completedQuests,
  totalBadges,
  className,
}: LevelRequirementsCardProps) {
  const { t } = useTranslation();
  const nextLevel = profile.level + 1;
  const isPrestigeNext = nextLevel >= 18 && nextLevel <= 20;

  const { data: prestige } = useQuery({
    queryKey: ['prestige-eligibility', profile.memberId, nextLevel],
    queryFn: () => fetchPrestigeEligibility(profile.memberId, nextLevel),
    enabled: isPrestigeNext && !!profile.memberId,
  });

  // Base XP requirement
  const nextXp = xpForLevel(nextLevel);
  const reqs: Requirement[] = [
    { labelKey: 'totalXpLabel', current: profile.totalXp, target: nextXp },
  ];

  if (isPrestigeNext && prestige?.criteria) {
    // Use real prestige criteria from DB
    for (const c of prestige.criteria) {
      if (c.code === 'min_xp') continue; // already shown as XP bar
      reqs.push({
        labelKey: c.code,
        label: c.descriptionEn,
        current: c.current,
        target: c.target,
      });
    }
  } else if (!isPrestigeNext) {
    // Standard non-prestige derived targets
    reqs.push(
      { labelKey: 'weeklyStreakLabel', current: profile.currentStreak, target: Math.max(profile.currentStreak + 1, profile.level + 2) },
      { labelKey: 'questsCompletedLabel', current: completedQuests, target: Math.max(completedQuests + 1, Math.ceil(nextLevel / 3)) },
      { labelKey: 'badgesEarnedLabel', current: totalBadges, target: Math.max(totalBadges + 1, Math.ceil(nextLevel / 5)) },
    );
  }

  if (nextLevel > 20) return null;

  return (
    <div className={cn('rounded-xl border bg-card p-4 space-y-3', className)}>
      <div className="flex items-center gap-1.5">
        {isPrestigeNext && <Shield className="h-3.5 w-3.5 text-amber-500" />}
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {t('member.levelRequirements', { level: nextLevel })}
        </p>
      </div>

      <div className="space-y-3">
        {reqs.map((r) => {
          const pct = Math.min((r.current / Math.max(r.target, 1)) * 100, 100);
          const done = r.current >= r.target;

          return (
            <div key={r.labelKey} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {done ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
                  )}
                  <span className={cn('text-xs font-medium', done ? 'text-foreground' : 'text-muted-foreground')}>
                    {r.label ?? t(`member.${r.labelKey}`)}
                  </span>
                </div>
                <span className="text-[10px] font-bold tabular-nums text-muted-foreground">
                  {r.current.toLocaleString()} / {r.target.toLocaleString()}
                </span>
              </div>
              <Progress value={pct} className="h-1.5" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
