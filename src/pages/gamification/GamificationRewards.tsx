import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Gift, Package, Star, Ticket, Dumbbell, Pencil } from 'lucide-react';
import { useGamificationRewards, type GamificationReward } from '@/hooks/useGamificationRewards';
import { EmptyState } from '@/components/common';
import { Skeleton } from '@/components/ui/skeleton';
import CreateRewardDialog from '@/components/gamification/CreateRewardDialog';

const categoryIcons: Record<string, React.ElementType> = {
  perk: Star,
  merch: Package,
  access: Ticket,
  package_booster: Dumbbell,
  event: Gift,
};

const GamificationRewards = () => {
  const { t, language } = useLanguage();
  const { data: rewards, isLoading } = useGamificationRewards();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GamificationReward | null>(null);

  const categoryLabelMap: Record<string, string> = {
    perk: t('gamification.rewards.categoryPerk'),
    merch: t('gamification.rewards.categoryMerch'),
    access: t('gamification.rewards.categoryAccess'),
    package_booster: t('gamification.rewards.categoryPackageBooster'),
    event: t('gamification.rewards.categoryEvent'),
  };

  const openCreate = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (r: GamificationReward) => { setEditing(r); setDialogOpen(true); };

  if (isLoading) return <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{t('gamification.rewards.description')}</p>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" />{t('gamification.rewards.create')}</Button>
      </div>

      {!rewards?.length ? (
        <EmptyState icon={<Gift className="h-12 w-12" />} message={t('gamification.rewards.noRewards')} description={t('gamification.rewards.noRewardsDesc')} />
      ) : (
        <div className="space-y-3">
          {rewards.map((reward) => {
            const Icon = categoryIcons[reward.category] || Gift;
            const stockText = reward.is_unlimited ? '∞' : `${(reward.stock ?? 0) - reward.redeemed_count} / ${reward.stock}`;
            return (
              <Card key={reward.id} className="group">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{language === 'th' && reward.name_th ? reward.name_th : reward.name_en}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{categoryLabelMap[reward.category] || reward.category}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{language === 'th' && reward.description_th ? reward.description_th : reward.description_en}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-sm text-primary">{reward.points_cost.toLocaleString()} pts</p>
                    {reward.level_required > 0 && <p className="text-[10px] text-muted-foreground">Lv.{reward.level_required}+</p>}
                    <p className="text-[10px] text-muted-foreground">{t('gamification.rewards.stock')}: {stockText}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={() => openEdit(reward)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateRewardDialog open={dialogOpen} onOpenChange={setDialogOpen} editingReward={editing} />
    </div>
  );
};

export default GamificationRewards;
