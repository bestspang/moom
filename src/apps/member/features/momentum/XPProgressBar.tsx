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
  // Fix: for level 1, currentLevelXP=0 and nextLevelXP=120
  const xpInLevel = totalXP - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  const progress = xpNeeded > 0 ? Math.min((xpInLevel / xpNeeded) * 100, 100) : 100;
  const isClose = progress >= 85;

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between text-[10px] font-medium">
        <span
          className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-black"
          style={{ backgroundColor: 'hsl(var(--xp-bar) / 0.15)', color: 'hsl(var(--xp-bar))' }}
        >
          {level}
        </span>
        <span className="text-muted-foreground">
          {xpInLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP
        </span>
        <span
          className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-black"
          style={{ backgroundColor: 'hsl(var(--xp-bar-glow) / 0.15)', color: 'hsl(var(--xp-bar-glow))' }}
        >
          {level + 1}
        </span>
      </div>

      <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            isClose && 'shadow-[0_0_12px_hsl(var(--xp-bar-glow)/0.6)]',
          )}
          style={{ width: `${progress}%`, backgroundColor: 'hsl(var(--xp-bar))' }}
        />
        {isClose && (
          <div
            className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full animate-pulse"
            style={{ left: `calc(${progress}% - 8px)`, backgroundColor: 'hsl(var(--xp-bar-glow) / 0.8)' }}
          />
        )}
      </div>
    </div>
  );
}
