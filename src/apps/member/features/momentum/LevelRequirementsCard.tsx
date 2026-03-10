import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle } from 'lucide-react';
import type { MomentumProfile } from './types';
import { xpForLevel } from './types';
import { useTranslation } from 'react-i18next';

interface LevelRequirementsCardProps {
  profile: MomentumProfile;
  completedQuests: number;
  totalBadges: number;
  className?: string;
}

interface Requirement {
  labelKey: string;
  current: number;
  target: number;
}

function deriveRequirements(
  profile: MomentumProfile,
  completedQuests: number,
  totalBadges: number,
): Requirement[] {
  const nextLevel = profile.level + 1;
  const nextXp = xpForLevel(nextLevel);

  return [
    { labelKey: 'totalXpLabel', current: profile.totalXp, target: nextXp },
    { labelKey: 'weeklyStreakLabel', current: profile.currentStreak, target: Math.max(profile.currentStreak + 1, profile.level + 2) },
    { labelKey: 'questsCompletedLabel', current: completedQuests, target: Math.max(completedQuests + 1, Math.ceil(nextLevel / 3)) },
    { labelKey: 'badgesEarnedLabel', current: totalBadges, target: Math.max(totalBadges + 1, Math.ceil(nextLevel / 5)) },
  ];
}

export function LevelRequirementsCard({
  profile,
  completedQuests,
  totalBadges,
  className,
}: LevelRequirementsCardProps) {
  const { t } = useTranslation();
  const reqs = deriveRequirements(profile, completedQuests, totalBadges);

  return (
    <div className={cn('rounded-xl border bg-card p-4 space-y-3', className)}>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
        {t('member.levelRequirements', { level: profile.level + 1 })}
      </p>

      <div className="space-y-3">
        {reqs.map((r) => {
          const pct = Math.min((r.current / r.target) * 100, 100);
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
                    {t(`member.${r.labelKey}`)}
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
