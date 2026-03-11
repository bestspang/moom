import { cn } from '@/lib/utils';
import { xpForLevel } from './types';

interface XPProgressBarProps {
  totalXP: number;
  level: number;
  className?: string;
}

export function XPProgressBar({ totalXP, level, className }: XPProgressBarProps) {
  const currentLevelXP = xpForLevel(level);
  const nextLevelXP = xpForLevel(level + 1);
  const xpInLevel = totalXP - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  // Guard against 0 denominator (level 1 edge case where both are 0)
  const safeDenominator = xpNeeded > 0 ? xpNeeded : nextLevelXP > 0 ? nextLevelXP : 120;
  const progress = Math.min((Math.max(xpInLevel, 0) / safeDenominator) * 100, 100);
  const isClose = progress >= 85;
  const displayTarget = nextLevelXP > 0 ? nextLevelXP : 120;

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-[10px] font-medium">
        <span className="text-muted-foreground">
          {totalXP.toLocaleString()} / {displayTarget.toLocaleString()} XP to Lv{level + 1}
        </span>
      </div>

      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            isClose && 'shadow-[0_0_12px_hsl(var(--xp-bar-glow)/0.6)]',
          )}
          style={{ width: `${progress}%`, backgroundColor: 'hsl(var(--xp-bar))' }}
        />
        {isClose && (
          <div
            className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full animate-pulse"
            style={{ left: `calc(${progress}% - 7px)`, backgroundColor: 'hsl(var(--xp-bar-glow) / 0.8)' }}
          />
        )}
      </div>
    </div>
  );
}
