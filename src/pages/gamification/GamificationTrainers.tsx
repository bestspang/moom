import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGamificationTrainerTiers } from '@/hooks/useGamificationAudit';
import { EmptyState } from '@/components/common';
import { UserCheck, Handshake } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const GamificationTrainers = () => {
  const { t, language } = useLanguage();
  const { data: tiers, isLoading } = useGamificationTrainerTiers();

  const inHouse = tiers?.filter((t: any) => t.trainer_type === 'in_house') ?? [];
  const freelance = tiers?.filter((t: any) => t.trainer_type === 'freelance') ?? [];

  if (isLoading) return <div className="space-y-3">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t('gamification.trainers.description')}</p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm"><UserCheck className="h-4 w-4" />{t('gamification.trainers.inHouse')}</CardTitle>
        </CardHeader>
        <CardContent>
          {!inHouse.length ? (
            <EmptyState icon={<UserCheck className="h-12 w-12" />} message={t('gamification.trainers.noTiers')} description={t('gamification.trainers.noTiersDesc')} />
          ) : (
            <div className="space-y-2">
              {inHouse.map((tier: any) => (
                <div key={tier.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-sm">{language === 'th' && tier.tier_name_th ? tier.tier_name_th : tier.tier_name_en}</p>
                    <p className="text-xs text-muted-foreground">{t('gamification.trainers.minScore')}: {tier.min_score}</p>
                  </div>
                  <span className={`text-xs ${tier.is_active ? 'text-accent-teal' : 'text-muted-foreground'}`}>
                    {tier.is_active ? t('common.active') : t('common.inactive')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm"><Handshake className="h-4 w-4" />{t('gamification.trainers.freelance')}</CardTitle>
        </CardHeader>
        <CardContent>
          {!freelance.length ? (
            <EmptyState icon={<Handshake className="h-12 w-12" />} message={t('gamification.trainers.noTiers')} description={t('gamification.trainers.noTiersDesc')} />
          ) : (
            <div className="space-y-2">
              {freelance.map((tier: any) => (
                <div key={tier.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-sm">{language === 'th' && tier.tier_name_th ? tier.tier_name_th : tier.tier_name_en}</p>
                    <p className="text-xs text-muted-foreground">{t('gamification.trainers.minScore')}: {tier.min_score}</p>
                  </div>
                  <span className={`text-xs ${tier.is_active ? 'text-accent-teal' : 'text-muted-foreground'}`}>
                    {tier.is_active ? t('common.active') : t('common.inactive')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GamificationTrainers;
