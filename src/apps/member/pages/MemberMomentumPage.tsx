import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useMemberSession } from '../hooks/useMemberSession';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { EmptyState } from '@/apps/shared/components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TierBadge } from '../features/momentum/TierBadge';
import { XPProgressBar } from '../features/momentum/XPProgressBar';
import { StreakFlame } from '../features/momentum/StreakFlame';
import { StreakFreezeButton } from '../features/momentum/StreakFreezeButton';
import { QuestCard } from '../features/momentum/QuestCard';
import { QuestHub } from '../features/momentum/QuestHub';
import { RewardDropCard } from '../features/momentum/RewardDropCard';
import {
  fetchMomentumProfile,
  fetchActiveChallenges,
  fetchMyChallengeProgress,
  fetchMyBadges,
  fetchRewards,
  fetchMyRedemptions,
  fetchPointsHistory,
} from '../features/momentum/api';
import { xpForLevel, type ChallengeProgressEntry } from '../features/momentum/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Zap, Gift, Target, Trophy, Award, Clock,
  ChevronRight, Sparkles, Shield, ScanLine,
} from 'lucide-react';
import { DailyBonusCard } from '../features/momentum/DailyBonusCard';
import { LevelRequirementsCard } from '../features/momentum/LevelRequirementsCard';
import { LevelPerksCard } from '../features/momentum/LevelPerksCard';

const EVENT_LABELS: Record<string, string> = {
  checkin: 'Check-in',
  quest_complete: 'Quest',
  streak_bonus: 'Streak Bonus',
  challenge_complete: 'Challenge',
  referral: 'Referral',
  purchase: 'Purchase',
  badge_earned: 'Badge Earned',
  rule_reward: 'Activity Reward',
  redemption: 'Redemption',
};

const BADGE_TIER_COLORS: Record<string, string> = {
  bronze: 'border-amber-400/50',
  silver: 'border-slate-400/50',
  gold: 'border-yellow-400/50',
  platinum: 'border-violet-400/50',
};

const RARITY_LABELS: Record<string, { label: string; className: string }> = {
  bronze: { label: 'Common', className: 'text-muted-foreground' },
  silver: { label: 'Rare', className: 'text-blue-500' },
  gold: { label: 'Epic', className: 'text-yellow-500' },
  platinum: { label: 'Legendary', className: 'text-violet-500' },
};

