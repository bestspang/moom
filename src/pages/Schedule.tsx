import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, StatCard, DatePicker, DataTable, EmptyState, SearchBar, type Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useScheduleByDate, useScheduleStats, useTrainers, type ScheduleWithRelations } from '@/hooks/useSchedule';
import { ScheduleClassDialog } from '@/components/schedule/ScheduleClassDialog';
import { BookingManagementDialog } from '@/components/schedule/BookingManagementDialog';

const Schedule = () => {
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleWithRelations | null>(null);

  const { data: scheduleData = [], isLoading: scheduleLoading } = useScheduleByDate(selectedDate);
  const { data: stats, isLoading: statsLoading } = useScheduleStats(selectedDate);
  const { data: trainers = [] } = useTrainers();

  // Filter by trainer and search
  const filteredSchedule = useMemo(() => {
    let result = scheduleData;
    if (selectedTrainerId) {
      result = result.filter((s) => s.trainer_id === selectedTrainerId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => {
        const className = s.class?.name?.toLowerCase() || '';
        const trainerName = s.trainer ? `${s.trainer.first_name} ${s.trainer.last_name}`.toLowerCase() : '';
        const roomName = s.room?.name?.toLowerCase() || '';
        return className.includes(q) || trainerName.includes(q) || roomName.includes(q);
      });
    }
    return result;
  }, [scheduleData, selectedTrainerId, searchQuery]);

  const columns: Column<ScheduleWithRelations>[] = [
    {
      key: 'time',
      header: t('schedule.time'),
      cell: (row) => `${row.start_time?.slice(0, 5)} - ${row.end_time?.slice(0, 5)}`,
    },
    {
      key: 'class',
      header: t('schedule.class'),
      cell: (row) => row.class?.name || '-',
    },
    {
      key: 'category',
      header: t('schedule.category'),
      cell: (row) => row.class?.type || '-',
    },
    {
      key: 'trainer',
      header: t('schedule.trainer'),
      cell: (row) => row.trainer ? `${row.trainer.first_name} ${row.trainer.last_name}` : '-',
    },
    {
      key: 'room',
      header: t('schedule.room'),
      cell: (row) => row.room?.name || '-',
    },
    {
      key: 'availability',
      header: t('schedule.availability'),
      cell: (row) => `${row.booked_count ?? row.checked_in ?? 0}/${row.capacity || 0}`,
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('schedule.title')}
        breadcrumbs={[{ label: t('nav.class') }, { label: t('schedule.title') }]}
        actions={
          <Button className="bg-primary hover:bg-primary-hover" onClick={() => setDialogOpen(true)}>
            {t('schedule.scheduleClass')}
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <DatePicker date={selectedDate} onChange={setSelectedDate} />
        <SearchBar
          placeholder={t('schedule.searchPlaceholder')}
          value={searchQuery}
          onChange={setSearchQuery}
          className="md:max-w-xs"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {statsLoading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            <StatCard
              title={t('schedule.classes')}
              value={stats?.classesCount || 0}
              comparison={{ value: stats?.classesCountDiff || 0, label: t('dashboard.comparedToYesterday') }}
              color="teal"
            />
            <StatCard
              title={t('schedule.personalTraining')}
              value={stats?.ptCount || 0}
              comparison={{ value: stats?.ptCountDiff || 0 }}
              color="orange"
            />
            <StatCard
              title={t('schedule.avgCapacity')}
              value={`${stats?.avgCapacity || 0}%`}
              comparison={{ value: stats?.avgCapacityDiff || 0 }}
              color="blue"
            />
            <StatCard
              title={t('schedule.cancellations')}
              value={stats?.cancellations || 0}
              comparison={{ value: stats?.cancellationsDiff || 0 }}
              color="gray"
            />
          </>
        )}
      </div>

      {/* Trainer Filter Pills - with horizontal scroll on mobile */}
      <div className="relative mb-6">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-2 pb-2 min-w-max">
            <Button
              variant={selectedTrainerId === null ? 'default' : 'ghost'}
              className="rounded-full shrink-0"
              onClick={() => setSelectedTrainerId(null)}
            >
              {t('schedule.allTrainers')}
            </Button>
            {trainers.map((trainer) => (
              <Button
                key={trainer.id}
                variant={selectedTrainerId === trainer.id ? 'default' : 'ghost'}
                className="rounded-full flex items-center gap-2 shrink-0"
                onClick={() => setSelectedTrainerId(trainer.id)}
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {trainer.first_name?.[0]}{trainer.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                {trainer.first_name} {trainer.last_name}
              </Button>
            ))}
          </div>
        </div>
        {/* Mobile scroll indicator */}
        <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden" />
      </div>

      {/* Schedule Table */}
      {scheduleLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : filteredSchedule.length === 0 ? (
        <EmptyState message={t('schedule.noClassesForDate')} />
      ) : (
        <DataTable
          columns={columns}
          data={filteredSchedule}
          rowKey={(row) => row.id}
          onRowClick={(row) => {
            setSelectedSchedule(row);
            setBookingDialogOpen(true);
          }}
        />
      )}

      {/* Schedule Dialog */}
      <ScheduleClassDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultDate={selectedDate}
      />

      {/* Booking Management Dialog */}
      <BookingManagementDialog
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        schedule={selectedSchedule}
      />
    </div>
  );
};

export default Schedule;
