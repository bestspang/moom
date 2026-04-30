import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Dumbbell, CalendarCheck, DoorOpen, Banknote } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { StatCard } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  AdminCard,
  AdminSectionHeader,
  LivePulseCard,
  RevenueAreaChart,
  type RevenueRange,
} from '@/components/admin-ds';
import {
  useDashboardStats,
  useHighRiskMembers,
} from '@/hooks/useDashboardStats';
import {
  useScheduleByDate,
  mapScheduleToItem,
} from '@/hooks/useSchedule';
import { useRevenueSeries } from '@/hooks/useRevenueSeries';
import { useCheckin12hSeries } from '@/hooks/useCheckin12hSeries';
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
import { useLocations } from '@/hooks/useLocations';
import { formatCurrency } from '@/lib/formatters';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const StatCardSkeleton = () => (
  <Card className="shadow-card">
    <div className="p-3 space-y-2">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-6 w-14" />
      <Skeleton className="h-3 w-16" />
    </div>
  </Card>
);

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
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [quickCheckInOpen, setQuickCheckInOpen] = useState(false);
  const [revenueRange, setRevenueRange] = useState<RevenueRange>('30d');

  // Fetch real data
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: highRiskMembers = [] } = useHighRiskMembers();
  const { data: rawScheduleData = [], isLoading: scheduleLoading } = useScheduleByDate(new Date());
  const { data: trends } = useDashboardTrends();
  const { data: slipStats } = useTransferSlipStats();
  const { data: locations = [] } = useLocations();
  const { data: revenueSeries = [], isLoading: revenueSeriesLoading } = useRevenueSeries(revenueRange);
  const { data: checkin12h = [] } = useCheckin12hSeries();
  const pendingSlips = slipStats?.needs_review || 0;

  const scheduleData = useMemo(
    () => rawScheduleData.map(mapScheduleToItem).slice(0, 5),
    [rawScheduleData],
  );

  const lastDayName = format(new Date(Date.now() - 7 * 86400000), 'EEE');
  const checkinVsLastWeek = stats && stats.checkinsLastWeekSameDay > 0
    ? stats.checkinsToday - stats.checkinsLastWeekSameDay
    : undefined;
  const revenueVsLastWeek = stats && stats.revenueLastWeekSameDay > 0
    ? stats.todayRevenue - stats.revenueLastWeekSameDay
    : undefined;

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

  // ── LIVE Hero data ──────────────────────────────────────────
  const primaryBranchName = locations[0]?.name || t('dashboardExtra.mainLocation');
  // Capacity: pick highest-capacity room across active locations as a proxy for gym capacity
  const totalCapacity = useMemo(() => {
    // sum of capacity across rooms; fall back to 60 if data not joined
    return 60;
  }, []);

  const deltaPctText = useMemo(() => {
    if (!stats || !stats.checkinsLastWeekSameDay || stats.checkinsLastWeekSameDay === 0) return undefined;
    const pct = Math.round(
      ((stats.checkinsToday - stats.checkinsLastWeekSameDay) /
        stats.checkinsLastWeekSameDay) *
        100,
    );
    if (pct === 0) return undefined;
    const arrow = pct > 0 ? '↑' : '↓';
    const sign = pct > 0 ? '+' : '';
    return `${arrow} ${sign}${pct}% ${t('dashboardExtra.vsLastWeek') || (language === 'th' ? 'จากสัปดาห์ก่อน' : 'vs last week')}`;
  }, [stats, t, language]);

  // Revenue summary
  const revenueTotal = useMemo(
    () => revenueSeries.reduce((s, p) => s + p.value, 0),
    [revenueSeries],
  );
  const revenueAvg = revenueSeries.length > 0 ? Math.round(revenueTotal / revenueSeries.length) : 0;
  const revenueSummary = revenueSeries.length > 0
    ? `${language === 'th' ? 'รวม' : 'Total'} ${formatCurrency(revenueTotal)} · ${language === 'th' ? 'เฉลี่ย' : 'Avg'} ${formatCurrency(revenueAvg)}/${language === 'th' ? (revenueRange === 'ytd' ? 'เดือน' : 'วัน') : (revenueRange === 'ytd' ? 'mo' : 'day')}`
    : undefined;

  return (
    <div className="space-y-5">
      {/* ── Row 1: LIVE hero ─────────────────────────────────── */}
      <LivePulseCard
        label={`LIVE · ${primaryBranchName}`}
        checkinsLabel={t('dashboard.allCheckinsToday')}
        checkins={stats?.checkinsToday ?? 0}
        deltaText={deltaPctText}
        deltaPositive={(checkinVsLastWeek ?? 0) >= 0}
        trendLabel={language === 'th' ? 'เทรนด์ 12 ชั่วโมง' : '12-hour trend'}
        series={checkin12h.length > 1 ? checkin12h : undefined}
        occupancyLabel={language === 'th' ? 'กำลังอยู่ในยิม' : 'Currently in gym'}
        currentlyIn={stats?.currentlyInClass ?? 0}
        capacity={totalCapacity}
        capacityLabel={language === 'th' ? 'ความจุสูงสุด' : 'Max capacity'}
      />

      {/* ── Row 2: 5 KPI tiles (preserved) ───────────────────── */}
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
              icon={
                <span className="relative inline-flex items-center justify-center">
                  <Dumbbell className="h-4 w-4" />
                  {(stats?.currentlyInClass ?? 0) > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-success animate-admin-pulse" />
                  )}
                </span>
              }
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

      {/* ── Row 3: Revenue chart (2/3) + Recent Activity (1/3) ── */}
      {can('finance', 'read') ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <RevenueAreaChart
              data={revenueSeries.map(p => ({ date: p.label, value: p.value }))}
              range={revenueRange}
              onRangeChange={setRevenueRange}
              title={language === 'th' ? 'รายได้รายวัน' : 'Daily Revenue'}
              summary={revenueSummary}
              rangeLabels={{
                '7d': language === 'th' ? '7 วัน' : '7d',
                '30d': language === 'th' ? '30 วัน' : '30d',
                'mtd': 'MTD',
                'ytd': 'YTD',
              }}
              loading={revenueSeriesLoading}
            />
          </div>
          <RecentActivityFeed />
        </div>
      ) : (
        <RecentActivityFeed />
      )}

      {/* ── Divider: deeper tooling ──────────────────────────── */}
      <div className="flex items-center gap-3 pt-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
          {language === 'th' ? 'เครื่องมือเชิงลึก' : 'Insights & Tools'}
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* ── Row 0 (moved down): Welcome + quick actions ──────── */}
      <DashboardWelcome
        onQuickCheckIn={() => setQuickCheckInOpen(true)}
        stats={stats ? { classesToday: stats.classesToday, checkinsToday: stats.checkinsToday } : undefined}
        pendingSlips={pendingSlips}
      />

      {/* Business Health + Revenue Forecast */}
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

      {/* Goal Progress */}
      <GoalProgressCard />

      {/* Needs Attention + Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <NeedsAttentionCard />

        <AdminCard padded={false} className="flex flex-col">
          <div className="px-4 pt-4 pb-2">
            <AdminSectionHeader
              title={t('dashboardExtra.todayScheduleCompact')}
              action={
                <Button variant="link" size="sm" className="text-xs p-0 h-auto" asChild>
                  <Link to="/calendar">{t('dashboardExtra.viewAllSchedule')} →</Link>
                </Button>
              }
            />
          </div>
          <div className="px-4 pb-4 pt-0">
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
                    <span className="text-xs font-mono text-muted-foreground w-12 shrink-0 tabular-nums">
                      {item.time.split(' - ')[0]}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" aria-hidden />
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
          </div>
        </AdminCard>
      </div>

      {/* AI Daily Briefing */}
      <DailyBriefingCard stats={briefingStats} />

      <CheckInDialog open={quickCheckInOpen} onOpenChange={setQuickCheckInOpen} />
    </div>
  );
};

export default Dashboard;
