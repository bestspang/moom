import { useNavigate } from 'react-router-dom';
import { Gift, ChevronRight, Lock, Coins, Info } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import type { RewardItem } from './types';
import { useTranslation } from 'react-i18next';

interface RewardPreviewProps {
  rewards: RewardItem[];
  userLevel: number;
  userPoints: number;
}

export function RewardPreview({ rewards, userLevel, userPoints }: RewardPreviewProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!rewards || rewards.length === 0) return null;

  const sorted = [...rewards]
    .filter(r => r.isActive)
    .sort((a, b) => a.pointsCost - b.pointsCost)
    .slice(0, 6);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          🎁 {t('member.rewards')}
        </p>
        <button
          onClick={() => navigate('/member/rewards')}
          className="flex items-center gap-0.5 text-xs font-semibold text-primary"
        >
          {t('member.viewAll')} <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-2">
          {sorted.map(reward => {
            const canAfford = userPoints >= reward.pointsCost;
            const levelLocked = userLevel < reward.levelRequired;
            return (
              <div
                key={reward.id}
                className="flex-shrink-0 w-32 rounded-xl border bg-card p-3 space-y-2"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  {levelLocked ? (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Gift className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="flex items-start gap-1">
                  <p className="text-xs font-bold text-foreground line-clamp-2 leading-tight flex-1">
                    {reward.nameEn}
                  </p>
                  {reward.descriptionEn && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5">
                          <Info className="h-3 w-3" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 text-xs space-y-1.5">
                        <p className="font-bold text-foreground">{reward.nameEn}</p>
                        <p className="text-muted-foreground leading-relaxed">{reward.descriptionEn}</p>
                        <p className="text-muted-foreground"><span className="font-semibold text-foreground">Cost:</span> {reward.pointsCost} pts</p>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold">
                  <Coins className="h-2.5 w-2.5" />
                  <span className={canAfford ? 'text-primary' : 'text-muted-foreground'}>
                    {reward.pointsCost}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
