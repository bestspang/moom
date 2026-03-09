import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchMomentumProfile, fetchMyChallengeProgress, fetchMyBadges } from './api';
import { TierBadge } from './TierBadge';
import { XPProgressBar } from './XPProgressBar';
import { StreakFlame } from './StreakFlame';
import { Skeleton } from '@/components/ui/skeleton';
import { Gift, Zap, Target, ChevronRight, Lock, Trophy, Users } from 'lucide-react';
import type { MomentumProfile } from './types';

interface MomentumCardProps {
  memberId: string | null;
  className?: string;
}

const DEFAULT_PROFILE: MomentumProfile = {
  memberId: '',
  totalXp: 0,
  level: 1,
  tier: 'starter',
  currentStreak: 0,
  longestStreak: 0,
  availablePoints: 0,
  totalPoints: 0,
  weeklyCheckinDays: [],
};

export function MomentumCard({ memberId, className }: MomentumCardProps) {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useQuery({
    queryKey: ['momentum-profile', memberId],
    queryFn: () => fetchMomentumProfile(memberId!),
    enabled: !!memberId,
  });

  const { data: myProgress } = useQuery({
    queryKey: ['my-challenges', memberId],
    queryFn: () => fetchMyChallengeProgress(memberId!),
    enabled: !!memberId,
  });

  const { data: myBadges } = useQuery({
    queryKey: ['my-badges', memberId],
    queryFn: () => fetchMyBadges(memberId!),
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

  // Use real profile or fallback starter profile
  const p: MomentumProfile = profile ?? { ...DEFAULT_PROFILE, memberId };
  const isStarter = !profile;

  const activeQuests = (myProgress ?? []).filter(q => q.status !== 'completed' && q.challenge).slice(0, 2);
  const displayBadges = (myBadges ?? []).slice(0, 6);

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
            <TierBadge tier={p.tier} level={p.level} size="md" />
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black"
              style={{ backgroundColor: 'hsl(var(--primary-foreground) / 0.2)', color: 'hsl(var(--primary-foreground))' }}
            >
              <Zap className="h-3 w-3" />
              {p.totalXp.toLocaleString()}
            </div>
            <div
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black"
              style={{ backgroundColor: 'hsl(var(--primary-foreground) / 0.2)', color: 'hsl(var(--primary-foreground))' }}
            >
              <Gift className="h-3 w-3" />
              {p.availablePoints.toLocaleString()}
            </div>
          </div>
        </div>

        {/* XP Progress */}
        <div className="[&_span]:text-primary-foreground/80 [&_.inline-flex]:!bg-white/20">
          <XPProgressBar totalXP={p.totalXp} level={p.level} className="mb-4" />
        </div>

        {/* Streak */}
        <div className="flex items-center justify-between">
          <StreakFlame
            weeklyCheckinDays={p.weeklyCheckinDays}
            currentStreakWeeks={p.currentStreak}
          />
          <div
            className="flex items-center gap-1 text-[10px] font-bold"
            style={{ color: 'hsl(var(--primary-foreground) / 0.7)' }}
          >
            View all <ChevronRight className="h-3 w-3" />
          </div>
        </div>

        {/* Starter nudge */}
        {isStarter && (
          <p
            className="mt-3 text-xs font-medium text-center rounded-lg py-2"
            style={{ backgroundColor: 'hsl(var(--primary-foreground) / 0.15)', color: 'hsl(var(--primary-foreground))' }}
          >
            ✨ Check in to start earning XP!
          </p>
        )}
      </div>

      {/* Badge gallery horizontal scroll */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Badges</p>
          <button
            className="text-[10px] font-semibold text-primary flex items-center gap-0.5"
            onClick={(e) => { e.stopPropagation(); navigate('/member/badges'); }}
          >
            View all <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        {displayBadges.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {displayBadges.map((b) => (
              <div
                key={b.id}
                className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary flex items-center justify-center border-2 border-primary/20"
                title={b.badge?.nameEn}
              >
                {b.badge?.iconUrl ? (
                  <img src={b.badge.iconUrl} alt={b.badge.nameEn} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <span className="text-sm">🏅</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            <span className="text-xs">Earn your first badge!</span>
          </div>
        )}
      </div>

      {/* Quick links: Leaderboard + Squad */}
      <div className="px-4 pb-3 flex gap-2">
        <button
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          onClick={(e) => { e.stopPropagation(); navigate('/member/leaderboard'); }}
        >
          <Trophy className="h-3.5 w-3.5" />
          Leaderboard
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          onClick={(e) => { e.stopPropagation(); navigate('/member/squad'); }}
        >
          <Users className="h-3.5 w-3.5" />
          My Squad
        </button>
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
