import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DataTable, EmptyState, type Column } from '@/components/common';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportPageLayout, ReportStatCard, ReportFilters } from '@/components/reports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useClassPopularity, type ClassPopularityRow } from '@/hooks/useReports';
import { exportToCsv, type CsvColumn } from '@/lib/exportCsv';
import { subDays } from 'date-fns';

const ClassPopularityPage = () => {
  const { t } = useLanguage();
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({
    start: subDays(new Date(), 30),
    end: new Date(),
  });

  const { data, isLoading } = useClassPopularity(dateRange);

  const stats = data?.stats;
  const chartData = data?.chartData || [];
  const tableData = data?.tableData || [];

  const columns: Column<ClassPopularityRow>[] = [
    { key: 'className', header: t('classes.className'), cell: (row) => row.className },
    { key: 'category', header: t('schedule.category'), cell: (row) => row.category },
    { key: 'totalSchedules', header: t('reports.totalSchedules'), cell: (row) => row.totalSchedules },
    { key: 'totalBookings', header: t('reports.totalBookings'), cell: (row) => row.totalBookings },
    { key: 'avgCapacityPercent', header: t('reports.avgCapacity'), cell: (row) => `${row.avgCapacityPercent}%` },
    { key: 'totalAttendees', header: t('reports.totalAttendees'), cell: (row) => row.totalAttendees },
  ];

  const handleExportCSV = () => {
    const csvColumns: CsvColumn<ClassPopularityRow>[] = [
      { key: 'className', header: t('classes.className'), accessor: (r) => r.className },
      { key: 'category', header: t('schedule.category'), accessor: (r) => r.category },
      { key: 'totalSchedules', header: t('reports.totalSchedules'), accessor: (r) => r.totalSchedules },
      { key: 'totalBookings', header: t('reports.totalBookings'), accessor: (r) => r.totalBookings },
      { key: 'avgCapacityPercent', header: t('reports.avgCapacity'), accessor: (r) => r.avgCapacityPercent },
      { key: 'totalAttendees', header: t('reports.totalAttendees'), accessor: (r) => r.totalAttendees },
    ];
    const date = new Date().toISOString().split('T')[0];
    exportToCsv(tableData, csvColumns, `class-popularity-${date}`);
  };

  return (
    <ReportPageLayout
      title={t('reports.classPopularity')}
      onExportCSV={handleExportCSV}
    >
      <ReportFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        filters={[]}
      />

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <ReportStatCard
            title={t('reports.topClass')}
            value={stats?.topClass || '-'}
            color="primary"
          />
          <ReportStatCard
            title={t('reports.totalClasses')}
            value={stats?.totalClasses || 0}
            color="teal"
          />
          <ReportStatCard
            title={t('reports.avgFillRate')}
            value={`${stats?.avgFillRate || 0}%`}
            color="warning"
          />
          <ReportStatCard
            title={t('reports.totalBookings')}
            value={stats?.totalBookings || 0}
            color="danger"
          />
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t('reports.classPopularityDesc')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px]" />
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={150} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                  }}
                />
                <Bar
                  dataKey="value"
                  name={t('reports.totalBookings')}
                  fill="hsl(var(--primary))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              {t('common.noData')}
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : tableData.length === 0 ? (
        <EmptyState message={t('common.noData')} />
      ) : (
        <DataTable
          columns={columns}
          data={tableData}
          rowKey={(row) => row.className}
        />
      )}
    </ReportPageLayout>
  );
};

export default ClassPopularityPage;
