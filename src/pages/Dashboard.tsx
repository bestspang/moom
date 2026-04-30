import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Dumbbell, CalendarCheck, DoorOpen, Banknote } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { StatCard } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { AdminCard, AdminSectionHeader } from '@/components/admin-ds';
import {
  useDashboardStats,
  useHighRiskMembers,
} from '@/hooks/useDashboardStats';
import {
  useScheduleByDate,
  mapScheduleToItem,
} from '@/hooks/useSchedule';
import { DailyBriefingCard } from '@/components/dashboard/DailyBriefingCard';
import DashboardWelcome from '@/components/dashboard/DashboardWelcome';
import { CheckInDialog } from '@/components/lobby/CheckInDialog';
import { useExpiringPackages } from '@/hooks/useExpiringPackages';
import NeedsAttentionCard from '@/components/dashboard/NeedsAttentionCard';
import { useDashboardTrends } from '@/hooks/useDashboardTrends';
import { BusinessHealthCard } from '@/components/dashboard/BusinessHealthCard';
import { RevenueForecastCard } from '@/components/dashboard/RevenueForecastCard';
import { GoalProgressCard } from '@/components/dashboard/GoalProgressCard';
import RecentActivityFeed from '@/components/dashboard/RecentActivityFeed';
import { usePermissions } from '@/hooks/usePermissions';
import { useTransferSlipStats } from '@/hooks/useTransferSlips';
import { formatCurrency } from '@/lib/formatters';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Skeleton component for stat cards
const StatCardSkeleton = () => (
  <Card className="shadow-card">
    <div className="p-3 space-y-2">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-6 w-14" />
      <Skeleton className="h-3 w-16" />
    </div>
  </Card>
);

/** Color-coded fill rate badge */
const FillRateBadge = ({ booked, capacity }: { booked: number; capacity: number }) => {
  const pct = capacity > 0 ? Math.round((booked / capacity) * 100) : 0;
  const color = pct >= 70 ? 'text-green-600 dark:text-green-400'
    : pct >= 30 ? 'text-yellow-600 dark:text-yellow-400'
    : 'text-destructive';
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <Progress value={pct} className="h-1.5 w-10" />
      <span className={cn('text-xs font-medium', color)}>{booked}/{capacity}</span>
    </div>
  );
};

