import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { ListCard } from '@/apps/shared/components/ListCard';
import { MobileStatusBadge } from '@/apps/shared/components/MobileStatusBadge';
import { EmptyState } from '@/apps/shared/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, ChevronRight, Megaphone, Zap } from 'lucide-react';
import { useMemberSession } from '../hooks/useMemberSession';
import { useDateLocale } from '@/hooks/useDateLocale';
import {
  fetchMyBookings,
  fetchMyPackages,
  fetchActiveAnnouncements,
  fetchTodayCheckin,
  fetchMyAttendance,
} from '../api/services';
import { fetchMomentumProfile } from '../features/momentum/api';
import { xpForLevel } from '../features/momentum/types';
import { MomentumCard } from '../features/momentum/MomentumCard';
import { DailyBonusCard } from '../features/momentum/DailyBonusCard';
import { StatusTierBadge, type StatusTier } from '../features/momentum/StatusTierBadge';
import { fetchMemberStatusTier } from '../features/momentum/api';
import { ReferralCard } from '../features/referral/ReferralCard';
import { SuggestedClassCard } from '../features/suggestions/SuggestedClassCard';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';

// New V2 components
import { NextUpCard, type NextUpState } from '../components/NextUpCard';
import { QuickTilesGrid } from '../components/QuickTilesGrid';
import { MoodCheckinStrip } from '../components/MoodCheckinStrip';
import { WellnessTipCard } from '../components/WellnessTipCard';
import { MascotIllustration } from '../components/MascotIllustration';
// V1 widget pass (additive — wired to existing data)
import { StreakStripCard } from '../components/StreakStripCard';
import { TodaySnapshotStrip } from '../components/TodaySnapshotStrip';
import { FriendsPulseCard } from '../components/FriendsPulseCard';
import { FeaturedBookingRow } from '../components/FeaturedBookingRow';
// V2 visual refresh widgets
import { DailySpinCard } from '../components/DailySpinCard';
import { QuestSummaryCard } from '../components/QuestSummaryCard';
import { AlmostUnlockedBadgeCard } from '../components/AlmostUnlockedBadgeCard';

function getTimeGreeting(t: (key: string) => string): string {
  const hour = new Date().getHours();
  if (hour < 12) return t('member.greetingMorning');
  if (hour < 17) return t('member.greetingAfternoon');
  return t('member.greetingEvening');
}

