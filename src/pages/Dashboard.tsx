import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, DoorOpen } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, StatCard, DatePicker, DataTable, SearchBar, type Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useDashboardStats,
} from '@/hooks/useDashboardStats';
import {
  useScheduleByDate,
  mapScheduleToItem,
  type ScheduleItem,
} from '@/hooks/useSchedule';
import { useGymCheckinsByDate, type GymCheckinItem } from '@/hooks/useDashboardAttendance';
import { DailyBriefingCard } from '@/components/dashboard/DailyBriefingCard';
import { CheckInDialog } from '@/components/lobby/CheckInDialog';
import { useExpiringPackages } from '@/hooks/useExpiringPackages';
import { useHighRiskMembers } from '@/hooks/useDashboardStats';
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

// Skeleton component for table rows
const TableRowSkeleton = () => (
  <div className="flex items-center gap-4 py-3 border-b border-border">
    <Skeleton className="h-4 w-16" />
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-4 w-20" />
    <Skeleton className="h-4 w-16" />
    <Skeleton className="h-4 w-14" />
    <Skeleton className="h-4 w-12" />
  </div>
);

const Dashboard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('classes');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [quickCheckInOpen, setQuickCheckInOpen] = useState(false);

  // Debounce search 300ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset search on tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchInput('');
    setDebouncedSearch('');
  };

  // Fetch real data
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: highRiskMembers = [] } = useHighRiskMembers();
  const { data: rawScheduleData = [], isLoading: scheduleLoading } = useScheduleByDate(selectedDate);
  const { data: gymCheckins = [], isLoading: gymLoading } = useGymCheckinsByDate(selectedDate, debouncedSearch);
  const { data: trends } = useDashboardTrends();

  const scheduleData = useMemo(() => rawScheduleData.map(mapScheduleToItem), [rawScheduleData]);

  // Client-side filter for classes tab
  const filteredSchedule = useMemo(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) return scheduleData;
    const q = debouncedSearch.toLowerCase();
    return scheduleData.filter(
      (s) =>
        s.className.toLowerCase().includes(q) ||
        s.trainer.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        s.room.toLowerCase().includes(q)
    );
  }, [scheduleData, debouncedSearch]);

  const scheduleColumns: Column<ScheduleItem>[] = [
    { key: 'time', header: t('schedule.time'), cell: (row) => row.time },
    { key: 'class', header: t('schedule.class'), cell: (row) => row.className },
    { key: 'trainer', header: t('schedule.trainer'), cell: (row) => row.trainer },
    { key: 'location', header: t('lobby.location'), cell: (row) => row.location },
    { key: 'room', header: t('schedule.room'), cell: (row) => row.room },
    { key: 'availability', header: t('schedule.availability'), cell: (row) => row.availability },
    { key: 'checkedIn', header: t('lobby.checkedIn'), cell: (row) => row.checkedIn },
  ];

  const gymColumns: Column<GymCheckinItem>[] = [
    { key: 'time', header: t('lobby.time'), cell: (row) => row.time },
    { key: 'name', header: t('lobby.name'), cell: (row) => row.name },
    { key: 'package', header: t('lobby.packageUsed'), cell: (row) => row.packageName },
    { key: 'location', header: t('lobby.location'), cell: (row) => row.location },
    { key: 'method', header: t('dashboard.checkInMethod'), cell: (row) => row.checkInType },
  ];

  const checkinComparison = stats
    ? stats.checkinsToday - stats.checkinsYesterday
    : 0;

  const searchPlaceholder = activeTab === 'classes'
    ? t('dashboard.searchClasses')
    : t('dashboard.searchGym');

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
    <div className="space-y-4">
      <PageHeader title={t('dashboard.title')} />

      {/* AI Daily Briefing — compact */}
      <DailyBriefingCard stats={briefingStats} />

      {/* Business Health Score + Goals */}
      {can('finance', 'read') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BusinessHealthCard />
          <GoalProgressCard />
        </div>
      )}

      {/* KPI Stats — full width row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {statsLoading ? (
          <>
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
              onClick={() => navigate('/calendar')}
            />
            <StatCard
              title={t('dashboard.classesScheduledToday')}
              value={stats?.classesToday || 0}
              color="blue"
              trend={trends?.classes7d}
              action={
                <Link to="/calendar">
                  <Button variant="link" className="text-primary p-0 h-auto text-xs">
                    {t('dashboard.goToSchedule')} →
                  </Button>
                </Link>
              }
            />
          </>
        )}
      </div>

      {/* Schedule & Check-ins — full width */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList>
                <TabsTrigger value="classes">{t('dashboard.classes')}</TabsTrigger>
                <TabsTrigger value="gym">{t('dashboard.gymCheckin')}</TabsTrigger>
              </TabsList>
            </Tabs>
            <DatePicker date={selectedDate} onChange={setSelectedDate} />
          </div>
        </CardHeader>
        <CardContent>
          <SearchBar
            placeholder={searchPlaceholder}
            value={searchInput}
            onChange={setSearchInput}
            className="mb-3"
          />
          <Tabs value={activeTab}>
            <TabsContent value="classes" className="mt-0">
              {scheduleLoading ? (
                <div className="space-y-0">
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                </div>
              ) : (
                <DataTable
                  columns={scheduleColumns}
                  data={filteredSchedule}
                  rowKey={(row) => row.id}
                  emptyMessage={t('dashboard.noClassesToday')}
                />
              )}
            </TabsContent>
            <TabsContent value="gym" className="mt-0">
              {gymLoading ? (
                <div className="space-y-0">
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                </div>
              ) : (
                <>
                  <DataTable
                    columns={gymColumns}
                    data={gymCheckins}
                    rowKey={(row) => row.id}
                    emptyMessage={t('dashboard.noGymCheckins')}
                  />
                  <div className="mt-3 flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => navigate('/lobby')}>
                      {t('dashboard.goToLobby')} →
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Revenue Forecast + Needs Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RevenueForecastCard />
        <NeedsAttentionCard />
      </div>

      {/* Quick Check-in FAB */}
      <Button
        onClick={() => setQuickCheckInOpen(true)}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg z-30 lg:h-auto lg:w-auto lg:rounded-md lg:px-4 lg:gap-2"
        size="icon"
      >
        <DoorOpen className="h-5 w-5" />
        <span className="hidden lg:inline text-sm">{t('lobby.checkIn')}</span>
      </Button>

      <CheckInDialog open={quickCheckInOpen} onOpenChange={setQuickCheckInOpen} />
    </div>
  );
};

export default Dashboard;
