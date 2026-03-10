import { useQuery } from '@tanstack/react-query';
import { fetchMomentumProfile, fetchPointsHistory, fetchRewards, fetchMyRedemptions } from '../features/momentum/api';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { EmptyState } from '@/apps/shared/components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { TierBadge } from '../features/momentum/TierBadge';
import { RewardDropCard } from '../features/momentum/RewardDropCard';
import { useMemberSession } from '../hooks/useMemberSession';
import { useTranslation } from 'react-i18next';
import { Gift, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

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
  const { t } = useLanguage();

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

  const redeemedRewardIds = new Set(redemptions?.map(r => r.rewardId) ?? []);

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title={t('member.rewardWallet')} />

      {/* Balance card */}
      <Section className="mb-6">
        {loadingProfile ? (
          <Skeleton className="h-28 rounded-xl" />
        ) : profile ? (
          <div className="relative rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="h-1 bg-primary" />
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
                    {t('member.momentumCoin')}
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {profile.availablePoints.toLocaleString()}
                    <span className="text-sm font-medium text-muted-foreground ml-1">{t('member.coinUnit')}</span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <TierBadge tier={profile.tier} level={profile.level} />
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Gift className="h-3 w-3" />
                    {t('member.levelLabel').replace('{{n}}', String(profile.level))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState title={t('member.noPointsYet')} description={t('member.noPointsHint')} />
        )}
      </Section>

      {/* Redeemable rewards */}
      <Section title={t('member.redeemableRewards')} className="mb-6">
        {loadingRewards ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
          </div>
        ) : !rewards || rewards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
            <Gift className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-foreground">{t('member.noRewardsAvailable')}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('member.noRewardsHint')}
            </p>
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
      </Section>

      {/* Points History */}
      <Section title={t('member.pointsHistory')} className="mb-8">
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
                      {format(new Date(entry.createdAt), 'MMM d, yyyy · h:mm a')}
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
      </Section>
    </div>
  );
}
