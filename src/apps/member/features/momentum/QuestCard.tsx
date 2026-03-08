import { cn } from '@/lib/utils';
import { Target, Zap, Gift, CheckCircle2 } from 'lucide-react';
import type { ChallengeProgressEntry } from './types';

interface QuestCardProps {
  challenge: ChallengeProgressEntry;
  className?: string;
}

export function QuestCard({ challenge, className }: QuestCardProps) {
  const c = challenge.challenge;
  if (!c) return null;

  const progressPct = Math.min((challenge.currentValue / c.goalValue) * 100, 100);
  const isComplete = challenge.status === 'completed';

  return (
    <div
      className={cn(
        'relative flex items-center gap-3 rounded-xl border overflow-hidden bg-card p-3 transition-all',
        isComplete && 'border-primary/30 bg-primary/5',
        className,
      )}
    >
      {/* Left accent bar */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-1 rounded-l-xl',
          isComplete ? 'bg-primary' : 'bg-primary',
        )}
      />

      {/* Icon */}
      <div
        className={cn(
          'relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ml-1',
          isComplete ? 'bg-primary/10' : 'bg-accent',
        )}
      >
        {isComplete ? (
          <CheckCircle2 className="h-5 w-5 text-primary" />
        ) : (
          <Target className="h-5 w-5 text-accent-foreground" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground truncate">{c.nameEn}</p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {c.rewardXp > 0 && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                <Zap className="h-2.5 w-2.5" />
                {c.rewardXp}
              </span>
            )}
            {c.rewardPoints > 0 && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                <Gift className="h-2.5 w-2.5" />
                {c.rewardPoints}
              </span>
            )}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="relative flex-1 h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-[10px] font-semibold text-muted-foreground flex-shrink-0 tabular-nums">
            {challenge.currentValue}/{c.goalValue}
          </span>
        </div>
      </div>

      {isComplete && (
        <div className="absolute top-1 right-2">
          <span className="text-[9px] font-black uppercase tracking-wider text-primary opacity-60">
            ✓ Done
          </span>
        </div>
      )}
    </div>
  );
}
