import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DataTable, EmptyState, type Column } from '@/components/common';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportPageLayout, ReportStatCard, ReportFilters } from '@/components/reports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useClassCapacityOverTime } from '@/hooks/useReports';
import { subDays } from 'date-fns';
import { exportToCsv, type CsvColumn } from '@/lib/exportCsv';

interface ClassCapacityRow {
  date: string;
  trainer: string;
  location: string;
  classesBooked: number;
  avgCapacity: number;
}

const ClassCapacityOverTimePage = () => {
  const { t } = useLanguage();
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({
    start: subDays(new Date(), 30),
    end: new Date(),
  });
  const [filters, setFilters] = useState({
    trainer: 'all',
    location: 'all',
  });

  const { data, isLoading } = useClassCapacityOverTime(dateRange, filters);

  const stats = data?.stats;
  const chartData = data?.chartData || [];
  const tableData = data?.tableData || [];

  const columns: Column<ClassCapacityRow>[] = [
    { key: 'date', header: t('reports.date'), cell: (row) => row.date },
    { key: 'trainer', header: t('reports.trainer'), cell: (row) => row.trainer },
    { key: 'location', header: t('lobby.location'), cell: (row) => row.location },
    { key: 'classesBooked', header: t('reports.classesBooked'), cell: (row) => row.classesBooked },
    { key: 'avgCapacity', header: t('reports.avgCapacity'), cell: (row) => `${row.avgCapacity}%` },
  ];

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

  const handleExportCSV = () => {
    const csvColumns: CsvColumn<ClassCapacityRow>[] = [
      { key: 'date', header: t('reports.date'), accessor: (r) => r.date },
      { key: 'trainer', header: t('reports.trainer'), accessor: (r) => r.trainer },
      { key: 'location', header: t('lobby.location'), accessor: (r) => r.location },
      { key: 'classesBooked', header: t('reports.classesBooked'), accessor: (r) => r.classesBooked },
      { key: 'avgCapacity', header: t('reports.avgCapacity'), accessor: (r) => r.avgCapacity },
    ];
    const date = new Date().toISOString().split('T')[0];
    exportToCsv(tableData, csvColumns, `class-capacity-${date}`);
  };

  return (
    <ReportPageLayout
      title={t('reports.classCapacityTitle')}
      onExportCSV={handleExportCSV}
    >
      <ReportFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        filters={filterOptions}
      />

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
        </div>
      )}

      {/* Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t('reports.classCapacityTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px]" />
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="capacity"
                  name={t('reports.avgCapacity')}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="classes"
                  name={t('reports.classesBooked')}
                  stroke="hsl(var(--accent-teal))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              {t('common.noData')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : tableData.length === 0 ? (
        <EmptyState message={t('common.noData')} />
      ) : (
        <DataTable
          columns={columns}
          data={tableData}
          rowKey={(row) => `${row.date}-${row.trainer}`}
        />
      )}
    </ReportPageLayout>
  );
};

export default ClassCapacityOverTimePage;
