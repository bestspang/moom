import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, Target, CheckCircle2, Flame, MapPin } from 'lucide-react';
import { useMemberSession } from '@/apps/member/hooks/useMemberSession';
import {
  fetchXpLeaderboardByWindow,
  fetchSquadRankings,
  fetchChallengeCompletionStats,
  fetchStreakLeaderboard,
  fetchAttendanceLeaderboard,
  fetchAroundMeByWindow,
  type LeaderboardEntry,
  type ChallengeCompletionStat,
  type LeaderboardTimeWindow,
} from '@/apps/member/features/momentum/api';
import type { SquadInfo } from '@/apps/member/features/momentum/types';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { LeaderboardEntryRow } from '@/apps/member/features/momentum/leaderboard/LeaderboardEntryRow';
import { LeaderboardSkeleton, EmptyLeaderboard } from '@/apps/member/features/momentum/leaderboard/LeaderboardSkeleton';
import { FilterChips } from '@/apps/shared/components/FilterChips';
import { Crown, Medal, Award } from 'lucide-react';

const RANK_ICONS = [Crown, Medal, Award] as const;
const RANK_COLORS = [
  'text-yellow-500',
  'text-gray-400',
  'text-amber-600',
] as const;

function XpLeaderboardTab({ memberId, t }: { memberId: string | null; t: (key: string, opts?: any) => string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['xp-leaderboard'],
    queryFn: fetchXpLeaderboard,
    staleTime: 60_000,
  });

  const { data: aroundMe } = useQuery({
    queryKey: ['around-me-leaderboard', memberId],
    queryFn: () => fetchAroundMeLeaderboard(memberId!),
    enabled: !!memberId,
    staleTime: 60_000,
  });

  if (isLoading) return <LeaderboardSkeleton />;
  if (!data?.length) return <EmptyLeaderboard message={t('member.noXpEarnersYet')} />;

  // Check if user is in top 20
  const isInTop20 = memberId && data.some(e => e.memberId === memberId);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {data.map((entry) => (
          <LeaderboardEntryRow
            key={entry.memberId}
            rank={entry.rank}
            firstName={entry.firstName}
            lastName={entry.lastName}
            avatarUrl={entry.avatarUrl}
            isMe={memberId === entry.memberId}
            badge={`${entry.totalXp.toLocaleString()} XP`}
            subtitle={`Lv.${entry.level}`}
            youLabel={t('member.youLabel')}
          />
        ))}
      </div>

      {/* Around You section — only show if user is NOT in top 20 */}
      {!isInTop20 && aroundMe && aroundMe.length > 0 && (
        <div className="pt-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">
            {t('member.aroundYou')}
          </p>
          <div className="space-y-2">
            {aroundMe.map((entry) => (
              <LeaderboardEntryRow
                key={entry.memberId}
                rank={entry.rank}
                firstName={entry.firstName}
                lastName={entry.lastName}
                avatarUrl={entry.avatarUrl}
                isMe={memberId === entry.memberId}
                badge={`${entry.totalXp.toLocaleString()} XP`}
                subtitle={`Lv.${entry.level}`}
                youLabel={t('member.youLabel')}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SquadRankingsTab({ currentSquadId, t }: { currentSquadId?: string | null; t: (key: string, opts?: any) => string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['squad-rankings'],
    queryFn: fetchSquadRankings,
    staleTime: 60_000,
  });

  if (isLoading) return <LeaderboardSkeleton />;
  if (!data?.length) return <EmptyLeaderboard message={t('member.noSquadsYet')} />;

  return (
    <div className="space-y-2">
      {data.map((squad: SquadInfo & { memberCount?: number }, idx: number) => {
        const rank = idx + 1;
        const isMySquad = currentSquadId === squad.id;
        const RankIcon = rank <= 3 ? RANK_ICONS[rank - 1] : null;
        return (
          <div
            key={squad.id}
            className={cn(
              'flex items-center gap-3 rounded-xl bg-card p-3 shadow-sm',
              isMySquad && 'ring-2 ring-primary'
            )}
          >
            <div className="w-8 text-center flex-shrink-0">
              {RankIcon ? (
                <RankIcon className={cn('h-5 w-5 mx-auto', RANK_COLORS[rank - 1])} />
              ) : (
                <span className="text-sm font-bold text-muted-foreground">{rank}</span>
              )}
            </div>
            <Users className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">
                {squad.name}
                {isMySquad && <span className="text-primary ml-1">{t('member.yoursLabel')}</span>}
              </p>
              <p className="text-xs text-muted-foreground">
                {(squad as any).memberCount ?? squad.members.length} {t('member.membersLabel')}
              </p>
            </div>
            <Badge variant="secondary" className="text-xs font-bold">
              {squad.totalXp.toLocaleString()} XP
            </Badge>
          </div>
        );
      })}
    </div>
  );
}

function ChallengesTab({ memberId, t }: { memberId: string | null; t: (key: string) => string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['challenge-completion-stats', memberId],
    queryFn: () => fetchChallengeCompletionStats(memberId),
    staleTime: 60_000,
  });

  if (isLoading) return <LeaderboardSkeleton />;
  if (!data?.length) return <EmptyLeaderboard message={t('member.noChallengesYet')} />;

  return (
    <div className="space-y-2">
      {data.map((stat: ChallengeCompletionStat) => (
        <div
          key={stat.challengeId}
          className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-sm"
        >
          <Target className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">{stat.nameEn}</p>
            <p className="text-xs text-muted-foreground">
              {stat.completedCount} {t('member.completedLabel')}
            </p>
          </div>
          {stat.currentUserCompleted && (
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

function StreaksTab({ memberId, t }: { memberId: string | null; t: (key: string, opts?: any) => string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['streak-leaderboard'],
    queryFn: fetchStreakLeaderboard,
    staleTime: 60_000,
  });

  if (isLoading) return <LeaderboardSkeleton />;
  if (!data?.length) return <EmptyLeaderboard message={t('member.noStreakDataYet')} />;

  return (
    <div className="space-y-2">
      {data.map((entry) => (
        <LeaderboardEntryRow
          key={entry.memberId}
          rank={entry.rank}
          firstName={entry.firstName}
          lastName={entry.lastName}
          avatarUrl={entry.avatarUrl}
          isMe={memberId === entry.memberId}
          badge={t('member.dayStreak', { count: entry.currentStreak ?? 0 })}
          subtitle={`Lv.${entry.level}`}
          youLabel={t('member.youLabel')}
        />
      ))}
    </div>
  );
}

function AttendanceTab({ memberId, t }: { memberId: string | null; t: (key: string, opts?: any) => string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['attendance-leaderboard'],
    queryFn: fetchAttendanceLeaderboard,
    staleTime: 60_000,
  });

  if (isLoading) return <LeaderboardSkeleton />;
  if (!data?.length) return <EmptyLeaderboard message={t('member.noAttendanceYet')} />;

  return (
    <div className="space-y-2">
      {data.map((entry) => (
        <LeaderboardEntryRow
          key={entry.memberId}
          rank={entry.rank}
          firstName={entry.firstName}
          lastName={entry.lastName}
          avatarUrl={entry.avatarUrl}
          isMe={memberId === entry.memberId}
          badge={t('member.checkInsThisMonth', { count: entry.checkInCount ?? 0 })}
          youLabel={t('member.youLabel')}
        />
      ))}
    </div>
  );
}

export default function MemberLeaderboardPage() {
  const { memberId } = useMemberSession();
  const { t } = useTranslation();

  return (
    <div className="pb-24">
      <MobilePageHeader
        title={t('member.leaderboard')}
        subtitle={t('member.leaderboardSubtitle')}
      />
      <Section>
        <Tabs defaultValue="xp" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="xp" className="text-xs">{t('member.tabXp')}</TabsTrigger>
            <TabsTrigger value="squads" className="text-xs">{t('member.tabSquads')}</TabsTrigger>
            <TabsTrigger value="challenges" className="text-xs">{t('member.tabChallenges')}</TabsTrigger>
            <TabsTrigger value="streaks" className="text-xs">{t('member.tabStreaks')}</TabsTrigger>
            <TabsTrigger value="attendance" className="text-xs">{t('member.tabAttendance')}</TabsTrigger>
          </TabsList>
          <TabsContent value="xp">
            <XpLeaderboardTab memberId={memberId} t={t} />
          </TabsContent>
          <TabsContent value="squads">
            <SquadRankingsTab t={t} />
          </TabsContent>
          <TabsContent value="challenges">
            <ChallengesTab memberId={memberId} t={t} />
          </TabsContent>
          <TabsContent value="streaks">
            <StreaksTab memberId={memberId} t={t} />
          </TabsContent>
          <TabsContent value="attendance">
            <AttendanceTab memberId={memberId} t={t} />
          </TabsContent>
        </Tabs>
      </Section>
    </div>
  );
}
