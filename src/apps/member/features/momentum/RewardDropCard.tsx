import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fireGamificationEvent } from '@/lib/gamificationEvents';
import { redeemReward } from './api';
import { TIER_CONFIG, type MomentumTier, type RewardItem } from './types';
import { Gift, Lock, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface RewardDropCardProps {
  reward: RewardItem;
  memberId: string;
  userLevel: number;
  userPoints: number;
  alreadyRedeemed: boolean;
}

export function RewardDropCard({ reward, memberId, userLevel, userPoints, alreadyRedeemed }: RewardDropCardProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const levelLocked = userLevel < reward.levelRequired;
  const pointsLocked = userPoints < reward.pointsCost;
  const soldOut = !reward.isUnlimited && reward.stock !== null && reward.redeemedCount >= reward.stock;
  const canClaim = !levelLocked && !pointsLocked && !soldOut && !alreadyRedeemed;
  const remaining = !reward.isUnlimited && reward.stock !== null ? reward.stock - reward.redeemedCount : null;
  const isLimited = remaining !== null && remaining <= 5 && !soldOut;

  const claimMutation = useMutation({
    mutationFn: () => redeemReward(memberId, reward.id, reward.pointsCost),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification-rewards-member'] });
      queryClient.invalidateQueries({ queryKey: ['my-redemptions'] });
      queryClient.invalidateQueries({ queryKey: ['momentum-profile'] });
      toast.success(t('member.rewardClaimed'));
      fireGamificationEvent({
        event_type: 'reward_redeemed',
        member_id: memberId,
        idempotency_key: `reward_redeemed:${memberId}:${reward.id}:${Date.now()}`,
        metadata: { reward_id: reward.id, points_spent: reward.pointsCost },
      });
    },
    onError: () => toast.error(t('member.rewardClaimFailed')),
  });

  return (
    <div className={cn(
      'relative rounded-2xl border bg-card shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
      levelLocked && 'opacity-60',
    )}>
      {/* Image placeholder */}
      <div className="relative h-32 bg-muted flex items-center justify-center overflow-hidden">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card/80">
          <Gift className="h-7 w-7 text-muted-foreground/40" />
        </div>

        {isLimited && !levelLocked && (
          <div className="absolute top-3 -left-7 w-28 text-center py-1 text-[9px] font-black uppercase tracking-wider text-primary-foreground bg-destructive -rotate-45">
            {t('member.limitedLabel')}
          </div>
        )}

        {levelLocked && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <Lock className="h-5 w-5 text-muted-foreground animate-pulse" />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {t('member.levelRequired', { level: reward.levelRequired })}
            </span>
          </div>
        )}

        {soldOut && !levelLocked && (
          <div className="absolute top-2.5 right-2.5 rounded-full bg-destructive/90 px-2.5 py-1 text-[10px] font-black text-destructive-foreground uppercase tracking-wider">
            {t('member.soldOut')}
          </div>
        )}

        {remaining !== null && !soldOut && !levelLocked && (
          <div className="absolute top-2.5 right-2.5 rounded-full bg-card/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold text-foreground shadow-sm">
            {t('member.itemsLeft', { n: remaining })}
          </div>
        )}
      </div>

      <div className="p-3">
        {/* Reward type label */}
        {reward.rewardType && reward.rewardType !== 'digital' && (
          <span className="inline-block text-[8px] font-black uppercase tracking-widest rounded-full px-2 py-0.5 bg-accent text-accent-foreground mb-1.5">
            {reward.rewardType === 'hybrid' ? t('member.coinPlusCash') : reward.rewardType}
          </span>
        )}
        <h3 className="text-sm font-bold text-foreground line-clamp-1">{reward.nameEn}</h3>
        {reward.descriptionEn && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{reward.descriptionEn}</p>
        )}

        <div className="flex items-center justify-between mt-3">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-black text-primary">
              <Gift className="h-4 w-4" />
              {reward.pointsCost}
            </div>
            {(reward.cashPrice ?? 0) > 0 && (
              <span className="text-[10px] font-bold text-muted-foreground text-center">
                + ฿{Number(reward.cashPrice).toLocaleString()}
              </span>
            )}
          </div>

          {alreadyRedeemed ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
              <Check className="h-4 w-4" /> {t('member.claimedLabel')}
            </div>
          ) : (
            <Button
              size="sm"
              variant={canClaim ? 'default' : 'outline'}
              disabled={!canClaim || claimMutation.isPending}
              onClick={() => claimMutation.mutate()}
              className="h-8 text-xs px-3 font-bold"
            >
              {claimMutation.isPending ? t('member.claimingLabel') : pointsLocked ? t('member.notEnoughPoints') : (
                <><Sparkles className="h-3.5 w-3.5 mr-1" />{t('member.claimReward')}</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
