import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Target, Pencil } from 'lucide-react';
import { StatusTabs, type StatusTab } from '@/components/common/StatusTabs';
import { EmptyState } from '@/components/common';
import { useGamificationChallenges, type GamificationChallenge } from '@/hooks/useGamificationChallenges';
import { StatusBadge } from '@/components/common';
import { format } from 'date-fns';
import { getDateLocale } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import CreateChallengeDialog from '@/components/gamification/CreateChallengeDialog';

const statusVariantMap: Record<string, any> = {
  draft: 'default',
  active: 'active',
  ended: 'inactive',
};

const GamificationChallenges = () => {
  const { t, language } = useLanguage();
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: challenges, isLoading } = useGamificationChallenges(statusFilter);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GamificationChallenge | null>(null);

  const statusLabelMap: Record<string, string> = {
    draft: t('gamification.challenges.draft'),
    active: t('common.active'),
    ended: t('gamification.challenges.ended'),
  };

  const statusTabs: StatusTab[] = [
    { key: 'all', label: t('common.all'), count: challenges?.length ?? 0 },
    { key: 'draft', label: t('gamification.challenges.draft'), count: challenges?.filter(c => c.status === 'draft').length ?? 0, color: 'gray' },
    { key: 'active', label: t('common.active'), count: challenges?.filter(c => c.status === 'active').length ?? 0, color: 'teal' },
    { key: 'ended', label: t('gamification.challenges.ended'), count: challenges?.filter(c => c.status === 'ended').length ?? 0, color: 'orange' },
  ];

  const typeLabel = (type: string) => {
    const map: Record<string, string> = { daily: t('gamification.challenges.daily'), weekly: t('gamification.challenges.weekly'), seasonal: t('gamification.challenges.seasonal') };
    return map[type] || type;
  };

  const openCreate = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (c: GamificationChallenge) => { setEditing(c); setDialogOpen(true); };

  if (isLoading) return <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{t('gamification.challenges.description')}</p>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" />{t('gamification.challenges.create')}</Button>
      </div>

      <StatusTabs tabs={statusTabs} activeTab={statusFilter} onChange={setStatusFilter} />

      {!challenges?.length ? (
        <EmptyState icon={<Target className="h-12 w-12" />} message={t('gamification.challenges.noChallenges')} description={t('gamification.challenges.noChallengesDesc')} />
      ) : (
        <div className="space-y-3">
          {challenges.map((c) => (
            <Card key={c.id} className="group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm">{language === 'th' && c.name_th ? c.name_th : c.name_en}</h3>
                      <StatusBadge variant={statusVariantMap[c.status] || 'default'}>{statusLabelMap[c.status] || c.status}</StatusBadge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{language === 'th' && c.description_th ? c.description_th : c.description_en}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(c.start_date), 'dd MMM')} — {format(new Date(c.end_date), 'dd MMM yyyy')}</span>
                      <span className="flex items-center gap-1"><Target className="h-3 w-3" />{c.goal_value}× {c.goal_action_key || c.goal_type}</span>
                    </div>
                  </div>
                  <div className="text-right text-xs flex flex-col items-end gap-1">
                    <span className="inline-block px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">{typeLabel(c.type)}</span>
                    <div className="space-x-2">
                      {c.reward_xp > 0 && <span className="text-accent-teal">+{c.reward_xp} XP</span>}
                      {c.reward_points > 0 && <span className="text-primary">+{c.reward_points} pts</span>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" onClick={() => openEdit(c)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateChallengeDialog open={dialogOpen} onOpenChange={setDialogOpen} editingChallenge={editing} />
    </div>
  );
};

export default GamificationChallenges;
