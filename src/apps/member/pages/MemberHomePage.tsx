import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { ListCard } from '@/apps/shared/components/ListCard';
import { MobileStatusBadge } from '@/apps/shared/components/MobileStatusBadge';
import { EmptyState } from '@/apps/shared/components/EmptyState';
import { SummaryCard } from '@/apps/shared/components/SummaryCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Package, Sparkles, ChevronRight, Megaphone, Trophy } from 'lucide-react';
import { useMemberSession } from '../hooks/useMemberSession';
import { fetchMyBookings, fetchMyPackages, fetchActiveAnnouncements } from '../api/services';
import { fetchActiveChallenges, fetchMyChallengeProgress } from '../features/momentum/api';
import { MomentumCard } from '../features/momentum/MomentumCard';
import { SquadCard } from '../features/momentum/SquadCard';
import { UpcomingMilestones } from '../features/momentum/UpcomingMilestones';
import { TodayCard } from '../features/momentum/TodayCard';
import { NotificationBell } from '../features/momentum/NotificationBell';
import { ChallengeCard } from '../features/momentum/ChallengeCard';
import { ReferralCard } from '../features/referral/ReferralCard';
import { SuggestedClassCard } from '../features/suggestions/SuggestedClassCard';
import { format } from 'date-fns';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function MemberHomePage() {
  const navigate = useNavigate();
  const { firstName, memberId, isAuthenticated } = useMemberSession();
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const queryClient = useQueryClient();

  const { data: bookings, isLoading: loadingBookings } = useQuery({
    queryKey: ['member-bookings', memberId],
    queryFn: () => fetchMyBookings(memberId!),
    enabled: !!memberId,
  });

  const { data: packages } = useQuery({
    queryKey: ['member-packages', memberId],
    queryFn: () => fetchMyPackages(memberId!),
    enabled: !!memberId,
  });

  const { data: announcements } = useQuery({
    queryKey: ['member-announcements'],
    queryFn: fetchActiveAnnouncements,
    enabled: isAuthenticated,
  });

  const { data: activeChallenges } = useQuery({
    queryKey: ['active-challenges'],
    queryFn: fetchActiveChallenges,
    enabled: isAuthenticated,
  });

  const { data: myProgress } = useQuery({
    queryKey: ['my-challenges', memberId],
    queryFn: () => fetchMyChallengeProgress(memberId!),
    enabled: !!memberId,
  });

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

  const upcomingBookings = bookings?.filter(b => b.status === 'booked') ?? [];
  const activePackages = packages?.filter(p => p.status === 'active') ?? [];
  const latestAnnouncement = announcements?.[0];

  const greeting = getTimeGreeting();
  const title = firstName ? `${greeting}, ${firstName}` : `${greeting}!`;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayBookings = upcomingBookings.filter(b => b.schedule.date === todayStr);
  const subtitle = todayBookings.length > 0
    ? `You have ${todayBookings.length} booking${todayBookings.length > 1 ? 's' : ''} today`
    : 'Ready to train?';

  const isNewUser = upcomingBookings.length === 0 && activePackages.length === 0;

  // Find the next upcoming today booking for TodayCard
  const nextTodayBooking = todayBookings[0];

  // Build progress lookup for challenges
  const progressMap = new Map(
    (myProgress ?? []).map(p => [p.challengeId, { current_value: p.currentValue, status: p.status }])
  );

  // Filter active challenges that are relevant (not completed)
  const visibleChallenges = (activeChallenges ?? []).filter(c => {
    const prog = progressMap.get(c.id);
    return !prog || prog.status !== 'completed';
  }).slice(0, 3);

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <MobilePageHeader
        title={title}
        subtitle={subtitle}
        action={<NotificationBell onClick={() => navigate('/member/notifications')} />}
      />

      {/* Onboarding for new users */}
      {isNewUser && !onboardingDismissed && (
        <Section className="mb-4">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Welcome to MOOM!</p>
              </div>
              <button onClick={() => setOnboardingDismissed(true)} className="text-xs text-muted-foreground hover:text-foreground">
                Dismiss
              </button>
            </div>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                Browse classes in the schedule
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                Book your first session
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                Check in to earn XP
              </li>
            </ol>
          </div>
        </Section>
      )}

      {/* Today's next class urgency card */}
      {nextTodayBooking && (
        <Section className="mb-4">
          <TodayCard
            booking={nextTodayBooking}
            onTap={() => navigate(`/member/bookings/${nextTodayBooking.id}`)}
          />
        </Section>
      )}

      {/* Quick actions */}
      <Section className="mb-4">
        <div className="flex gap-2">
          <Button onClick={() => navigate('/member/schedule')} className="flex-1" size="sm">
            <Calendar className="h-4 w-4 mr-1.5" />
            Book Class
          </Button>
          <Button onClick={() => navigate('/member/packages')} variant="outline" className="flex-1" size="sm">
            <Package className="h-4 w-4 mr-1.5" />
            Buy Package
          </Button>
        </div>
      </Section>

      {/* Next Up bookings */}
      <Section
        title="Next Up"
        action={
          upcomingBookings.length > 0 ? (
            <button onClick={() => navigate('/member/bookings')} className="text-xs font-medium text-primary flex items-center gap-0.5">
              View all <ChevronRight className="h-3 w-3" />
            </button>
          ) : undefined
        }
        className="mb-4"
      >
        {loadingBookings ? (
          <div className="space-y-3"><Skeleton className="h-20 rounded-lg" /></div>
        ) : upcomingBookings.length === 0 ? (
          <EmptyState
            title="No upcoming bookings"
            description="Browse the schedule to book your next class"
            action={<Button size="sm" onClick={() => navigate('/member/schedule')}>Browse Schedule</Button>}
          />
        ) : (
          <div className="space-y-2">
            {upcomingBookings.slice(0, 3).map(booking => (
              <ListCard
                key={booking.id}
                title={booking.schedule.className}
                subtitle={`${format(new Date(booking.schedule.date), 'EEE, d MMM')} · ${booking.schedule.startTime.slice(0, 5)} – ${booking.schedule.endTime.slice(0, 5)}`}
                meta={booking.schedule.trainerName ? `with ${booking.schedule.trainerName}` : undefined}
                trailing={<MobileStatusBadge status={booking.status} />}
              />
            ))}
          </div>
        )}
      </Section>

      {/* Active Challenges */}
      {visibleChallenges.length > 0 && (
        <Section
          title="Challenges"
          action={
            <button onClick={() => navigate('/member/check-in')} className="text-xs font-medium text-primary flex items-center gap-0.5">
              View all <ChevronRight className="h-3 w-3" />
            </button>
          }
          className="mb-4"
        >
          <div className="space-y-3">
            {visibleChallenges.map(challenge => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                progress={progressMap.get(challenge.id) ?? null}
                onJoin={(id) => joinChallenge.mutate(id)}
                joining={joinChallenge.isPending}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Momentum */}
      {memberId && (
        <Section className="mb-4">
          <MomentumCard memberId={memberId} />
        </Section>
      )}

      {/* Leaderboard link */}
      <Section className="mb-4">
        <button
          onClick={() => navigate('/member/leaderboard')}
          className="flex w-full items-center gap-3 rounded-xl bg-card p-3 shadow-sm border border-border hover:bg-accent/50 transition-colors"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-foreground">Leaderboard</p>
            <p className="text-xs text-muted-foreground">See who's on top 🏆</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </Section>

      {/* Squad */}
      {memberId && (
        <Section className="mb-4">
          <SquadCard memberId={memberId} />
        </Section>
      )}

      {/* Upcoming milestones nudge */}
      {memberId && (
        <Section className="mb-4">
          <UpcomingMilestones memberId={memberId} nudgeOnly max={1} />
        </Section>
      )}

      {/* Pinned announcement */}
      {latestAnnouncement && (
        <Section className="mb-4">
          <div className="rounded-lg bg-accent/50 border border-border p-3">
            <div className="flex items-start gap-2">
              <Megaphone className="h-4 w-4 text-accent-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground">{latestAnnouncement.message}</p>
            </div>
          </div>
        </Section>
      )}

      {/* Active packages */}
      {activePackages.length > 0 && (
        <Section title="Active Packages" className="mb-6">
          <div className="space-y-2">
            {activePackages.map(pkg => (
              <ListCard
                key={pkg.id}
                title={pkg.packageName}
                subtitle={pkg.sessionsRemaining != null ? `${pkg.sessionsRemaining} sessions remaining` : pkg.expiryDate ? `Expires ${format(new Date(pkg.expiryDate), 'd MMM yyyy')}` : undefined}
                trailing={<MobileStatusBadge status={pkg.status} />}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Stats */}
      <Section title="Your Stats" className="mb-4">
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard label="This Week" value={String(todayBookings.length)} subtitle="classes booked" />
          <SummaryCard label="Packages" value={String(activePackages.length)} subtitle="active" />
        </div>
      </Section>
    </div>
  );
}
