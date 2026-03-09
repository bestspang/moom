import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchMomentumProfile, fetchMyChallengeProgress } from './api';
import { TierBadge } from './TierBadge';
import { XPProgressBar } from './XPProgressBar';
import { StreakFlame } from './StreakFlame';
import { Skeleton } from '@/components/ui/skeleton';
import { Gift, Zap, Target, ChevronRight } from 'lucide-react';

interface MomentumCardProps {
  memberId: string;
  className?: string;
}

export function MomentumCard({ memberId, className }: MomentumCardProps) {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useQuery({
    queryKey: ['momentum-profile', memberId],
    queryFn: () => fetchMomentumProfile(memberId),
    enabled: !!memberId,
  });

  const { data: myProgress } = useQuery({
    queryKey: ['my-challenges', memberId],
    queryFn: () => fetchMyChallengeProgress(memberId),
    enabled: !!memberId,
  });

  if (isLoading) {
    return (
      <div className={cn('rounded-2xl border bg-card p-5 shadow-lg', className)}>
        <Skeleton className="h-8 w-40 mb-4" />
        <Skeleton className="h-4 w-full mb-5" />
        <Skeleton className="h-10 w-40" />
      </div>
    );
  }

  if (!profile) return null;

  const activeQuests = (myProgress ?? []).filter(p => p.status !== 'completed' && p.challenge).slice(0, 2);

  return (
    <div
      className={cn('rounded-2xl shadow-lg overflow-hidden border border-border cursor-pointer active:scale-[0.98] transition-transform', className)}
      onClick={() => navigate('/member/momentum')}
    >
      {/* Primary-colored header */}
      <div className="relative px-5 pt-5 pb-4" style={{ backgroundColor: 'hsl(var(--primary))' }}>
        {/* Top row: tier + RP */}
        <div className="relative flex items-center justify-between mb-4">
          <div className="[&>span]:!bg-white/90 [&>span]:!text-primary [&>span]:![box-shadow:none] [&>span>span]:!bg-primary/15">
            <TierBadge tier={profile.tier} level={profile.level} size="md" />
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black"
              style={{ backgroundColor: 'hsl(var(--primary-foreground) / 0.2)', color: 'hsl(var(--primary-foreground))' }}
            >
              <Zap className="h-3 w-3" />
              {profile.totalXp.toLocaleString()}
            </div>
            <div
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black"
              style={{ backgroundColor: 'hsl(var(--primary-foreground) / 0.2)', color: 'hsl(var(--primary-foreground))' }}
            >
              <Gift className="h-3 w-3" />
              {profile.availablePoints.toLocaleString()}
            </div>
          </div>
        </div>

        {/* XP Progress */}
        <div className="[&_span]:text-primary-foreground/80 [&_.inline-flex]:!bg-white/20">
          <XPProgressBar totalXP={profile.totalXp} level={profile.level} className="mb-4" />
        </div>

        {/* Streak */}
        <div className="flex items-center justify-between">
          <StreakFlame
            weeklyCheckinDays={profile.weeklyCheckinDays}
            currentStreakWeeks={profile.currentStreak}
          />
          <div
            className="flex items-center gap-1 text-[10px] font-bold"
            style={{ color: 'hsl(var(--primary-foreground) / 0.7)' }}
          >
            View all <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      </div>

      {/* Active quests preview */}
      {activeQuests.length > 0 && (
        <div className="px-4 py-3 space-y-2 border-t border-border">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Target className="h-3 w-3" />
            Active Quests
          </p>
          {activeQuests.map((quest) => {
            const c = quest.challenge!;
            const pct = Math.min((quest.currentValue / c.goalValue) * 100, 100);
            return (
              <div key={quest.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{c.nameEn}</p>
                  <div className="mt-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground tabular-nums flex-shrink-0">
                  {quest.currentValue}/{c.goalValue}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
