import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useMemberSession } from '../../hooks/useMemberSession';
import { fetchMyQuests, assignQuests, claimQuest, type QuestInstance } from './api';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Zap, Coins, Target, Clock, Check, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import type { TFunction } from 'i18next';

function QuestInstanceCard({ quest, onClaim, t }: { quest: QuestInstance; onClaim: (id: string) => void; t: TFunction }) {
  const tmpl = quest.template;
  if (!tmpl) return null;

  const progress = Math.min(quest.progressValue / tmpl.goalValue, 1);
  const isCompleted = quest.status === 'completed';
  const isClaimed = quest.status === 'claimed';
  const isExpired = quest.status === 'expired';

  const periodColor = tmpl.questPeriod === 'daily'
    ? 'bg-primary/10 text-primary'
    : tmpl.questPeriod === 'weekly'
    ? 'bg-blue-500/10 text-blue-600'
    : 'bg-amber-500/10 text-amber-600';

  return (
    <div className={`rounded-xl border bg-card p-4 space-y-3 ${isClaimed ? 'opacity-60' : ''} ${isExpired ? 'opacity-40' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Target className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground leading-tight">{tmpl.nameEn}</p>
            {tmpl.descriptionEn && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{tmpl.descriptionEn}</p>
            )}
          </div>
        </div>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${periodColor}`}>
          {tmpl.questPeriod}
        </span>
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{quest.progressValue} / {tmpl.goalValue}</span>
          <span>{Math.round(progress * 100)}%</span>
        </div>
        <Progress value={progress * 100} className="h-2" />
      </div>

      {/* Rewards + action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {tmpl.xpReward > 0 && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              <Zap className="h-2.5 w-2.5" /> +{tmpl.xpReward} XP
            </span>
          )}
          {tmpl.coinReward > 0 && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600">
              <Coins className="h-2.5 w-2.5" /> +{tmpl.coinReward}
            </span>
          )}
        </div>

        {isClaimed ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600">
            <Check className="h-3.5 w-3.5" /> {t('member.questClaimed')}
          </span>
        ) : isCompleted ? (
          <Button size="sm" className="h-7 text-xs font-bold px-3" onClick={() => onClaim(quest.id)}>
            <Sparkles className="h-3 w-3 mr-1" /> {t('member.questClaim')}
          </Button>
        ) : isExpired ? (
          <span className="text-xs font-medium text-muted-foreground">{t('member.questExpired')}</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" /> {t('member.questInProgress')}
          </span>
        )}
      </div>
    </div>
  );
}

interface QuestHubProps {
  filterPeriod?: 'daily' | 'weekly' | 'monthly';
}

export function QuestHub({ filterPeriod }: QuestHubProps = {}) {
  const queryClient = useQueryClient();
  const { memberId } = useMemberSession();
  const { t } = useTranslation();

  const { data: quests, isLoading } = useQuery({
    queryKey: ['my-quests', memberId],
    queryFn: () => fetchMyQuests(memberId!),
    enabled: !!memberId,
  });

  // Auto-assign quests on load if none exist
  useEffect(() => {
    if (!memberId || isLoading || !quests) return;
    const now = new Date();
    const todayStart = new Date(now); todayStart.setUTCHours(0, 0, 0, 0);
    const hasDailyToday = quests.some(q => q.template?.questPeriod === 'daily' && new Date(q.startAt) >= todayStart);
    if (!hasDailyToday) {
      assignQuests(memberId, 'daily').then(() => {
        queryClient.invalidateQueries({ queryKey: ['my-quests', memberId] });
      }).catch(() => {});
    }
    // Check weekly too
    const hasWeekly = quests.some(q => q.template?.questPeriod === 'weekly' && q.status === 'active');
    if (!hasWeekly) {
      assignQuests(memberId, 'weekly').then(() => {
        queryClient.invalidateQueries({ queryKey: ['my-quests', memberId] });
      }).catch(() => {});
    }
  }, [memberId, isLoading, quests, queryClient]);

  const claim = useMutation({
    mutationFn: (questInstanceId: string) => claimQuest(memberId!, questInstanceId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-quests'] });
      queryClient.invalidateQueries({ queryKey: ['momentum-profile'] });
      queryClient.invalidateQueries({ queryKey: ['points-history'] });
      toast.success(t('member.questClaimSuccess', { xp: data.xp_granted, coin: data.coin_granted }));
    },
    onError: () => toast.error(t('member.questClaimFailed')),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
    );
  }

  const dailyQuests = (quests ?? []).filter(q => q.template?.questPeriod === 'daily' && q.status !== 'expired');
  const weeklyQuests = (quests ?? []).filter(q => q.template?.questPeriod === 'weekly' && q.status !== 'expired');
  const monthlyQuests = (quests ?? []).filter(q => q.template?.questPeriod === 'monthly' || q.template?.questPeriod === 'seasonal');

  // If filtering by period, show only that period
  if (filterPeriod === 'daily') {
    if (dailyQuests.length === 0) return <CompactEmptyState t={t} />;
    return (
      <div className="space-y-2.5">
        {dailyQuests.map(q => (
          <QuestInstanceCard key={q.id} quest={q} onClaim={(id) => claim.mutate(id)} t={t} />
        ))}
      </div>
    );
  }
  if (filterPeriod === 'weekly') {
    if (weeklyQuests.length === 0) return <CompactEmptyState t={t} />;
    return (
      <div className="space-y-2.5">
        {weeklyQuests.map(q => (
          <QuestInstanceCard key={q.id} quest={q} onClaim={(id) => claim.mutate(id)} t={t} />
        ))}
      </div>
    );
  }

  const allEmpty = dailyQuests.length === 0 && weeklyQuests.length === 0 && monthlyQuests.length === 0;

  if (allEmpty) {
    return <CompactEmptyState t={t} />;
  }

  return (
    <div className="space-y-5">
      {dailyQuests.length > 0 && (
        <div>
          <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            ☀️ {t('member.dailyQuests')}
            <span className="text-[10px] font-medium text-muted-foreground">{t('member.resetsDaily')}</span>
          </p>
          <div className="space-y-3">
            {dailyQuests.map(q => (
              <QuestInstanceCard key={q.id} quest={q} onClaim={(id) => claim.mutate(id)} t={t} />
            ))}
          </div>
        </div>
      )}

      {weeklyQuests.length > 0 && (
        <div>
          <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            📅 {t('member.weeklyQuests')}
            <span className="text-[10px] font-medium text-muted-foreground">{t('member.resetsMon')}</span>
          </p>
          <div className="space-y-3">
            {weeklyQuests.map(q => (
              <QuestInstanceCard key={q.id} quest={q} onClaim={(id) => claim.mutate(id)} t={t} />
            ))}
          </div>
        </div>
      )}

      {monthlyQuests.length > 0 && (
        <div>
          <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            🏆 {t('member.monthlySeasonal')}
          </p>
          <div className="space-y-3">
            {monthlyQuests.map(q => (
              <QuestInstanceCard key={q.id} quest={q} onClaim={(id) => claim.mutate(id)} t={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
