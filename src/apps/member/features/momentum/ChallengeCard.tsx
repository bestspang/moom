import { cn } from '@/lib/utils';
import { Trophy, Calendar, Sparkles, Zap, Gift, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { differenceInDays } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface ChallengeCardProps {
  challenge: {
    id: string;
    name_en: string;
    description_en?: string | null;
    type: string;
    start_date: string;
    end_date: string;
    reward_xp?: number | null;
    reward_points?: number | null;
    goal_value: number;
  };
  progress?: {
    current_value: number;
    status: string;
  } | null;
  onJoin?: (challengeId: string) => void;
  joining?: boolean;
  className?: string;
}

export function ChallengeCard({ challenge, progress, onJoin, joining, className }: ChallengeCardProps) {
  const { t } = useTranslation();
  const daysLeft = differenceInDays(new Date(challenge.end_date), new Date());
  const isJoined = !!progress;
  const isCompleted = progress?.status === 'completed';
  const pct = progress ? Math.min(100, Math.round((progress.current_value / challenge.goal_value) * 100)) : 0;

  return (
    <div className={cn('relative rounded-2xl border bg-card shadow-md overflow-hidden transition-all', isCompleted && 'opacity-80', className)}>
      <div
        className="h-1.5"
        style={{
          background: isCompleted
            ? 'hsl(var(--status-success))'
            : 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--momentum-flame-glow)), hsl(var(--primary)))',
        }}
      />

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                background: isCompleted
                  ? 'hsl(var(--status-success) / 0.12)'
                  : 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.05))',
              }}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5" style={{ color: 'hsl(var(--status-success))' }} />
              ) : (
                <Trophy className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground leading-tight">{challenge.name_en}</h3>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                {challenge.type}
              </span>
            </div>
          </div>
          <div
            className="flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold"
            style={{
              backgroundColor: daysLeft <= 3 ? 'hsl(var(--status-danger) / 0.1)' : 'hsl(var(--muted))',
              color: daysLeft <= 3 ? 'hsl(var(--status-danger))' : 'hsl(var(--muted-foreground))',
            }}
          >
            <Calendar className="h-3 w-3" />
            {daysLeft > 0 ? t('member.challengeDaysLeft', { n: daysLeft }) : t('member.ending')}
          </div>
        </div>

        {challenge.description_en && (
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{challenge.description_en}</p>
        )}

        <div className="flex items-center gap-2 mb-3">
          {(challenge.reward_xp ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
              <Zap className="h-3 w-3" />
              {challenge.reward_xp} XP
            </span>
          )}
          {(challenge.reward_points ?? 0) > 0 && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
              style={{ backgroundColor: 'hsl(var(--momentum-flame) / 0.1)', color: 'hsl(var(--momentum-flame))' }}
            >
              <Gift className="h-3 w-3" />
              {challenge.reward_points} Coin
            </span>
          )}
        </div>

        {isJoined ? (
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-foreground">
                {isCompleted ? t('member.challengeCompleted') : t('member.challengeProgress')}
              </span>
              <span className="text-muted-foreground tabular-nums font-medium">
                {progress.current_value}/{challenge.goal_value}
              </span>
            </div>
            <div className="relative h-2.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 relative overflow-hidden"
                style={{
                  width: `${pct}%`,
                  background: isCompleted
                    ? 'hsl(var(--status-success))'
                    : 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--xp-bar-glow)))',
                }}
              >
                {!isCompleted && (
                  <div
                    className="absolute inset-0 animate-shimmer"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, hsla(0,0%,100%,0.3) 50%, transparent 100%)',
                      backgroundSize: '200% 100%',
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          <Button size="sm" className="w-full font-bold" onClick={() => onJoin?.(challenge.id)} disabled={joining}>
            <Sparkles className="h-4 w-4 mr-1.5" />
            {joining ? t('member.joiningChallenge') : t('member.joinChallenge')}
          </Button>
        )}
      </div>
    </div>
  );
}
