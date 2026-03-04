import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, StatCard, DatePicker, DataTable, EmptyState, SearchBar, type Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/common';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useDashboardStats,
  useHighRiskMembers,
  useHotLeads,
  useUpcomingBirthdays,
} from '@/hooks/useDashboardStats';
import {
  useScheduleByDate,
  mapScheduleToItem,
  type ScheduleItem,
} from '@/hooks/useSchedule';
import { useGymCheckinsByDate, type GymCheckinItem } from '@/hooks/useDashboardAttendance';
import { AiSuggestionsCard } from '@/components/dashboard/AiSuggestionsCard';
import { ExpiringPackagesCard } from '@/components/dashboard/ExpiringPackagesCard';
import { DailyBriefingCard } from '@/components/dashboard/DailyBriefingCard';
import { RevenueForecastCard } from '@/components/dashboard/RevenueForecastCard';
import { CheckInDialog } from '@/components/lobby/CheckInDialog';
import { useExpiringPackages } from '@/hooks/useExpiringPackages';
import { DoorOpen } from 'lucide-react';

// Skeleton component for member list items
const MemberListSkeleton = () => (
  <div className="flex items-center gap-3">
    <Skeleton className="h-8 w-8 rounded-full" />
    <div className="flex-1 space-y-1.5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-3 w-16" />
    </div>
    <Skeleton className="h-3 w-12" />
  </div>
);

// Skeleton component for stat cards
const StatCardSkeleton = () => (
  <Card className="shadow-card">
    <div className="p-4 space-y-2">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-20" />
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
    <Skeleton className="h-4 w-10" />
  </div>
);

const Dashboard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
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
  const { data: highRiskMembers = [], isLoading: riskLoading } = useHighRiskMembers();
  const { data: hotLeads = [], isLoading: leadsLoading } = useHotLeads();
  const { data: upcomingBirthdays = [], isLoading: birthdaysLoading } = useUpcomingBirthdays();
  const { data: rawScheduleData = [], isLoading: scheduleLoading } = useScheduleByDate(selectedDate);
  const { data: gymCheckins = [], isLoading: gymLoading } = useGymCheckinsByDate(selectedDate, debouncedSearch);

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

  // Calculate comparison
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
      activeMembers: stats.checkinsToday, // approximate
    };
  }, [stats, expiringPkgs, highRiskMembers]);

  return (
    <div>
      <PageHeader title={t('dashboard.title')} />

      {/* AI Daily Briefing */}
      <div className="mb-6">
        <DailyBriefingCard stats={briefingStats} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  comparison={
                    checkinComparison !== 0
                      ? { value: checkinComparison, label: t('dashboard.comparedToYesterday') }
                      : undefined
                  }
                />
                <StatCard
                  title={t('dashboard.currentlyInClass')}
                  value={stats?.currentlyInClass || 0}
                  subtitle={t('dashboardExtra.attendees')}
                  color="orange"
                />
                <StatCard
                  title={t('dashboard.classesScheduledToday')}
                  value={stats?.classesToday || 0}
                  color="blue"
                  action={
                    <Link to="/calendar">
                      <Button variant="link" className="text-primary p-0 h-auto">
                        {t('dashboard.goToSchedule')} →
                      </Button>
                    </Link>
                  }
                />
              </>
            )}
          </div>

          {/* Tabs and Schedule */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                className="mb-4"
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
                      <div className="mt-4 flex justify-end">
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
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* High risk members */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <StatusBadge variant="high-risk">{t('dashboard.highRiskMembers')}</StatusBadge>
                </CardTitle>
                <Button
                  variant="link"
                  size="sm"
                  className="text-primary p-0 h-auto text-xs"
                  onClick={() => navigate('/members?risk=high')}
                >
                  {t('common.viewAll')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {riskLoading ? (
                <div className="space-y-3">
                  <MemberListSkeleton />
                  <MemberListSkeleton />
                </div>
              ) : highRiskMembers.length > 0 ? (
                <div className="space-y-3">
                  {highRiskMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => navigate(`/members/${member.id}`)}
                      className="flex items-center gap-3 w-full text-left hover:bg-accent/50 rounded-md p-1 -m-1 transition-colors"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {member.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.phone}</p>
                      </div>
                      <p className="text-xs text-destructive">{member.expiryDate}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('dashboard.noHighRisk')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Hot leads */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t('dashboard.hotLeads')}</CardTitle>
                <Button
                  variant="link"
                  size="sm"
                  className="text-primary p-0 h-auto text-xs"
                  onClick={() => navigate('/leads?status=interested')}
                >
                  {t('common.viewAll')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {leadsLoading ? (
                <div className="space-y-3">
                  <MemberListSkeleton />
                </div>
              ) : hotLeads.length > 0 ? (
                <div className="space-y-3">
                  {hotLeads.map((lead) => (
                    <button
                      key={lead.id}
                      onClick={() => navigate(`/leads?id=${lead.id}`)}
                      className="flex items-center gap-3 w-full text-left hover:bg-accent/50 rounded-md p-1 -m-1 transition-colors"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {lead.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{lead.name}</p>
                        <StatusBadge variant="pending">{lead.status}</StatusBadge>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">{t('dashboard.noHotLeads')}</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-primary mt-1"
                    onClick={() => navigate('/leads')}
                  >
                    {t('leads.createLead')} →
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming birthdays */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t('dashboard.upcomingBirthdays')}</CardTitle>
                <Button
                  variant="link"
                  size="sm"
                  className="text-primary p-0 h-auto text-xs"
                  onClick={() => navigate('/members')}
                >
                  {t('common.viewAll')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {birthdaysLoading ? (
                <div className="space-y-3">
                  <MemberListSkeleton />
                </div>
              ) : upcomingBirthdays.length > 0 ? (
                <div className="space-y-3">
                  {upcomingBirthdays.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => navigate(`/members/${member.id}`)}
                      className="flex items-center gap-3 w-full text-left hover:bg-accent/50 rounded-md p-1 -m-1 transition-colors"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {member.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{member.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{member.date}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('dashboard.noBirthdays')}
                </p>
              )}
            </CardContent>
          </Card>
          {/* Revenue Forecast */}
          <RevenueForecastCard />

          {/* Expiring Packages */}
          <ExpiringPackagesCard />

          {/* AI Suggestions */}
          <AiSuggestionsCard />
        </div>
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
