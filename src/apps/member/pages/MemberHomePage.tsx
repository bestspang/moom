import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { ListCard } from '@/apps/shared/components/ListCard';
import { MobileStatusBadge } from '@/apps/shared/components/MobileStatusBadge';
import { EmptyState } from '@/apps/shared/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, ScanLine, Sparkles, ChevronRight, Megaphone, Zap } from 'lucide-react';
import { useMemberSession } from '../hooks/useMemberSession';
import { fetchMyBookings, fetchMyPackages, fetchActiveAnnouncements } from '../api/services';
import { fetchMomentumProfile } from '../features/momentum/api';
import { xpForLevel } from '../features/momentum/types';
import { MomentumCard } from '../features/momentum/MomentumCard';
import { DailyBonusCard } from '../features/momentum/DailyBonusCard';
import { TodayCard } from '../features/momentum/TodayCard';
import { StatusTierBadge, type StatusTier } from '../features/momentum/StatusTierBadge';
import { fetchMemberStatusTier } from '../features/momentum/api';
import { ReferralCard } from '../features/referral/ReferralCard';
import { SuggestedClassCard } from '../features/suggestions/SuggestedClassCard';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';

function getTimeGreeting(t: (key: string) => string): string {
  const hour = new Date().getHours();
  if (hour < 12) return t('member.goodMorning');
  if (hour < 17) return t('member.goodAfternoon');
  return t('member.goodEvening');
}

