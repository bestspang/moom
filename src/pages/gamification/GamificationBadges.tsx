import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Award, Pencil } from 'lucide-react';
import { useGamificationBadges, type GamificationBadge } from '@/hooks/useGamificationBadges';
import { EmptyState } from '@/components/common';
import { Skeleton } from '@/components/ui/skeleton';
import CreateBadgeDialog from '@/components/gamification/CreateBadgeDialog';

const tierColors: Record<string, string> = {
  bronze: 'bg-amber-700',
  silver: 'bg-gray-400',
  gold: 'bg-yellow-500',
  platinum: 'bg-indigo-400',
};

const GamificationBadges = () => {
  const { t, language } = useLanguage();
  const { data: badges, isLoading } = useGamificationBadges();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GamificationBadge | null>(null);

  const openCreate = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (b: GamificationBadge) => { setEditing(b); setDialogOpen(true); };

  if (isLoading) return <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{t('gamification.badges.description')}</p>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" />{t('gamification.badges.create')}</Button>
      </div>

      {!badges?.length ? (
        <EmptyState icon={<Award className="h-12 w-12" />} message={t('gamification.badges.noBadges')} description={t('gamification.badges.noBadgesDesc')} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {badges.map((badge) => (
            <Card key={badge.id} className="group hover:shadow-md transition-shadow relative">
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => openEdit(badge)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <CardContent className="p-4 text-center">
                <div className={`w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center text-white ${tierColors[badge.tier] || 'bg-muted'}`}>
                  <Award className="h-7 w-7" />
                </div>
                <p className="font-medium text-sm">{language === 'th' && badge.name_th ? badge.name_th : badge.name_en}</p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">{badge.tier}</p>
                <p className="text-xs text-muted-foreground mt-1">{language === 'th' && badge.description_th ? badge.description_th : badge.description_en}</p>
                <span className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full ${badge.is_active ? 'bg-accent-teal/10 text-accent-teal' : 'bg-muted text-muted-foreground'}`}>
                  {badge.is_active ? t('common.active') : t('common.inactive')}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateBadgeDialog open={dialogOpen} onOpenChange={setDialogOpen} editingBadge={editing} />
    </div>
  );
};

export default GamificationBadges;
