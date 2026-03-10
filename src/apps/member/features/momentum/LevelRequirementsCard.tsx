import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle } from 'lucide-react';
import type { MomentumProfile } from './types';
import { xpForLevel } from './types';

interface LevelRequirementsCardProps {
  profile: MomentumProfile;
  completedQuests: number;
  totalBadges: number;
  className?: string;
}

interface Requirement {
  label: string;
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
    {
      label: 'Total XP',
      current: profile.totalXp,
      target: nextXp,
    },
    {
      label: 'Weekly streak',
      current: profile.currentStreak,
      target: Math.max(profile.currentStreak + 1, profile.level + 2),
    },
    {
      label: 'Quests completed',
      current: completedQuests,
      target: Math.max(completedQuests + 1, Math.ceil(nextLevel / 3)),
    },
    {
      label: 'Badges earned',
      current: totalBadges,
      target: Math.max(totalBadges + 1, Math.ceil(nextLevel / 5)),
    },
  ];
}

export function LevelRequirementsCard({
  profile,
  completedQuests,
  totalBadges,
  className,
}: LevelRequirementsCardProps) {
  const reqs = deriveRequirements(
    profile,
    completedQuests.length,
    totalBadges,
  );

  return (
    <div className={cn('rounded-xl border bg-card p-4 space-y-3', className)}>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
        Level {profile.level + 1} Requirements
      </p>

      <div className="space-y-3">
        {reqs.map((r) => {
          const pct = Math.min((r.current / r.target) * 100, 100);
          const done = r.current >= r.target;

          return (
            <div key={r.label} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {done ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
                  )}
                  <span className={cn('text-xs font-medium', done ? 'text-foreground' : 'text-muted-foreground')}>
                    {r.label}
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
