import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGamificationTrainerTiers } from '@/hooks/useGamificationAudit';
import { EmptyState } from '@/components/common';
import { UserCheck, Handshake, Plus, Pencil } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import CreateTrainerTierDialog from '@/components/gamification/CreateTrainerTierDialog';

const GamificationTrainers = () => {
  const { t, language } = useLanguage();
  const { data: tiers, isLoading } = useGamificationTrainerTiers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [defaultType, setDefaultType] = useState('in_house');

  const inHouse = tiers?.filter((t: any) => t.trainer_type === 'in_house') ?? [];
  const freelance = tiers?.filter((t: any) => t.trainer_type === 'freelance') ?? [];

  const openCreate = (type: string) => { setEditing(null); setDefaultType(type); setDialogOpen(true); };
  const openEdit = (tier: any) => { setEditing(tier); setDialogOpen(true); };

  if (isLoading) return <div className="space-y-3">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>;

  const renderTierList = (items: any[], type: string, Icon: React.ElementType, title: string) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm"><Icon className="h-4 w-4" />{title}</CardTitle>
        <Button size="sm" variant="outline" onClick={() => openCreate(type)}><Plus className="h-4 w-4 mr-1" />Add Tier</Button>
      </CardHeader>
      <CardContent>
        {!items.length ? (
          <EmptyState icon={<Icon className="h-12 w-12" />} message={t('gamification.trainers.noTiers')} description={t('gamification.trainers.noTiersDesc')} />
        ) : (
          <div className="space-y-2">
            {items.map((tier: any) => (
              <div key={tier.id} className="flex items-center justify-between p-3 rounded-lg border border-border group hover:bg-muted/30 transition-colors">
                <div>
                  <p className="font-medium text-sm">{language === 'th' && tier.tier_name_th ? tier.tier_name_th : tier.tier_name_en}</p>
                  <p className="text-xs text-muted-foreground">{t('gamification.trainers.minScore')}: {tier.min_score}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${tier.is_active ? 'text-accent-teal' : 'text-muted-foreground'}`}>
                    {tier.is_active ? t('common.active') : t('common.inactive')}
                  </span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => openEdit(tier)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t('gamification.trainers.description')}</p>
      {renderTierList(inHouse, 'in_house', UserCheck, t('gamification.trainers.inHouse'))}
      {renderTierList(freelance, 'freelance', Handshake, t('gamification.trainers.freelance'))}
      <CreateTrainerTierDialog open={dialogOpen} onOpenChange={setDialogOpen} editingTier={editing} defaultType={defaultType} />
    </div>
  );
};

export default GamificationTrainers;
