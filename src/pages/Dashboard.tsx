import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Dumbbell, CalendarCheck, DoorOpen } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { StatCard, DataTable, type Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  useDashboardStats,
  useHighRiskMembers,
} from '@/hooks/useDashboardStats';
import {
  useScheduleByDate,
  mapScheduleToItem,
  type ScheduleItem,
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
import { usePermissions } from '@/hooks/usePermissions';

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

const Dashboard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [quickCheckInOpen, setQuickCheckInOpen] = useState(false);
  const [briefingOpen, setBriefingOpen] = useState(false);

  // Fetch real data
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: highRiskMembers = [] } = useHighRiskMembers();
  const { data: rawScheduleData = [], isLoading: scheduleLoading } = useScheduleByDate(new Date());
  const { data: trends } = useDashboardTrends();

  const scheduleData = useMemo(() => rawScheduleData.map(mapScheduleToItem).slice(0, 5), [rawScheduleData]);

  const scheduleColumns: Column<ScheduleItem>[] = [
    { key: 'time', header: t('schedule.time'), cell: (row) => row.time },
    { key: 'class', header: t('schedule.class'), cell: (row) => row.className },
    { key: 'trainer', header: t('schedule.trainer'), cell: (row) => row.trainer },
    { key: 'room', header: t('schedule.room'), cell: (row) => row.room },
    { key: 'availability', header: t('schedule.availability'), cell: (row) => row.availability },
  ];

  const checkinComparison = stats
    ? stats.checkinsToday - stats.checkinsYesterday
    : 0;

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
      activeMembers: stats.checkinsToday,
    };
  }, [stats, expiringPkgs, highRiskMembers]);

  return (
    <div className="space-y-6">
      {/* Row 0 — Welcome header with quick actions */}
      <DashboardWelcome onQuickCheckIn={() => setQuickCheckInOpen(true)} />

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

      {/* Row 2 — 4 KPI StatCards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statsLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title={t('dashboard.allCheckinsToday')}
              value={stats?.checkinsToday || 0}
              subtitle={t('dashboardExtra.mainLocation')}
              color="teal"
              icon={<DoorOpen className="h-5 w-5" />}
              trend={trends?.checkins7d}
              comparison={
                checkinComparison !== 0
                  ? { value: checkinComparison, label: t('dashboard.comparedToYesterday') }
                  : undefined
              }
              onClick={() => navigate('/lobby')}
            />
            <StatCard
              title={t('dashboard.currentlyInClass')}
              value={stats?.currentlyInClass || 0}
              subtitle={t('dashboardExtra.attendees')}
              color="orange"
              icon={<Dumbbell className="h-5 w-5" />}
              onClick={() => navigate('/calendar')}
            />
            <StatCard
              title={t('dashboard.classesScheduledToday')}
              value={stats?.classesToday || 0}
              color="blue"
              icon={<CalendarCheck className="h-5 w-5" />}
              trend={trends?.classes7d}
              onClick={() => navigate('/calendar')}
            />
            <GoalProgressCard />
          </>
        )}
      </div>

      {/* Row 3 — Needs Attention + Today's Schedule side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
            ) : (
              <DataTable
                columns={scheduleColumns}
                data={scheduleData}
                rowKey={(row) => row.id}
                emptyMessage={t('dashboard.noClassesToday')}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 4 — AI Daily Briefing (collapsible) */}
      <Collapsible open={briefingOpen} onOpenChange={setBriefingOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground w-full justify-center gap-1">
            {briefingOpen ? '▲ Hide AI Briefing' : '▼ Show AI Briefing'}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <DailyBriefingCard stats={briefingStats} />
        </CollapsibleContent>
      </Collapsible>

      <CheckInDialog open={quickCheckInOpen} onOpenChange={setQuickCheckInOpen} />
    </div>
  );
};

export default Dashboard;
