import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSquadActivityFeed, fetchSquadFeedReactions, toggleSquadFeedReaction, type FeedReaction } from './api';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNowStrict } from 'date-fns';
import { Zap, Flame } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface Props {
  squadId: string;
}

function getActivityLabel(eventType: string, actionKey: string | null, t: (k: string) => string): string {
  if (eventType === 'check_in' || actionKey === 'check_in') return t('member.activityCheckedIn');
  if (eventType === 'badge_earned') return t('member.activityEarnedBadge');
  if (eventType === 'quest_completed') return t('member.activityCompletedQuest');
  if (eventType === 'level_up') return t('member.activityLeveledUp');
  return t('member.activityEarnedXp');
}

export function SquadActivityFeed({ squadId }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: feed, isLoading } = useQuery({
    queryKey: ['squad-activity-feed', squadId],
    queryFn: () => fetchSquadActivityFeed(squadId),
    enabled: !!squadId,
    staleTime: 60_000,
  });

  const auditLogIds = (feed ?? []).map(e => e.auditLogId);

  const { data: reactionsMap } = useQuery({
    queryKey: ['squad-feed-reactions', auditLogIds.join(',')],
    queryFn: () => fetchSquadFeedReactions(auditLogIds),
    enabled: auditLogIds.length > 0,
    staleTime: 30_000,
  });

  // Optimistic local state
  const [localReactions, setLocalReactions] = useState<Map<string, FeedReaction>>(new Map());

  useEffect(() => {
    if (reactionsMap) setLocalReactions(new Map(reactionsMap));
  }, [reactionsMap]);

  const toggleMutation = useMutation({
    mutationFn: toggleSquadFeedReaction,
    onSuccess: (result, auditLogId) => {
      setLocalReactions(prev => {
        const next = new Map(prev);
        next.set(auditLogId, result);
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['squad-feed-reactions'] });
    },
    onError: () => toast.error(t('member.reactionFailed')),
  });

  const handleToggle = useCallback((auditLogId: string) => {
    // Optimistic update
    setLocalReactions(prev => {
      const next = new Map(prev);
      const current = next.get(auditLogId) ?? { count: 0, reactedByMe: false };
      next.set(auditLogId, {
        count: current.reactedByMe ? Math.max(0, current.count - 1) : current.count + 1,
        reactedByMe: !current.reactedByMe,
      });
      return next;
    });
    toggleMutation.mutate(auditLogId);
  }, [toggleMutation]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
      </div>
    );
  }

  if (!feed || feed.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        {t('member.noActivityYet')}
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {feed.map((entry, i) => {
        const initial = (entry.firstName ?? '?').charAt(0).toUpperCase();
        const timeAgo = formatDistanceToNowStrict(new Date(entry.createdAt), { addSuffix: true });
        const label = getActivityLabel(entry.eventType, entry.actionKey, t);
        const reaction = localReactions.get(entry.auditLogId);
        const reactedByMe = reaction?.reactedByMe ?? false;
        const reactionCount = reaction?.count ?? 0;

        return (
          <div key={entry.auditLogId} className="flex items-center gap-2.5 rounded-lg px-3 py-2 bg-card/50">
            <div
              className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
              style={{
                backgroundColor: `hsl(${(i * 47) % 360}, 55%, 85%)`,
                color: `hsl(${(i * 47) % 360}, 55%, 30%)`,
              }}
            >
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground truncate">
                <span className="font-medium">{entry.firstName ?? t('member.memberLabel')}</span>{' '}
                <span className="text-muted-foreground">{label}</span>
              </p>
            </div>
            {entry.xpDelta > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-primary flex-shrink-0">
                <Zap className="h-2.5 w-2.5" />+{entry.xpDelta}
              </span>
            )}
            <button
              onClick={() => handleToggle(entry.auditLogId)}
              className={`flex items-center gap-0.5 text-[10px] font-medium flex-shrink-0 rounded-full px-1.5 py-0.5 transition-all active:scale-110 ${
                reactedByMe
                  ? 'text-orange-500 bg-orange-500/10'
                  : 'text-muted-foreground hover:text-orange-400'
              }`}
              aria-label={t('member.cheer')}
            >
              <Flame className={`h-3 w-3 transition-transform ${reactedByMe ? 'scale-110' : ''}`} />
              {reactionCount > 0 && <span>{reactionCount}</span>}
            </button>
            <span className="text-[10px] text-muted-foreground flex-shrink-0">{timeAgo}</span>
          </div>
        );
      })}
    </div>
  );
}
