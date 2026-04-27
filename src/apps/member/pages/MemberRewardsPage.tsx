import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { fetchMomentumProfile, fetchPointsHistory, fetchRewards, fetchMyRedemptions } from '../features/momentum/api';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { EmptyState } from '@/apps/shared/components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TierBadge } from '../features/momentum/TierBadge';
import { RewardDropCard } from '../features/momentum/RewardDropCard';
import { BadgeGrid } from '../features/momentum/BadgeGrid';
import { useMemberSession } from '../hooks/useMemberSession';
import { useTranslation } from 'react-i18next';
import { Gift, Sparkles, Coins } from 'lucide-react';
import { format } from 'date-fns';
import { useDateLocale } from '@/hooks/useDateLocale';

const EVENT_LABEL_KEYS: Record<string, string> = {
  checkin: 'member.eventCheckin',
  quest_complete: 'member.eventQuest',
  streak_bonus: 'member.eventStreakBonus',
  challenge_complete: 'member.eventChallenge',
  referral: 'member.eventReferral',
  purchase: 'member.eventPurchase',
  badge_earned: 'member.eventBadgeEarned',
  rule_reward: 'member.eventActivityReward',
  redemption: 'member.eventRedemption',
};

export default function MemberRewardsPage() {
  const { memberId } = useMemberSession();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const [tab, setTab] = useState<'rewards' | 'history' | 'badges'>('rewards');

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['momentum-profile', memberId],
    queryFn: () => fetchMomentumProfile(memberId!),
    enabled: !!memberId,
  });

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ['points-history', memberId],
    queryFn: () => fetchPointsHistory(memberId!),
    enabled: !!memberId,
  });

  const { data: rewards, isLoading: loadingRewards } = useQuery({
    queryKey: ['gamification-rewards-member'],
    queryFn: fetchRewards,
  });

  const { data: redemptions } = useQuery({
    queryKey: ['my-redemptions', memberId],
    queryFn: () => fetchMyRedemptions(memberId!),
    enabled: !!memberId,
  });

  const redeemedRewardIds = useMemo(
    () => new Set(redemptions?.map(r => r.rewardId) ?? []),
    [redemptions]
  );

  const redeemableCount = useMemo(() => {
    if (!rewards || !profile) return 0;
    return rewards.filter(r =>
      r.pointsCost <= profile.availablePoints &&
      profile.level >= (r.levelRequired ?? 0)
    ).length;
  }, [rewards, profile]);

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title={t('member.rewardWallet')} />

      {/* Gradient hero balance */}
      <Section className="mb-4">
        {loadingProfile ? (
          <Skeleton className="h-32 rounded-2xl" />
        ) : profile ? (
          <div className="relative overflow-hidden rounded-2xl p-5 text-primary-foreground shadow-lg bg-gradient-to-br from-primary to-[hsl(14_90%_52%)]">
            {/* Decorative background coin */}
            <div className="absolute -top-6 -right-4 opacity-15 rotate-[-15deg] pointer-events-none">
              <Coins size={120} strokeWidth={1.5} />
            </div>

            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] opacity-90">
                    {t('member.momentumCoin')}
                  </p>
                  <p className="text-4xl font-extrabold mt-1 leading-none tracking-tight">
                    {profile.availablePoints.toLocaleString()}
                    <span className="text-base font-bold opacity-90 ml-1.5">{t('member.coinUnit')}</span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <TierBadge tier={profile.tier} level={profile.level} />
                  <span className="text-[11px] font-bold opacity-90">
                    {t('member.levelLabel').replace('{{n}}', String(profile.level))}
                  </span>
                </div>
              </div>

              {redeemableCount > 0 && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 px-2.5 py-1 text-[11px] font-bold">
                  <Sparkles className="h-3 w-3" />
                  {t('member.redeemableNow').replace('{{n}}', String(redeemableCount))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <EmptyState title={t('member.noPointsYet')} description={t('member.noPointsHint')} />
        )}
      </Section>

      {/* Tabs */}
      <Section className="mb-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rewards">{t('member.rewardsTab')}</TabsTrigger>
            <TabsTrigger value="history">{t('member.historyTab')}</TabsTrigger>
            <TabsTrigger value="badges">{t('member.badgesTab')}</TabsTrigger>
          </TabsList>

          {/* Rewards tab */}
          <TabsContent value="rewards" className="mt-4">
            {loadingRewards ? (
              <div className="grid grid-cols-2 gap-3">
                {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
              </div>
            ) : !rewards || rewards.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
                <Gift className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground">{t('member.noRewardsAvailable')}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('member.noRewardsHint')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {rewards.map(reward => (
                  <RewardDropCard
                    key={reward.id}
                    reward={reward}
                    memberId={memberId!}
                    userLevel={profile?.level ?? 0}
                    userPoints={profile?.availablePoints ?? 0}
                    alreadyRedeemed={redeemedRewardIds.has(reward.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* History tab */}
          <TabsContent value="history" className="mt-4">
            {loadingHistory ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
              </div>
            ) : !history || history.length === 0 ? (
              <EmptyState title={t('member.noPointsYet')} description={t('member.noPointsHint')} />
            ) : (
              <div className="space-y-1">
                {history.map(entry => (
                  <div key={entry.id} className="flex items-center justify-between rounded-lg px-3 py-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
                        <Sparkles className="h-3.5 w-3.5 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {EVENT_LABEL_KEYS[entry.eventType] ? t(EVENT_LABEL_KEYS[entry.eventType]) : entry.eventType}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(entry.createdAt), 'MMM d, yyyy · h:mm a', { locale: dateLocale })}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${entry.delta >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      {entry.delta >= 0 ? '+' : ''}{entry.delta} {t('member.coinUnit')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Badges tab */}
          <TabsContent value="badges" className="mt-4">
            {memberId ? (
              <>
                <BadgeGrid memberId={memberId} />
                <p className="text-[11px] text-muted-foreground text-center mt-4">
                  {t('member.unlockBadgesHint')}
                </p>
              </>
            ) : (
              <Skeleton className="h-32 rounded-xl" />
            )}
          </TabsContent>
        </Tabs>
      </Section>
    </div>
  );
}