export default function MemberHomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { firstName, memberId, isAuthenticated } = useMemberSession();
  const [onboardingDismissed, setOnboardingDismissed] = useState(
    () => localStorage.getItem('moom-onboarding-dismissed') === 'true'
  );

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

  const { data: momentumProfile } = useQuery({
    queryKey: ['momentum-profile', memberId],
    queryFn: () => fetchMomentumProfile(memberId!),
    enabled: !!memberId,
  });

  const { data: statusTier } = useQuery({
    queryKey: ['member-status-tier', memberId],
    queryFn: () => fetchMemberStatusTier(memberId!),
    enabled: !!memberId,
  });

  const upcomingBookings = bookings?.filter(b => b.status === 'booked') ?? [];
  const activePackages = packages?.filter(p => p.status === 'active') ?? [];
  const latestAnnouncement = announcements?.[0];

  const greeting = getTimeGreeting(t);
  const title = firstName ? `${greeting}, ${firstName}` : `${greeting}!`;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayBookings = upcomingBookings.filter(b => b.schedule.date === todayStr);
  const subtitle = todayBookings.length > 0
    ? (todayBookings.length > 1
      ? t('member.bookingsTodayPlural').replace('{{count}}', String(todayBookings.length))
      : t('member.bookingsToday').replace('{{count}}', String(todayBookings.length)))
    : t('member.readyToTrain');

  // Onboarding step completion
  const step1Done = true; // they've opened the app
  const step2Done = (bookings?.length ?? 0) > 0;
  const step3Done = (momentumProfile?.totalXp ?? 0) > 0;
  const allOnboardingDone = step1Done && step2Done && step3Done;

  const nextTodayBooking = todayBookings[0];

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <MobilePageHeader title={title} subtitle={subtitle} />

      {/* Status Tier Badge */}
      {statusTier && statusTier.currentTier !== 'bronze' && (
        <div className="px-4 -mt-2 mb-2">
          <StatusTierBadge tier={statusTier.currentTier as StatusTier} size="sm" />
        </div>
      )}

      {/* Onboarding for incomplete users / Announcement for completed */}
      {!allOnboardingDone && !onboardingDismissed && (
        <Section className="mb-4">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">{t('member.welcomeToMoom')}</p>
              </div>
              <button onClick={() => { setOnboardingDismissed(true); localStorage.setItem('moom-onboarding-dismissed', 'true'); }} className="text-xs text-muted-foreground hover:text-foreground">
                {t('member.dismiss')}
              </button>
            </div>
            <ol className="space-y-2 text-sm text-muted-foreground">
              {[
                { done: step1Done, label: t('member.onboardingStep1') },
                { done: step2Done, label: t('member.onboardingStep2') },
                { done: step3Done, label: t('member.onboardingStep3') },
              ].map((step, i) => (
                <li key={i} className="flex items-center gap-2">
                  {step.done ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-xs">✓</span>
                  ) : (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">{i + 1}</span>
                  )}
                  <span className={step.done ? 'line-through text-muted-foreground/60' : ''}>{step.label}</span>
                </li>
              ))}
            </ol>
          </div>
        </Section>
      )}

      {/* Compact announcement (shows when onboarding is done or dismissed) */}
      {(allOnboardingDone || onboardingDismissed) && latestAnnouncement && (
        <Section className="mb-4">
          <div className="rounded-lg bg-accent/50 border border-border p-3">
            <div className="flex items-start gap-2">
              <Megaphone className="h-4 w-4 text-accent-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground line-clamp-2">{latestAnnouncement.message}</p>
                <button onClick={() => navigate('/member/notifications')} className="text-xs font-medium text-primary mt-1">
                  {t('member.readMore')}
                </button>
              </div>
            </div>
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

      {/* Quick actions + Daily Bonus inline */}
      <Section className="mb-4">
        <div className="flex gap-2 mb-3">
          <Button onClick={() => navigate('/member/check-in')} className="flex-1" size="sm">
            <ScanLine className="h-4 w-4 mr-1.5" />
            {t('member.checkIn')}
          </Button>
          <Button onClick={() => navigate('/member/schedule')} variant="outline" className="flex-1" size="sm">
            <Calendar className="h-4 w-4 mr-1.5" />
            {t('member.bookClass')}
          </Button>
        </div>
        <DailyBonusCard />
      </Section>

      {/* Momentum */}
      <Section className="mb-4">
        <MomentumCard memberId={memberId} />
      </Section>

      {/* Almost There nudge — within 15% of next level */}
      {momentumProfile && (() => {
        const currentLevelXP = xpForLevel(momentumProfile.level - 1);
        const nextLevelXP = xpForLevel(momentumProfile.level);
        const xpNeeded = nextLevelXP - currentLevelXP;
        const xpRemaining = nextLevelXP - momentumProfile.totalXp;
        const progress = xpNeeded > 0 ? ((momentumProfile.totalXp - currentLevelXP) / xpNeeded) * 100 : 0;
        if (progress < 85 || xpRemaining <= 0) return null;
        return (
          <Section className="mb-4">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 flex items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/15">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground">{t('member.almostThere')}</p>
                <p className="text-[11px] text-muted-foreground">
                  {t('member.xpToNextLevel')
                    .replace('{{xp}}', String(xpRemaining))
                    .replace('{{level}}', String(momentumProfile.level + 1))}
                </p>
              </div>
              <div className="w-16 h-2 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </Section>
        );
      })()}

      {/* Next Up bookings */}
      <Section
        title={t('member.nextUp')}
        action={
          upcomingBookings.length > 0 ? (
            <button onClick={() => navigate('/member/bookings')} className="text-xs font-medium text-primary flex items-center gap-0.5">
              {t('common.viewAll')} <ChevronRight className="h-3 w-3" />
            </button>
          ) : undefined
        }
        className="mb-4"
      >
        {loadingBookings ? (
          <div className="space-y-3"><Skeleton className="h-20 rounded-lg" /></div>
        ) : upcomingBookings.length === 0 ? (
          <EmptyState
            title={t('member.noUpcomingBookings')}
            description={t('member.browseScheduleHint')}
            action={<Button size="sm" onClick={() => navigate('/member/schedule')}>{t('member.browseSchedule')}</Button>}
          />
        ) : (
          <div className="space-y-2">
            {upcomingBookings.slice(0, 2).map(booking => (
              <ListCard
                key={booking.id}
                title={booking.schedule.className}
                subtitle={`${format(parseISO(booking.schedule.date), 'EEE, d MMM')} · ${booking.schedule.startTime.slice(0, 5)} – ${booking.schedule.endTime.slice(0, 5)}`}
                meta={booking.schedule.trainerName ? t('member.withTrainer').replace('{{name}}', booking.schedule.trainerName) : undefined}
                trailing={<MobileStatusBadge status={booking.status} />}
              />
            ))}
          </div>
        )}
      </Section>

      {/* Active packages with expiry countdown */}
      {activePackages.length > 0 && (
        <Section title={t('member.activePackages')} className="mb-4">
          <div className="space-y-2">
            {activePackages.map(pkg => {
              const daysLeft = pkg.expiryDate
                ? Math.ceil((new Date(pkg.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null;
              const urgencyColor = daysLeft != null
                ? daysLeft <= 7 ? 'text-destructive' : daysLeft <= 30 ? 'text-yellow-600' : 'text-muted-foreground'
                : '';

              return (
                <ListCard
                  key={pkg.id}
                  title={pkg.packageName}
                  subtitle={
                    pkg.sessionsRemaining != null
                      ? t('member.sessionsRemaining').replace('{{n}}', String(pkg.sessionsRemaining))
                      : undefined
                  }
                  meta={daysLeft != null ? (
                    <span className={`text-xs font-semibold ${urgencyColor}`}>
                      {daysLeft <= 0 ? t('member.expired') : t('member.daysLeft').replace('{{n}}', String(daysLeft))}
                    </span>
                  ) : undefined}
                  trailing={<MobileStatusBadge status={pkg.status} />}
                />
              );
            })}
          </div>
        </Section>
      )}

      {/* Referral + Suggested (secondary) */}
      {memberId && (
        <Section className="mb-4">
          <ReferralCard memberId={memberId} />
        </Section>
      )}
      {memberId && (
        <Section className="mb-6">
          <SuggestedClassCard memberId={memberId} />
        </Section>
      )}
    </div>
  );
}
