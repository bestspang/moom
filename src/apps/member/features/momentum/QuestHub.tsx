import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemberSession } from '../../hooks/useMemberSession';
import { fetchMyQuests, assignQuests, claimQuest, type QuestInstance } from './api';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Zap, Coins, Target, Clock, Check, Sparkles } from 'lucide-react';
import { useEffect } from 'react';

function QuestInstanceCard({ quest, onClaim }: { quest: QuestInstance; onClaim: (id: string) => void }) {
  const t = quest.template;
  if (!t) return null;

  const progress = Math.min(quest.progressValue / t.goalValue, 1);
  const isCompleted = quest.status === 'completed';
  const isClaimed = quest.status === 'claimed';
  const isExpired = quest.status === 'expired';

  const periodColor = t.questPeriod === 'daily'
    ? 'bg-primary/10 text-primary'
    : t.questPeriod === 'weekly'
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
            <p className="text-sm font-bold text-foreground leading-tight">{t.nameEn}</p>
            {t.descriptionEn && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.descriptionEn}</p>
            )}
          </div>
        </div>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${periodColor}`}>
          {t.questPeriod}
        </span>
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{quest.progressValue} / {t.goalValue}</span>
          <span>{Math.round(progress * 100)}%</span>
        </div>
        <Progress value={progress * 100} className="h-2" />
      </div>

      {/* Rewards + action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {t.xpReward > 0 && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              <Zap className="h-2.5 w-2.5" /> +{t.xpReward} XP
            </span>
          )}
          {t.coinReward > 0 && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600">
              <Coins className="h-2.5 w-2.5" /> +{t.coinReward}
            </span>
          )}
        </div>

        {isClaimed ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600">
            <Check className="h-3.5 w-3.5" /> Claimed
          </span>
        ) : isCompleted ? (
          <Button size="sm" className="h-7 text-xs font-bold px-3" onClick={() => onClaim(quest.id)}>
            <Sparkles className="h-3 w-3 mr-1" /> Claim
          </Button>
        ) : isExpired ? (
          <span className="text-xs font-medium text-muted-foreground">Expired</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" /> In progress
          </span>
        )}
      </div>
    </div>
  );
}

export function QuestHub() {
  const queryClient = useQueryClient();
  const { memberId } = useMemberSession();

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
      toast.success(`+${data.xp_granted} XP, +${data.coin_granted} Coin claimed! 🎉`);
    },
    onError: () => toast.error('Failed to claim quest reward'),
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

  const allEmpty = dailyQuests.length === 0 && weeklyQuests.length === 0 && monthlyQuests.length === 0;

  if (allEmpty) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
        <Target className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm font-medium text-foreground">No quests yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Quests refresh daily — check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {dailyQuests.length > 0 && (
        <div>
          <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            ☀️ Daily Quests
            <span className="text-[10px] font-medium text-muted-foreground">resets daily</span>
          </p>
          <div className="space-y-3">
            {dailyQuests.map(q => (
              <QuestInstanceCard key={q.id} quest={q} onClaim={(id) => claim.mutate(id)} />
            ))}
          </div>
        </div>
      )}

      {weeklyQuests.length > 0 && (
        <div>
          <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            📅 Weekly Quests
            <span className="text-[10px] font-medium text-muted-foreground">resets Mon</span>
          </p>
          <div className="space-y-3">
            {weeklyQuests.map(q => (
              <QuestInstanceCard key={q.id} quest={q} onClaim={(id) => claim.mutate(id)} />
            ))}
          </div>
        </div>
      )}

      {monthlyQuests.length > 0 && (
        <div>
          <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            🏆 Monthly / Seasonal
          </p>
          <div className="space-y-3">
            {monthlyQuests.map(q => (
              <QuestInstanceCard key={q.id} quest={q} onClaim={(id) => claim.mutate(id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
