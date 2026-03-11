import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchMomentumProfile, fetchMyBadges, fetchMyQuests, fetchMemberStatusTier, type QuestInstance } from './api';
import { TierBadge } from './TierBadge';
import { StatusTierBadge, type StatusTier } from './StatusTierBadge';
import { XPProgressBar } from './XPProgressBar';
import { StreakFlame } from './StreakFlame';
import { Skeleton } from '@/components/ui/skeleton';
import { Gift, Zap, Target, ChevronRight, Lock, Trophy, Users, Coins } from 'lucide-react';
import type { MomentumProfile } from './types';
import { getBadgeEmoji } from './badgeEmoji';

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
  const { t } = useTranslation();
  const { data: profile, isLoading } = useQuery({
    queryKey: ['momentum-profile', memberId],
    queryFn: () => fetchMomentumProfile(memberId!),
    enabled: !!memberId,
  });

  const { data: myQuests } = useQuery({
    queryKey: ['my-quests', memberId],
    queryFn: () => fetchMyQuests(memberId!),
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
  const p: MomentumProfile = profile ?? { ...DEFAULT_PROFILE, memberId: memberId ?? '' };
  const isStarter = !profile;

  // Show daily quests from quest_instances (v1 spec: 3 daily quests + active weekly)
  const dailyQuests = (myQuests ?? [])
    .filter(q => q.template?.questPeriod === 'daily' && q.status !== 'expired' && q.status !== 'claimed')
    .slice(0, 3);
  const weeklyQuest = (myQuests ?? [])
    .find(q => q.template?.questPeriod === 'weekly' && q.status !== 'expired' && q.status !== 'claimed');
  const activeQuests: QuestInstance[] = [...dailyQuests, ...(weeklyQuest ? [weeklyQuest] : [])].slice(0, 4);

  const displayBadges = (myBadges ?? []).slice(0, 6);

  return (
    <div
      className={cn('rounded-2xl shadow-lg overflow-hidden border border-border cursor-pointer active:scale-[0.98] transition-transform', className)}
      onClick={() => navigate('/member/momentum')}
    >
      {/* Primary-colored header */}
      <div className="relative px-5 pt-5 pb-4" style={{ backgroundColor: 'hsl(var(--primary))' }}>
        {/* Top row: tier + stats */}
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
              <Coins className="h-3 w-3" />
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
            {t('member.viewAll')} <ChevronRight className="h-3 w-3" />
          </div>
        </div>

        {/* Starter nudge */}
        {isStarter && (
          <p
            className="mt-3 text-xs font-medium text-center rounded-lg py-2"
            style={{ backgroundColor: 'hsl(var(--primary-foreground) / 0.15)', color: 'hsl(var(--primary-foreground))' }}
          >
            {t('member.startEarningXp')}
          </p>
        )}
      </div>

      {/* Daily quests preview */}
      {activeQuests.length > 0 && (
        <div className="px-4 py-3 space-y-2 border-t border-border">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Target className="h-3 w-3" />
            {t('member.todaysQuests')}
          </p>
          {activeQuests.map((quest) => {
            const tmpl = quest.template;
            if (!tmpl) return null;
            const pct = Math.min((quest.progressValue / tmpl.goalValue) * 100, 100);
            const isWeekly = tmpl.questPeriod === 'weekly';
            return (
              <div key={quest.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-foreground truncate">{tmpl.nameEn}</p>
                    {isWeekly && (
                      <span className="text-[8px] font-bold uppercase rounded-full px-1.5 py-0.5 flex-shrink-0" style={{ color: 'hsl(var(--status-info))', backgroundColor: 'hsl(var(--status-info) / 0.1)' }}>
                        {t('member.weeklyLabel')}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground tabular-nums flex-shrink-0">
                  {quest.progressValue}/{tmpl.goalValue}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Badge gallery horizontal scroll */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('member.badges')}</p>
          <button
            className="text-[10px] font-semibold text-primary flex items-center gap-0.5"
            onClick={(e) => { e.stopPropagation(); navigate('/member/badges'); }}
          >
            {t('member.viewAll')} <ChevronRight className="h-3 w-3" />
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
<span className="text-sm leading-none" role="img">{getBadgeEmoji(null, b.badge?.nameEn)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            <span className="text-xs">{t('member.earnFirstBadge')}</span>
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
          {t('member.leaderboard')}
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          onClick={(e) => { e.stopPropagation(); navigate('/member/squad'); }}
        >
          <Users className="h-3.5 w-3.5" />
          {t('member.mySquad')}
        </button>
      </div>

    </div>
  );
}
