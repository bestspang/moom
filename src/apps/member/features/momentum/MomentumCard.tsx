import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchMomentumProfile } from './api';
import { TierBadge } from './TierBadge';
import { XPProgressBar } from './XPProgressBar';
import { StreakFlame } from './StreakFlame';
import { StreakFreezeButton } from './StreakFreezeButton';
import { Skeleton } from '@/components/ui/skeleton';
import { Gift, Zap, Trophy, ChevronRight } from 'lucide-react';

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

  return (
    <div className={cn('rounded-2xl shadow-lg overflow-hidden border border-border', className)}>
      {/* Primary-colored header */}
      <div className="relative px-5 pt-5 pb-4" style={{ backgroundColor: 'hsl(var(--primary))' }}>
        {/* Top row: tier + RP */}
        <div className="relative flex items-center justify-between mb-4">
          <div className="[&>span]:!bg-white/90 [&>span]:!text-primary [&>span]:![box-shadow:none] [&>span>span]:!bg-primary/15">
            <TierBadge tier={profile.tier} level={profile.level} size="md" />
          </div>
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black"
            style={{ backgroundColor: 'hsl(var(--primary-foreground) / 0.2)', color: 'hsl(var(--primary-foreground))' }}
          >
            <Gift className="h-3.5 w-3.5" />
            {profile.availablePoints.toLocaleString()} RP
          </div>
        </div>

        {/* XP Progress */}
        <div className="[&_span]:text-primary-foreground/80 [&_.inline-flex]:!bg-white/20">
          <XPProgressBar totalXP={profile.totalXp} level={profile.level} className="mb-4" />
        </div>

        {/* Streak + total XP */}
        <div className="flex items-center justify-between">
          <StreakFlame
            weeklyCheckinDays={profile.weeklyCheckinDays}
            currentStreakWeeks={profile.currentStreak}
          />
          <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'hsl(var(--primary-foreground))' }}>
            <Zap className="h-3.5 w-3.5" />
            {profile.totalXp.toLocaleString()} XP
          </div>
        </div>
      </div>

      {/* Actions row */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
        <StreakFreezeButton memberId={memberId} availablePoints={profile.availablePoints} />
        <button
          onClick={() => navigate('/member/leaderboard')}
          className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <Trophy className="h-3.5 w-3.5" />
          Leaderboard
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
