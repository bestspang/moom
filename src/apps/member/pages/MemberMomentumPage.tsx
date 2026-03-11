import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useMemberSession } from '../hooks/useMemberSession';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { EmptyState } from '@/apps/shared/components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { TierBadge } from '../features/momentum/TierBadge';
import { XPProgressBar } from '../features/momentum/XPProgressBar';
import { StreakFlame } from '../features/momentum/StreakFlame';
import { StreakFreezeButton } from '../features/momentum/StreakFreezeButton';
import { QuestHub } from '../features/momentum/QuestHub';
import { AlmostThereCard } from '../features/momentum/AlmostThereCard';
import { RewardPreview } from '../features/momentum/RewardPreview';
import { DailyBonusCard } from '../features/momentum/DailyBonusCard';
import {
  fetchMomentumProfile,
  fetchMyBadges,
  fetchRewards,
  fetchMyRedemptions,
  fetchMyQuests,
} from '../features/momentum/api';
import { Coins, Snowflake, Award, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function MemberMomentumPage() {
  const navigate = useNavigate();
  const { memberId } = useMemberSession();
  const { t } = useTranslation();

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['momentum-profile', memberId],
    queryFn: () => fetchMomentumProfile(memberId!),
    enabled: !!memberId,
  });

  const { data: badges } = useQuery({
    queryKey: ['my-badges', memberId],
    queryFn: () => fetchMyBadges(memberId!),
    enabled: !!memberId,
  });

  const { data: rewards } = useQuery({
    queryKey: ['gamification-rewards-member'],
    queryFn: fetchRewards,
  });

  const { data: quests } = useQuery({
    queryKey: ['my-quests', memberId],
    queryFn: () => fetchMyQuests(memberId!),
    enabled: !!memberId,
  });

  if (loadingProfile) {
    return (
      <div className="animate-in fade-in-0 duration-200">
        <MobilePageHeader title={t('member.momentum')} />
        <div className="px-4 space-y-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="animate-in fade-in-0 duration-200">
        <MobilePageHeader title={t('member.momentum')} />
        <Section>
          <EmptyState
            title={t('member.startYourJourney')}
            description={t('member.startJourneyHint')}
            action={<Button size="sm" onClick={() => navigate('/member/check-in')}>{t('member.checkIn')}</Button>}
          />
        </Section>
      </div>
    );
  }

  const dailyQuests = (quests ?? []).filter(q => q.template?.questPeriod === 'daily' && q.status !== 'expired');
  const weeklyQuests = (quests ?? []).filter(q => q.template?.questPeriod === 'weekly' && q.status !== 'expired');

  return (
    <div className="animate-in fade-in-0 duration-200 pb-6">
      {/* ── SECTION 1: Compact Hero ── */}
      <div className="relative overflow-hidden" style={{ backgroundColor: 'hsl(var(--primary))' }}>
        <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full opacity-10" style={{ backgroundColor: 'hsl(var(--primary-foreground))' }} />

        <div className="relative px-5 pt-12 pb-4 space-y-3">
          {/* Row 1: Tier + Coin */}
          <div className="flex items-center justify-between">
            <div className="[&>span]:!bg-white/90 [&>span]:!text-primary [&>span]:![box-shadow:none] [&>span>span]:!bg-primary/15">
              <TierBadge tier={profile.tier} level={profile.level} size="md" />
            </div>
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black"
              style={{ backgroundColor: 'hsl(var(--primary-foreground) / 0.2)', color: 'hsl(var(--primary-foreground))' }}
            >
              <Coins className="h-3.5 w-3.5" />
              {profile.availablePoints.toLocaleString()} Coin
            </div>
          </div>

          {/* Row 2: XP Progress */}
          <div className="[&_span]:text-primary-foreground/80 [&_.inline-flex]:!bg-white/20">
            <XPProgressBar totalXP={profile.totalXp} level={profile.level} />
          </div>

          {/* Row 3: Streak + Freeze (small) */}
          <div className="flex items-center justify-between">
            <StreakFlame
              weeklyCheckinDays={profile.weeklyCheckinDays}
              currentStreakWeeks={profile.currentStreak}
            />
            <button
              className="flex items-center gap-1 text-[10px] font-medium opacity-70 hover:opacity-100 transition-opacity"
              style={{ color: 'hsl(var(--primary-foreground))' }}
              onClick={(e) => {
                e.stopPropagation();
                // Trigger freeze via the StreakFreezeButton logic
              }}
              title={t('member.freezeStreak', { cost: 50 })}
            >
              <Snowflake className="h-3 w-3" />
              {t('member.freezeStreak', { cost: 50 })}
            </button>
          </div>
        </div>
      </div>

      {/* ── Dashboard Content ── */}
      <div className="px-4 space-y-5 mt-4">

        {/* ── SECTION 2: Check-in CTA + Today's Quests ── */}
        <DailyBonusCard />

        {dailyQuests.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              ☀️ {t('member.dailyQuests')}
            </p>
            <QuestHub filterPeriod="daily" />
          </div>
        )}

        {/* ── SECTION 3: Weekly Progress ── */}
        {weeklyQuests.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              📅 {t('member.weeklyQuests')}
            </p>
            <QuestHub filterPeriod="weekly" />
          </div>
        )}

        {/* Show full QuestHub if no quests separated yet */}
        {dailyQuests.length === 0 && weeklyQuests.length === 0 && (
          <QuestHub />
        )}

        {/* ── SECTION 4: Almost There ── */}
        <AlmostThereCard
          profile={profile}
          quests={quests ?? []}
          rewards={rewards ?? []}
        />

        {/* ── SECTION 5: Reward Preview ── */}
        <RewardPreview
          rewards={rewards ?? []}
          userLevel={profile.level}
          userPoints={profile.availablePoints}
        />

        {/* ── Badges Preview ── */}
        {badges && badges.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                🏅 {t('member.badges')}
              </p>
              <button
                onClick={() => navigate('/member/badges')}
                className="flex items-center gap-0.5 text-xs font-semibold text-primary"
              >
                {t('member.viewAll')} <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
              {badges.slice(0, 8).map((mb) => (
                <div
                  key={mb.id}
                  className="flex-shrink-0 w-11 h-11 rounded-full bg-secondary flex items-center justify-center border-2 border-primary/20"
                  title={mb.badge?.nameEn}
                >
                  {mb.badge?.iconUrl ? (
                    <img src={mb.badge.iconUrl} alt={mb.badge.nameEn} className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <Award className="h-5 w-5 text-accent-foreground" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
