import { useQuery } from '@tanstack/react-query';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Users, Target, Crown, Medal, Award, CheckCircle2 } from 'lucide-react';
import { useMemberSession } from '@/apps/member/hooks/useMemberSession';
import {
  fetchXpLeaderboard,
  fetchSquadRankings,
  fetchChallengeCompletionStats,
  type LeaderboardEntry,
  type ChallengeCompletionStat,
} from '@/apps/member/features/momentum/api';
import type { SquadInfo } from '@/apps/member/features/momentum/types';
import { cn } from '@/lib/utils';

const RANK_ICONS = [Crown, Medal, Award] as const;
const RANK_COLORS = [
  'text-yellow-500',
  'text-gray-400',
  'text-amber-600',
] as const;

function XpLeaderboardTab({ memberId }: { memberId: string | null }) {
  const { data, isLoading } = useQuery({
    queryKey: ['xp-leaderboard'],
    queryFn: fetchXpLeaderboard,
    staleTime: 60_000,
  });

  if (isLoading) return <LeaderboardSkeleton />;
  if (!data?.length) return <EmptyLeaderboard message="No XP earners yet" />;

  return (
    <div className="space-y-2">
      {data.map((entry) => {
        const isMe = memberId === entry.memberId;
        const RankIcon = entry.rank <= 3 ? RANK_ICONS[entry.rank - 1] : null;
        return (
          <div
            key={entry.memberId}
            className={cn(
              'flex items-center gap-3 rounded-xl bg-card p-3 shadow-sm',
              isMe && 'ring-2 ring-primary'
            )}
          >
            <div className="w-8 text-center flex-shrink-0">
              {RankIcon ? (
                <RankIcon className={cn('h-5 w-5 mx-auto', RANK_COLORS[entry.rank - 1])} />
              ) : (
                <span className="text-sm font-bold text-muted-foreground">{entry.rank}</span>
              )}
            </div>
            <Avatar className="h-9 w-9">
              <AvatarImage src={entry.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xs bg-muted">
                {entry.firstName?.[0]}{entry.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">
                {entry.firstName} {entry.lastName}
                {isMe && <span className="text-primary ml-1">(You)</span>}
              </p>
              <p className="text-xs text-muted-foreground">Lv.{entry.level}</p>
            </div>
            <Badge variant="secondary" className="text-xs font-bold">
              {entry.totalXp.toLocaleString()} XP
            </Badge>
          </div>
        );
      })}
    </div>
  );
}

function SquadRankingsTab({ currentSquadId }: { currentSquadId?: string | null }) {
  const { data, isLoading } = useQuery({
    queryKey: ['squad-rankings'],
    queryFn: fetchSquadRankings,
    staleTime: 60_000,
  });

  if (isLoading) return <LeaderboardSkeleton />;
  if (!data?.length) return <EmptyLeaderboard message="No squads yet" />;

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
                {isMySquad && <span className="text-primary ml-1">(Yours)</span>}
              </p>
              <p className="text-xs text-muted-foreground">
                {(squad as any).memberCount ?? squad.members.length} members
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

function ChallengesTab({ memberId }: { memberId: string | null }) {
  const { data, isLoading } = useQuery({
    queryKey: ['challenge-completion-stats', memberId],
    queryFn: () => fetchChallengeCompletionStats(memberId),
    staleTime: 60_000,
  });

  if (isLoading) return <LeaderboardSkeleton />;
  if (!data?.length) return <EmptyLeaderboard message="No challenges yet" />;

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
              {stat.completedCount} completed
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

function LeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

function EmptyLeaderboard({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <Trophy className="h-10 w-10 mb-2 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export default function MemberLeaderboardPage() {
  const { memberId } = useMemberSession();

  return (
    <div className="pb-24">
      <MobilePageHeader
        title="Leaderboard"
        subtitle="See who's on top 🏆"
      />
      <Section>
        <Tabs defaultValue="xp" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="xp" className="text-xs">🔥 XP</TabsTrigger>
            <TabsTrigger value="squads" className="text-xs">👥 Squads</TabsTrigger>
            <TabsTrigger value="challenges" className="text-xs">🎯 Challenges</TabsTrigger>
          </TabsList>
          <TabsContent value="xp">
            <XpLeaderboardTab memberId={memberId} />
          </TabsContent>
          <TabsContent value="squads">
            <SquadRankingsTab />
          </TabsContent>
          <TabsContent value="challenges">
            <ChallengesTab memberId={memberId} />
          </TabsContent>
        </Tabs>
      </Section>
    </div>
  );
}
