import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DataTable, EmptyState, type Column } from '@/components/common';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportPageLayout, ReportStatCard, ReportFilters } from '@/components/reports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useClassCategoryPopularity, type ClassCategoryRow } from '@/hooks/useReports';
import { exportToCsv, type CsvColumn } from '@/lib/exportCsv';
import { subDays } from 'date-fns';

const ClassCategoryPopularityPage = () => {
  const { t } = useLanguage();
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({
    start: subDays(new Date(), 30),
    end: new Date(),
  });

  const { data, isLoading } = useClassCategoryPopularity(dateRange);

  const stats = data?.stats;
  const chartData = data?.chartData || [];
  const tableData = data?.tableData || [];

  const columns: Column<ClassCategoryRow>[] = [
    { key: 'category', header: t('schedule.category'), cell: (row) => row.category },
    { key: 'totalClasses', header: t('reports.totalClasses'), cell: (row) => row.totalClasses },
    { key: 'totalBookings', header: t('reports.totalBookings'), cell: (row) => row.totalBookings },
    { key: 'avgCapacityPercent', header: t('reports.avgCapacity'), cell: (row) => `${row.avgCapacityPercent}%` },
    { key: 'totalAttendees', header: t('reports.totalAttendees'), cell: (row) => row.totalAttendees },
  ];

  const handleExportCSV = () => {
    const csvColumns: CsvColumn<ClassCategoryRow>[] = [
      { key: 'category', header: t('schedule.category'), accessor: (r) => r.category },
      { key: 'totalClasses', header: t('reports.totalClasses'), accessor: (r) => r.totalClasses },
      { key: 'totalBookings', header: t('reports.totalBookings'), accessor: (r) => r.totalBookings },
      { key: 'avgCapacityPercent', header: t('reports.avgCapacity'), accessor: (r) => r.avgCapacityPercent },
      { key: 'totalAttendees', header: t('reports.totalAttendees'), accessor: (r) => r.totalAttendees },
    ];
    const date = new Date().toISOString().split('T')[0];
    exportToCsv(tableData, csvColumns, `class-category-popularity-${date}`);
  };

  return (
    <ReportPageLayout
      title={t('reports.classCategoryPopularity')}
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
            title={t('reports.topCategory')}
            value={stats?.topCategory || '-'}
            color="primary"
          />
          <ReportStatCard
            title={t('reports.totalCategories')}
            value={stats?.totalCategories || 0}
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
          <CardTitle className="text-base">{t('reports.classCategoryPopularityDesc')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px]" />
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={130} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                  }}
                />
                <Bar
                  dataKey="value"
                  name={t('reports.totalBookings')}
                  fill="hsl(var(--accent-teal))"
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
          rowKey={(row) => row.category}
        />
      )}
    </ReportPageLayout>
  );
};

export default ClassCategoryPopularityPage;
