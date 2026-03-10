import { useQuery } from '@tanstack/react-query';
import { fetchSquadActivityFeed } from './api';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNowStrict } from 'date-fns';
import { Zap } from 'lucide-react';

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

  const { data: feed, isLoading } = useQuery({
    queryKey: ['squad-activity-feed', squadId],
    queryFn: () => fetchSquadActivityFeed(squadId),
    enabled: !!squadId,
    staleTime: 60_000,
  });

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

        return (
          <div key={`${entry.createdAt}-${i}`} className="flex items-center gap-2.5 rounded-lg px-3 py-2 bg-card/50">
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
            <span className="text-[10px] text-muted-foreground flex-shrink-0">{timeAgo}</span>
          </div>
        );
      })}
    </div>
  );
}