const Dashboard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [quickCheckInOpen, setQuickCheckInOpen] = useState(false);

  // Fetch real data
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: highRiskMembers = [] } = useHighRiskMembers();
  const { data: rawScheduleData = [], isLoading: scheduleLoading } = useScheduleByDate(new Date());
  const { data: trends } = useDashboardTrends();
  const { data: slipStats } = useTransferSlipStats();
  const pendingSlips = slipStats?.needs_review || 0;

  const scheduleData = useMemo(() => rawScheduleData.map(mapScheduleToItem).slice(0, 5), [rawScheduleData]);

  // "vs last week same day" comparison
  const lastDayName = format(new Date(Date.now() - 7 * 86400000), 'EEE');
  const checkinVsLastWeek = stats && stats.checkinsLastWeekSameDay > 0
    ? stats.checkinsToday - stats.checkinsLastWeekSameDay
    : undefined;
  const revenueVsLastWeek = stats && stats.revenueLastWeekSameDay > 0
    ? stats.todayRevenue - stats.revenueLastWeekSameDay
    : undefined;

  // Fetch expiring packages for briefing stats
  const { data: expiringPkgs } = useExpiringPackages();
  const briefingStats = useMemo(() => {
    if (!stats) return undefined;
    return {
      checkinsToday: stats.checkinsToday,
      classesToday: stats.classesToday,
      currentlyInClass: stats.currentlyInClass,
      expiringPackages7d: expiringPkgs?.filter(p => p.daysLeft <= 7).length || 0,
      expiringPackages30d: expiringPkgs?.length || 0,
      highRiskCount: highRiskMembers.length,
      activeMembers: stats.activeMembers,
    };
  }, [stats, expiringPkgs, highRiskMembers]);

  return (
    <div className="space-y-6">
      {/* Row 0 — Welcome header with quick actions + daily summary */}
      <DashboardWelcome
        onQuickCheckIn={() => setQuickCheckInOpen(true)}
        stats={stats ? { classesToday: stats.classesToday, checkinsToday: stats.checkinsToday } : undefined}
        pendingSlips={pendingSlips}
      />

      {/* Row 1 — Business Health + Revenue Forecast (finance-gated) */}
      {can('finance', 'read') && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <BusinessHealthCard />
          </div>
          <div className="lg:col-span-3">
            <RevenueForecastCard />
          </div>
        </div>
      )}

      {/* Row 2 — 5 KPI StatCards with "vs last week" badges */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {statsLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              variant="ds-chip"
              title={t('dashboard.allCheckinsToday')}
              value={stats?.checkinsToday || 0}
              subtitle={t('dashboardExtra.mainLocation')}
              color="teal"
              icon={<DoorOpen className="h-4 w-4" />}
              trend={trends?.checkins7d}
              comparison={
                checkinVsLastWeek !== undefined
                  ? { value: checkinVsLastWeek, label: `vs ${lastDayName}` }
                  : undefined
              }
              onClick={() => navigate('/lobby')}
            />
            <StatCard
              variant="ds-chip"
              title={t('dashboard.currentlyInClass')}
              value={stats?.currentlyInClass || 0}
              subtitle={t('dashboardExtra.attendees')}
              color="orange"
              icon={<Dumbbell className="h-4 w-4" />}
              onClick={() => navigate('/calendar')}
            />
            <StatCard
              variant="ds-chip"
              title={t('dashboard.classesScheduledToday')}
              value={stats?.classesToday || 0}
              color="blue"
              icon={<CalendarCheck className="h-4 w-4" />}
              trend={trends?.classes7d}
              onClick={() => navigate('/calendar')}
            />
            {can('finance', 'read') && (
              <StatCard
                variant="ds-chip"
                title={t('dashboardExtra.revenueToday')}
                value={formatCurrency(stats?.todayRevenue || 0)}
                color="magenta"
                icon={<Banknote className="h-4 w-4" />}
                comparison={
                  revenueVsLastWeek !== undefined
                    ? { value: revenueVsLastWeek, label: `vs ${lastDayName}` }
                    : undefined
                }
                onClick={() => navigate('/finance')}
              />
            )}
            <StatCard
              variant="ds-chip"
              title={t('dashboardExtra.activeMembers')}
              value={stats?.activeMembers || 0}
              subtitle={t('dashboardExtra.members')}
              color="blue"
              icon={<Users className="h-4 w-4" />}
              onClick={() => navigate('/members')}
            />
          </>
        )}
      </div>

      {/* Row 3 — Goal Progress (full-width compact) */}
      <GoalProgressCard />

      {/* Row 4 — Needs Attention + Today's Schedule + Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <NeedsAttentionCard />

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                {t('dashboardExtra.todayScheduleCompact')}
              </CardTitle>
              <Button variant="link" size="sm" className="text-xs p-0 h-auto" asChild>
                <Link to="/calendar">{t('dashboardExtra.viewAllSchedule')} →</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {scheduleLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4 py-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : scheduleData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {t('dashboard.noClassesToday')}
              </p>
            ) : (
              <div className="divide-y divide-border">
                {scheduleData.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigate('/calendar')}
                    className="flex items-center gap-3 w-full text-left py-2.5 hover:bg-accent/50 rounded-md px-2 -mx-2 transition-colors"
                  >
                    <span className="text-xs font-mono text-muted-foreground w-12 shrink-0">
                      {item.time.split(' - ')[0]}
                    </span>
                    <span className="text-sm font-medium flex-1 truncate">
                      {item.className}
                    </span>
                    <span className="text-xs text-muted-foreground truncate max-w-[80px] hidden sm:inline">
                      {item.trainer}
                    </span>
                    <FillRateBadge booked={item.checkedIn || 0} capacity={item.capacity} />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <RecentActivityFeed />
      </div>

      {/* Row 5 — AI Daily Briefing */}
      <DailyBriefingCard stats={briefingStats} />

      <CheckInDialog open={quickCheckInOpen} onOpenChange={setQuickCheckInOpen} />
    </div>
  );
};

export default Dashboard;
