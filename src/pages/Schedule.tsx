import React, { useState } from 'react';
import { QrCode } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, StatCard, DatePicker, DataTable, EmptyState, type Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useScheduleByDate, useScheduleStats, useTrainers, type ScheduleWithRelations } from '@/hooks/useSchedule';
import { ScheduleClassDialog } from '@/components/schedule/ScheduleClassDialog';

const Schedule = () => {
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: scheduleData = [], isLoading: scheduleLoading } = useScheduleByDate(selectedDate);
  const { data: stats, isLoading: statsLoading } = useScheduleStats(selectedDate);
  const { data: trainers = [] } = useTrainers();

  // Filter by trainer if selected
  const filteredSchedule = selectedTrainerId
    ? scheduleData.filter((s) => s.trainer_id === selectedTrainerId)
    : scheduleData;

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
      cell: (row) => `${row.checked_in || 0}/${row.capacity || 0}`,
    },
    {
      key: 'qr',
      header: t('schedule.qr'),
      cell: (row) => (
        <Button variant="ghost" size="sm">
          <QrCode className="h-4 w-4" />
        </Button>
      ),
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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
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
              comparison={{ value: 5, label: t('dashboard.comparedToYesterday') }}
              color="teal"
            />
            <StatCard
              title={t('schedule.personalTraining')}
              value={stats?.ptCount || 0}
              comparison={{ value: -10 }}
              color="orange"
            />
            <StatCard
              title={t('schedule.avgCapacity')}
              value={`${stats?.avgCapacity || 0}%`}
              comparison={{ value: 8 }}
              color="blue"
            />
            <StatCard
              title={t('schedule.cancellations')}
              value={stats?.cancellations || 0}
              comparison={{ value: -50 }}
              color="gray"
            />
          </>
        )}
      </div>

      {/* Trainer Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={selectedTrainerId === null ? 'outline' : 'ghost'}
          className="rounded-full"
          onClick={() => setSelectedTrainerId(null)}
        >
          {t('schedule.allTrainers')}
        </Button>
        {trainers.map((trainer) => (
          <Button
            key={trainer.id}
            variant={selectedTrainerId === trainer.id ? 'outline' : 'ghost'}
            className="rounded-full flex items-center gap-2"
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

      {/* Schedule Table */}
      {scheduleLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : filteredSchedule.length === 0 ? (
        <EmptyState message={t('common.noData')} />
      ) : (
        <DataTable columns={columns} data={filteredSchedule} rowKey={(row) => row.id} />
      )}

      {/* Schedule Dialog */}
      <ScheduleClassDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultDate={selectedDate}
      />
    </div>
  );
};

export default Schedule;