export default function MemberHomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
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

  const { data: todayCheckin } = useQuery({
    queryKey: ['member-today-checkin', memberId],
    queryFn: () => fetchTodayCheckin(memberId!),
    enabled: !!memberId,
    staleTime: 60 * 1000,
  });

  const { data: attendance } = useQuery({
    queryKey: ['member-attendance', memberId],
    queryFn: () => fetchMyAttendance(memberId!),
    enabled: !!memberId,
  });

  const upcomingBookings = bookings?.filter((b) => b.status === 'booked') ?? [];
  const activePackages = packages?.filter((p) => p.status === 'active') ?? [];
  const latestAnnouncement = announcements?.[0];

  const greeting = getTimeGreeting(t);
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayBookings = upcomingBookings.filter((b) => b.schedule.date === todayStr);
  const nextTodayBooking = todayBookings[0];

  // Onboarding step completion
  const step1Done = true;
  const step2Done = (bookings?.length ?? 0) > 0;
  const step3Done = (momentumProfile?.totalXp ?? 0) > 0;
  const allOnboardingDone = step1Done && step2Done && step3Done;

  // Resolve NextUpCard state from real data
  const nextUpState: NextUpState = todayCheckin?.checkedIn
    ? 'checked-in'
    : nextTodayBooking
    ? 'has-booking'
    : 'no-booking';

  const hasProgressed = (momentumProfile?.totalXp ?? 0) > 0;

  return (
    <div className="pb-2">
      {/* --- 1. Greeting + Mascot (V2 — bigger lion + tagline) --- */}
      <div className="px-4 pt-4 pb-3 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground leading-tight">
            {greeting}{firstName ? ` ${firstName}!` : '!'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('member.mascotTagline')}
          </p>
          {statusTier && statusTier.currentTier !== 'bronze' && (
            <div className="mt-2">
              <StatusTierBadge tier={statusTier.currentTier as StatusTier} size="sm" />
            </div>
          )}
        </div>
        <MascotIllustration size={80} mood={hasProgressed ? 'fire' : 'cheer'} />
      </div>

      {/* --- 1.5 Streak strip (V1 widget) --- */}
      {momentumProfile && momentumProfile.currentStreak > 0 && (
        <Section className="mb-3">
          <StreakStripCard
            currentStreak={momentumProfile.currentStreak}
            longestStreak={momentumProfile.longestStreak}
            onClick={() => navigate('/member/momentum')}
          />
        </Section>
      )}

      {/* --- 2. Onboarding (legacy: shown when incomplete) --- */}
      {!allOnboardingDone && !onboardingDismissed && (
        <Section className="mb-3">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">{t('member.welcomeToMoom')}</p>
              </div>
              <button
                onClick={() => {
                  setOnboardingDismissed(true);
                  localStorage.setItem('moom-onboarding-dismissed', 'true');
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
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
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-xs">
                      ✓
                    </span>
                  ) : (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {i + 1}
                    </span>
                  )}
                  <span className={step.done ? 'line-through text-muted-foreground/60' : ''}>{step.label}</span>
                </li>
              ))}
            </ol>
          </div>
        </Section>
      )}

      {/* --- 3. NEXT UP hero (replaces TodayCard + dual primary buttons) --- */}
      <Section className="mb-3">
        <NextUpCard
          state={nextUpState}
          className={nextTodayBooking?.schedule.className ?? null}
          startTime={nextTodayBooking?.schedule.startTime ?? null}
          trainerName={nextTodayBooking?.schedule.trainerName ?? null}
          date={nextTodayBooking?.schedule.date ?? null}
          checkedInAt={todayCheckin?.checkInTime ?? null}
          onPrimary={() => {
            if (nextUpState === 'has-booking') navigate('/member/check-in');
            else if (nextUpState === 'checked-in') navigate('/member/momentum');
            else navigate('/member/schedule');
          }}
          onSecondary={() => {
            if (nextUpState === 'has-booking' && nextTodayBooking) {
              navigate(`/member/bookings/${nextTodayBooking.id}`);
            } else if (nextUpState === 'checked-in') {
              navigate('/member/schedule');
            } else {
              navigate('/member/check-in');
            }
          }}
        />
      </Section>

      {/* ═══════════ MOCKUP ORDER (ดันขึ้น) ═══════════ */}

      {/* --- 5. Quick tiles (จองคลาส / ประวัติ / เพื่อน / รางวัล) --- */}
      <Section className="mb-3">
        <QuickTilesGrid
          upcomingCount={upcomingBookings.length}
          attendanceCount={attendance?.length}
        />
      </Section>

      {/* --- 6. Quest summary (เควสวันนี้ + ring) --- */}
      {memberId && (
        <Section className="mb-3">
          <QuestSummaryCard memberId={memberId} />
        </Section>
      )}

      {/* --- 7. Almost unlocked badge (ใกล้ปลดล็อก ม่วง-ชมพู) --- */}
      {memberId && (
        <Section className="mb-3">
          <AlmostUnlockedBadgeCard memberId={memberId} />
        </Section>
      )}

      {/* --- 8. Wellness tip (เคล็ดลับเวลเนส เขียว) --- */}
      <Section className="mb-3">
        <WellnessTipCard />
      </Section>

      {/* --- 9. Friends pulse (4 คน เช็คอินวันนี้) --- */}
      {memberId && (
        <Section className="mb-3">
          <FriendsPulseCard memberId={memberId} />
        </Section>
      )}

      {/* --- 10. Referral (ชวนเพื่อน รับแต้ม! ส้ม) --- */}
      {memberId && (
        <Section className="mb-3">
          <ReferralCard memberId={memberId} />
        </Section>
      )}

      {/* ═══════════ MORE (เดิมทั้งหมด — เลื่อนลง) ═══════════ */}

      {/* --- 11. Today snapshot strip --- */}
      <Section className="mb-3">
        <TodaySnapshotStrip
          todayBookingsCount={todayBookings.length}
          checkedIn={!!todayCheckin?.checkedIn}
        />
      </Section>

      {/* --- 12. Mood check-in (UI shell, localStorage) --- */}
      <Section className="mb-3">
        <MoodCheckinStrip />
      </Section>

      {/* --- 13. Daily Spin (V2 — UI shell, Coming Soon) --- */}
      <Section className="mb-3">
        <DailySpinCard />
      </Section>

      {/* --- 14. Compact announcement --- */}
      {(allOnboardingDone || onboardingDismissed) && latestAnnouncement && (
        <Section className="mb-3">
          <div className="rounded-lg bg-accent/50 border border-border p-3">
            <div className="flex items-start gap-2">
              <Megaphone className="h-4 w-4 text-accent-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground line-clamp-2">{latestAnnouncement.message}</p>
                <button
                  onClick={() => navigate('/member/notifications')}
                  className="text-xs font-medium text-primary mt-1"
                >
                  {t('member.readMore')}
                </button>
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* --- 15. Daily bonus + Momentum --- */}
      <Section className="mb-3">
        <DailyBonusCard />
      </Section>
      <Section className="mb-3">
        <MomentumCard memberId={memberId} />
      </Section>

      {/* --- 16. Almost there level nudge --- */}
      {momentumProfile &&
        (() => {
          const currentLevelXP = xpForLevel(momentumProfile.level - 1);
          const nextLevelXP = xpForLevel(momentumProfile.level);
          const xpNeeded = nextLevelXP - currentLevelXP;
          const xpRemaining = nextLevelXP - momentumProfile.totalXp;
          const progress =
            xpNeeded > 0 ? ((momentumProfile.totalXp - currentLevelXP) / xpNeeded) * 100 : 0;
          if (progress < 85 || xpRemaining <= 0) return null;
          return (
            <Section className="mb-3">
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

      {/* (Wellness tip ย้ายขึ้นไปอยู่ใน Mockup Order ด้านบนแล้ว) */}

      {/* --- 10. Next Up bookings list --- */}
      <Section
        title={t('member.nextUp')}
        action={
          upcomingBookings.length > 0 ? (
            <button
              onClick={() => navigate('/member/bookings')}
              className="text-xs font-medium text-primary flex items-center gap-0.5"
            >
              {t('common.viewAll')} <ChevronRight className="h-3 w-3" />
            </button>
          ) : undefined
        }
        className="mb-3"
      >
        {loadingBookings ? (
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-lg" />
          </div>
        ) : upcomingBookings.length === 0 ? (
          <EmptyState
            title={t('member.noUpcomingBookings')}
            description={t('member.browseScheduleHint')}
            action={
              <Button size="sm" onClick={() => navigate('/member/schedule')}>
                {t('member.browseSchedule')}
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {/* Featured first booking — V1 highlight row */}
            {upcomingBookings[0] && (
              <FeaturedBookingRow
                className={upcomingBookings[0].schedule.className}
                date={upcomingBookings[0].schedule.date}
                startTime={upcomingBookings[0].schedule.startTime}
                endTime={upcomingBookings[0].schedule.endTime}
                trainerName={upcomingBookings[0].schedule.trainerName}
                onClick={() => navigate(`/member/bookings/${upcomingBookings[0].id}`)}
              />
            )}
            {upcomingBookings.slice(1, 2).map((booking) => (
              <ListCard
                key={booking.id}
                title={booking.schedule.className}
                subtitle={`${format(parseISO(booking.schedule.date), 'EEE, d MMM', { locale: dateLocale })} · ${booking.schedule.startTime.slice(0, 5)} – ${booking.schedule.endTime.slice(0, 5)}`}
                meta={booking.schedule.trainerName ? t('member.withTrainer').replace('{{name}}', booking.schedule.trainerName) : undefined}
                trailing={<MobileStatusBadge status={booking.status} />}
              />
            ))}
          </div>
        )}
      </Section>

      {/* --- 11. Active packages with expiry urgency --- */}
      {activePackages.length > 0 && (
        <Section title={t('member.activePackages')} className="mb-3">
          <div className="space-y-2">
            {activePackages.map((pkg) => {
              const daysLeft = pkg.expiryDate
                ? Math.ceil((new Date(pkg.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null;
              const urgencyColor =
                daysLeft != null
                  ? daysLeft <= 7
                    ? 'text-destructive'
                    : daysLeft <= 30
                    ? 'text-yellow-600'
                    : 'text-muted-foreground'
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
                  meta={
                    daysLeft != null ? (
                      <span className={`text-xs font-semibold ${urgencyColor}`}>
                        {daysLeft <= 0
                          ? t('member.expired')
                          : t('member.daysLeft').replace('{{n}}', String(daysLeft))}
                      </span>
                    ) : undefined
                  }
                  trailing={<MobileStatusBadge status={pkg.status} />}
                />
              );
            })}
          </div>
        </Section>
      )}

      {/* --- 17. Suggested class (Referral ย้ายขึ้นไปอยู่ใน Mockup Order ด้านบนแล้ว) --- */}
      {memberId && (
        <Section className="mb-6">
          <SuggestedClassCard memberId={memberId} />
        </Section>
      )}
    </div>
  );
}
