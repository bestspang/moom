import { cn } from '@/lib/utils';

interface StreakFlameProps {
  weeklyCheckinDays: number[];
  currentStreakWeeks: number;
  className?: string;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function StreakFlame({ weeklyCheckinDays, currentStreakWeeks, className }: StreakFlameProps) {
  const isActive = currentStreakWeeks > 0;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex items-center gap-1.5">
        <div className={cn('relative', isActive && 'animate-flame-flicker')}>
          {isActive && (
            <div
              className="absolute inset-0 rounded-full blur-md"
              style={{ backgroundColor: 'hsl(var(--momentum-flame) / 0.5)', transform: 'scale(2)' }}
            />
          )}
          <svg
            viewBox="0 0 24 24"
            className={cn('relative h-6 w-6', isActive && 'animate-pulse-glow')}
            style={{ color: isActive ? 'hsl(var(--momentum-flame))' : 'hsl(var(--muted-foreground) / 0.4)' }}
          >
            <path
              d="M12 2C6.5 7 4 10.5 4 14a8 8 0 0016 0c0-3.5-2.5-7-8-12zm0 18a5 5 0 01-5-5c0-2.1 1.3-4.5 5-8.3 3.7 3.8 5 6.2 5 8.3a5 5 0 01-5 5z"
              fill={isActive ? 'hsl(var(--momentum-flame))' : 'none'}
              stroke="currentColor"
              strokeWidth={isActive ? '0' : '1.5'}
            />
            {isActive && (
              <path
                d="M12 12c-1.5 2-2.5 3.5-2.5 5a2.5 2.5 0 005 0c0-1.5-1-3-2.5-5z"
                fill="hsl(var(--momentum-flame-glow))"
                fillOpacity="0.7"
              />
            )}
          </svg>
        </div>
        <span className="text-base font-black text-foreground tabular-nums">
          {currentStreakWeeks}w
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        {DAY_LABELS.map((label, i) => {
          const dayNum = i + 1;
          const isChecked = weeklyCheckinDays.includes(dayNum);
          return (
            <div key={i} className="flex flex-col items-center gap-0.5" style={{ animationDelay: `${i * 50}ms` }}>
              <div
                className={cn(
                  'h-2.5 w-2.5 rounded-full transition-all duration-300 animate-bounce-in',
                  isChecked ? 'shadow-[0_0_6px_rgba(255,255,255,0.5)]' : '',
                )}
                style={{
                  backgroundColor: isChecked ? 'white' : 'hsl(var(--border))',
                  animationDelay: `${i * 60}ms`,
                }}
              />
              <span className="text-[8px] font-medium text-muted-foreground leading-none">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
