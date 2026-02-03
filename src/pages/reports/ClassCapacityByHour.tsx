import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportPageLayout, ReportStatCard, ReportFilters } from '@/components/reports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClassCapacityByHour } from '@/hooks/useReports';
import { subDays } from 'date-fns';
import { cn } from '@/lib/utils';

const HOURS = Array.from({ length: 24 }, (_, i) => 
  i === 0 ? '12AM' : i < 12 ? `${i}AM` : i === 12 ? '12PM' : `${i - 12}PM`
);

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_TH = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

const ClassCapacityByHourPage = () => {
  const { t, language } = useLanguage();
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({
    start: subDays(new Date(), 30),
    end: new Date(),
  });
  const [filters, setFilters] = useState({
    trainer: 'all',
    location: 'all',
  });

  const { data, isLoading } = useClassCapacityByHour(dateRange, filters);

  const stats = data?.stats;
  const heatmapData = data?.heatmapData || [];

  const dayLabels = language === 'th' ? DAYS_TH : DAYS;

  const filterOptions = [
    {
      id: 'trainer',
      label: t('reports.allTrainers'),
      value: filters.trainer,
      options: [
        { value: 'all', label: t('reports.allTrainers') },
      ],
      onChange: (value: string) => setFilters((f) => ({ ...f, trainer: value })),
    },
    {
      id: 'location',
      label: t('reports.allLocations'),
      value: filters.location,
      options: [
        { value: 'all', label: t('reports.allLocations') },
      ],
      onChange: (value: string) => setFilters((f) => ({ ...f, location: value })),
    },
  ];

  const getHeatColor = (value: number) => {
    if (value === 0) return 'bg-muted';
    if (value <= 25) return 'bg-blue-100 dark:bg-blue-900/30';
    if (value <= 50) return 'bg-blue-300 dark:bg-blue-700/50';
    if (value <= 75) return 'bg-blue-500 dark:bg-blue-500/70';
    return 'bg-blue-700 dark:bg-blue-400';
  };

  return (
    <ReportPageLayout title={t('reports.classCapacityByHourTitle')}>
      <ReportFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        filters={filterOptions}
      />

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <ReportStatCard
            title={t('reports.avgCapacity')}
            value={`${stats?.avgCapacity || 0}%`}
            color="primary"
          />
          <ReportStatCard
            title={t('reports.classesWithBookings')}
            value={stats?.classesWithBookings || 0}
            color="teal"
          />
          <ReportStatCard
            title={t('reports.avgClassesPerDay')}
            value={stats?.avgClassesPerDay || 0}
            color="purple"
          />
          <ReportStatCard
            title={t('reports.peakCapacityTime')}
            value={stats?.peakCapacityTime || '-'}
            color="warning"
          />
        </div>
      )}

      {/* Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('reports.classCapacityByHourTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px]" />
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Hours header */}
                <div className="flex">
                  <div className="w-12 shrink-0" />
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="flex-1 text-center text-xs text-muted-foreground pb-2"
                    >
                      {hour}
                    </div>
                  ))}
                </div>
                {/* Days rows */}
                {dayLabels.map((day, dayIndex) => (
                  <div key={day} className="flex items-center">
                    <div className="w-12 shrink-0 text-xs text-muted-foreground pr-2 text-right">
                      {day}
                    </div>
                    {HOURS.map((_, hourIndex) => {
                      const cellData = heatmapData.find(
                        (d) => d.day === dayIndex && d.hour === hourIndex
                      );
                      const value = cellData?.capacity || 0;
                      return (
                        <div
                          key={`${dayIndex}-${hourIndex}`}
                          className={cn(
                            'flex-1 aspect-square m-0.5 rounded-sm flex items-center justify-center text-xs',
                            getHeatColor(value),
                            value > 50 && 'text-white'
                          )}
                          title={`${day} ${HOURS[hourIndex]}: ${value}%`}
                        >
                          {value > 0 && value}
                        </div>
                      );
                    })}
                  </div>
                ))}
                {/* Legend */}
                <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
                  <span>{t('reports.lessCapacity')}</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded bg-muted" />
                    <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/30" />
                    <div className="w-4 h-4 rounded bg-blue-300 dark:bg-blue-700/50" />
                    <div className="w-4 h-4 rounded bg-blue-500 dark:bg-blue-500/70" />
                    <div className="w-4 h-4 rounded bg-blue-700 dark:bg-blue-400" />
                  </div>
                  <span>{t('reports.moreCapacity')}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </ReportPageLayout>
  );
};

export default ClassCapacityByHourPage;