export default function MemberMomentumPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { memberId } = useMemberSession();

  // ── Queries ──
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['momentum-profile', memberId],
    queryFn: () => fetchMomentumProfile(memberId!),
    enabled: !!memberId,
  });

  const { data: activeChallenges } = useQuery({
    queryKey: ['active-challenges'],
    queryFn: fetchActiveChallenges,
    enabled: !!memberId,
  });

  const { data: myProgress } = useQuery({
    queryKey: ['my-challenges', memberId],
    queryFn: () => fetchMyChallengeProgress(memberId!),
    enabled: !!memberId,
  });

  const { data: badges } = useQuery({
    queryKey: ['my-badges', memberId],
    queryFn: () => fetchMyBadges(memberId!),
    enabled: !!memberId,
  });

  const { data: rewards, isLoading: loadingRewards } = useQuery({
    queryKey: ['gamification-rewards-member'],
    queryFn: fetchRewards,
  });

  const { data: redemptions } = useQuery({
    queryKey: ['my-redemptions', memberId],
    queryFn: () => fetchMyRedemptions(memberId!),
    enabled: !!memberId,
  });

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ['points-history', memberId],
    queryFn: () => fetchPointsHistory(memberId!),
    enabled: !!memberId,
  });

  // ── Join challenge mutation ──
  const joinChallenge = useMutation({
    mutationFn: async (challengeId: string) => {
      if (!memberId) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('challenge_progress')
        .insert([{ challenge_id: challengeId, member_id: memberId, current_value: 0, status: 'in_progress' as const }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-challenges'] });
      toast.success('Challenge joined! 🎯');
    },
    onError: () => toast.error('Failed to join challenge'),
  });

  // ── Derived data ──
  const progressMap = new Map(
    (myProgress ?? []).map(p => [p.challengeId, p])
  );

  const redeemedRewardIds = new Set(redemptions?.map(r => r.rewardId) ?? []);

  // Separate active quests (joined, not completed) and available (not joined)
  const joinedQuests: ChallengeProgressEntry[] = (myProgress ?? []).filter(p => p.status !== 'completed' && p.challenge);
  const completedQuests: ChallengeProgressEntry[] = (myProgress ?? []).filter(p => p.status === 'completed' && p.challenge);
  const availableChallenges = (activeChallenges ?? []).filter(c => !progressMap.has(c.id));

  const currentLevelXP = profile ? xpForLevel(profile.level - 1) : 0;
  const nextLevelXP = profile ? xpForLevel(profile.level) : 0;

  if (loadingProfile) {
    return (
      <div className="animate-in fade-in-0 duration-200">
        <MobilePageHeader title="Momentum" />
        <div className="px-4 space-y-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="animate-in fade-in-0 duration-200">
        <MobilePageHeader title="Momentum" />
        <Section>
          <EmptyState
            title="Start Your Journey"
            description="Check in to your first class to unlock your momentum profile"
            action={<Button size="sm" onClick={() => navigate('/member/check-in')}>Check In</Button>}
          />
        </Section>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in-0 duration-200 pb-4">
      {/* ── Hero: Profile Summary with big XP ── */}
      <div className="relative overflow-hidden" style={{ backgroundColor: 'hsl(var(--primary))' }}>
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full opacity-10" style={{ backgroundColor: 'hsl(var(--primary-foreground))' }} />
        <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full opacity-10" style={{ backgroundColor: 'hsl(var(--primary-foreground))' }} />

        <div className="relative px-5 pt-14 pb-5">
          {/* Hero XP number */}
          <div className="text-center mb-4">
            <p className="text-4xl font-black tracking-tight" style={{ color: 'hsl(var(--primary-foreground))' }}>
              {profile.totalXp.toLocaleString()}
              <span className="text-lg font-bold ml-1 opacity-70">XP</span>
            </p>
            <p className="text-xs font-medium mt-0.5" style={{ color: 'hsl(var(--primary-foreground) / 0.6)' }}>
              {profile.availablePoints.toLocaleString()} Coin available
            </p>
          </div>

          {/* Tier badge centered */}
          <div className="flex justify-center mb-3">
            <div className="[&>span]:!bg-white/90 [&>span]:!text-primary [&>span]:![box-shadow:none] [&>span>span]:!bg-primary/15">
              <TierBadge tier={profile.tier} level={profile.level} size="lg" />
            </div>
          </div>

          {/* XP Progress */}
          <div className="[&_span]:text-primary-foreground/80 [&_.inline-flex]:!bg-white/20 mb-4">
            <XPProgressBar totalXP={profile.totalXp} level={profile.level} />
          </div>

          {/* Streak + Freeze */}
          <div className="flex items-center justify-between">
            <StreakFlame
              weeklyCheckinDays={profile.weeklyCheckinDays}
              currentStreakWeeks={profile.currentStreak}
            />
            <StreakFreezeButton memberId={memberId!} availablePoints={profile.availablePoints} />
          </div>
        </div>
      </div>

      {/* Daily Bonus Nudge */}
      <div className="px-4 -mt-2 mb-2">
        <DailyBonusCard />
      </div>

      {/* ── Tabbed Content ── */}
      <Tabs defaultValue="quests" className="px-4 -mt-3">
        <TabsList className="w-full grid grid-cols-3 bg-card border border-border shadow-sm rounded-xl">
          <TabsTrigger value="level" className="rounded-lg text-xs font-bold gap-1.5 data-[state=active]:shadow-none">
            <Shield className="h-3.5 w-3.5" />
            Level
          </TabsTrigger>
          <TabsTrigger value="quests" className="rounded-lg text-xs font-bold gap-1.5 data-[state=active]:shadow-none">
            <Target className="h-3.5 w-3.5" />
            Quests
          </TabsTrigger>
          <TabsTrigger value="rewards" className="rounded-lg text-xs font-bold gap-1.5 data-[state=active]:shadow-none">
            <Gift className="h-3.5 w-3.5" />
            Rewards
          </TabsTrigger>
        </TabsList>

        {/* ═══ Level Tab ═══ */}
        <TabsContent value="level" className="space-y-4 mt-4">
          {/* Level details card */}
          <div className="rounded-xl border bg-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Level</p>
                <p className="text-2xl font-black text-foreground">{profile.level}</p>
              </div>
              <TierBadge tier={profile.tier} level={profile.level} size="lg" />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Next level at {nextLevelXP.toLocaleString()} XP</span>
                <span>{(nextLevelXP - profile.totalXp).toLocaleString()} XP to go</span>
              </div>
              <XPProgressBar totalXP={profile.totalXp} level={profile.level} />
            </div>
          </div>

          {/* Level-up requirements breakdown */}
          <LevelRequirementsCard
            profile={profile}
            completedQuests={completedQuests}
            totalBadges={badges?.length ?? 0}
          />

          {/* Streak card */}
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Streak</p>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xl font-black text-foreground">{profile.currentStreak}w streak</p>
                <p className="text-xs text-muted-foreground">Longest: {profile.longestStreak}w</p>
              </div>
              <StreakFlame weeklyCheckinDays={profile.weeklyCheckinDays} currentStreakWeeks={profile.currentStreak} />
            </div>
          </div>

          {/* Badges horizontal scroll */}
          {/* Badges with rarity labels */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-foreground">Badges</p>
              <button
                onClick={() => navigate('/member/badges')}
                className="flex items-center gap-0.5 text-xs font-medium text-primary"
              >
                View all <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            {badges && badges.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                {badges.slice(0, 8).map((mb) => {
                  const tierClass = BADGE_TIER_COLORS[mb.badge?.tier ?? 'bronze'] ?? BADGE_TIER_COLORS.bronze;
                  const rarityLabel = RARITY_LABELS[mb.badge?.tier ?? 'bronze'] ?? RARITY_LABELS.bronze;
                  return (
                    <div
                      key={mb.id}
                      className={`flex-shrink-0 flex flex-col items-center gap-1 rounded-xl border-2 bg-card p-3 w-20 ${tierClass}`}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                        {mb.badge?.iconUrl ? (
                          <img src={mb.badge.iconUrl} alt={mb.badge.nameEn} className="h-6 w-6" />
                        ) : (
                          <Trophy className="h-5 w-5 text-accent-foreground" />
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-foreground text-center leading-tight line-clamp-2">
                        {mb.badge?.nameEn ?? 'Badge'}
                      </p>
                      <span className={`text-[8px] font-bold uppercase tracking-wider ${rarityLabel.className}`}>
                        {rarityLabel.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 p-4 text-muted-foreground">
                <Award className="h-4 w-4" />
                <span className="text-xs font-medium">Complete quests to earn badges!</span>
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/member/leaderboard')}
              className="flex items-center gap-2 rounded-xl border bg-card p-3 text-left hover:bg-accent/50 transition-colors"
            >
              <Award className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-bold text-foreground">Leaderboard</p>
                <p className="text-[10px] text-muted-foreground">See rankings</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/member/squad')}
              className="flex items-center gap-2 rounded-xl border bg-card p-3 text-left hover:bg-accent/50 transition-colors"
            >
              <Trophy className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-bold text-foreground">Squad</p>
                <p className="text-[10px] text-muted-foreground">Team up</p>
              </div>
            </button>
          </div>
        </TabsContent>

        {/* ═══ Quests Tab ═══ */}
        <TabsContent value="quests" className="space-y-4 mt-4">
          {/* Daily/Weekly/Monthly Quest Hub */}
          <QuestHub />

          {/* Community Challenges (legacy gamification_challenges) */}
          {availableChallenges.length > 0 && (
            <div>
              <p className="text-sm font-bold text-foreground mb-3">Community Challenges</p>
              <div className="space-y-3">
                {availableChallenges.map((c) => {
                  const daysLeft = Math.max(0, Math.ceil((new Date(c.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                  return (
                    <div key={c.id} className="relative rounded-xl border bg-card p-4 space-y-3">
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                          <Clock className="h-2.5 w-2.5" />
                          {daysLeft}d left
                        </span>
                      </div>
                      <div className="flex items-start gap-3 pr-16">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <Target className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{c.name_en}</p>
                          {c.description_en && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.description_en}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {(c.reward_xp ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                              <Zap className="h-2.5 w-2.5" />
                              +{c.reward_xp} XP
                            </span>
                          )}
                          {(c.reward_points ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                              <Gift className="h-2.5 w-2.5" />
                              +{c.reward_points} Coin
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="default"
                          className="h-8 text-xs font-bold px-4"
                          onClick={() => joinChallenge.mutate(c.id)}
                          disabled={joinChallenge.isPending}
                        >
                          Join
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active joined challenges */}
          {joinedQuests.length > 0 && (
            <div>
              <p className="text-sm font-bold text-foreground mb-3">Active Challenges</p>
              <div className="space-y-2">
                {joinedQuests.map((quest) => (
                  <QuestCard key={quest.id} challenge={quest} />
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {completedQuests.length > 0 && (
            <div>
              <p className="text-sm font-bold text-foreground mb-3">Completed</p>
              <div className="space-y-2">
                {completedQuests.slice(0, 5).map((quest) => (
                  <QuestCard key={quest.id} challenge={quest} />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ═══ Rewards Tab ═══ */}
        <TabsContent value="rewards" className="space-y-4 mt-4">
          {/* Balance card */}
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
                  Momentum Coin
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {profile.availablePoints.toLocaleString()}
                  <span className="text-sm font-medium text-muted-foreground ml-1">Coin</span>
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Gift className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>

          {/* Redeemable rewards */}
          <div>
            <p className="text-sm font-bold text-foreground mb-3">Redeem Rewards</p>
            {loadingRewards ? (
              <div className="grid grid-cols-2 gap-3">
                {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
              </div>
            ) : !rewards || rewards.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
                <Gift className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground">No Rewards Yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Exclusive rewards are coming soon — keep earning Coin!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {rewards.map(reward => (
                  <RewardDropCard
                    key={reward.id}
                    reward={reward}
                    memberId={memberId!}
                    userLevel={profile.level}
                    userPoints={profile.availablePoints}
                    alreadyRedeemed={redeemedRewardIds.has(reward.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Points History */}
          <div>
            <p className="text-sm font-bold text-foreground mb-3">Points History</p>
            {loadingHistory ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
              </div>
            ) : !history || history.length === 0 ? (
              <EmptyState title="No points yet" description="Earn Coin by checking in and completing quests" />
            ) : (
              <div className="space-y-1 rounded-xl border bg-card overflow-hidden">
                {history.slice(0, 15).map(entry => (
                  <div key={entry.id} className="flex items-center justify-between px-3 py-3 border-b border-border last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
                        <Sparkles className="h-3.5 w-3.5 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {EVENT_LABELS[entry.eventType] ?? entry.eventType}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(entry.createdAt), 'MMM d · h:mm a')}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${entry.delta >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      {entry.delta >= 0 ? '+' : ''}{entry.delta}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
