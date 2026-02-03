import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DataTable, EmptyState, type Column } from '@/components/common';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportPageLayout, ReportStatCard, ReportFilters } from '@/components/reports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { usePackageSalesOverTime } from '@/hooks/useReports';
import { subDays } from 'date-fns';
import { exportToCsv, type CsvColumn } from '@/lib/exportCsv';

type TimePeriod = 'day' | 'week' | 'month' | 'year';

interface PackageSaleTimeRow {
  date: string;
  packageName: string;
  packageType: string;
  category: string;
  unitsSold: number;
  revenue: number;
}

const PackageSalesOverTimePage = () => {
  const { t } = useLanguage();
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({
    start: subDays(new Date(), 30),
    end: new Date(),
  });
  const [filters, setFilters] = useState({
    package: 'all',
    packageType: 'all',
    category: 'all',
  });
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('day');

  const { data, isLoading } = usePackageSalesOverTime(dateRange, filters, timePeriod);

  const stats = data?.stats;
  const chartData = data?.chartData || [];
  const tableData = data?.tableData || [];

  const columns: Column<PackageSaleTimeRow>[] = [
    { key: 'date', header: t('reports.date'), cell: (row) => row.date },
    { key: 'packageName', header: t('reports.allPackages'), cell: (row) => row.packageName },
    { key: 'packageType', header: t('packages.type'), cell: (row) => row.packageType },
    { key: 'category', header: t('schedule.category'), cell: (row) => row.category },
    { key: 'unitsSold', header: t('reports.unitsSold'), cell: (row) => row.unitsSold },
    { key: 'revenue', header: `${t('reports.revenue')} (${t('common.thb')})`, cell: (row) => row.revenue.toLocaleString() },
  ];

  const filterOptions = [
    {
      id: 'package',
      label: t('reports.allPackages'),
      value: filters.package,
      options: [
        { value: 'all', label: t('reports.allPackages') },
      ],
      onChange: (value: string) => setFilters((f) => ({ ...f, package: value })),
    },
    {
      id: 'packageType',
      label: t('reports.allTypes'),
      value: filters.packageType,
      options: [
        { value: 'all', label: t('reports.allTypes') },
        { value: 'unlimited', label: t('packages.unlimited') },
        { value: 'session', label: t('packages.session') },
        { value: 'pt', label: t('packages.pt') },
      ],
      onChange: (value: string) => setFilters((f) => ({ ...f, packageType: value })),
    },
    {
      id: 'category',
      label: t('reports.allCategories'),
      value: filters.category,
      options: [
        { value: 'all', label: t('reports.allCategories') },
      ],
      onChange: (value: string) => setFilters((f) => ({ ...f, category: value })),
    },
  ];

  const handleExportCSV = () => {
    const csvColumns: CsvColumn<PackageSaleTimeRow>[] = [
      { key: 'date', header: t('reports.date'), accessor: (r) => r.date },
      { key: 'packageName', header: t('reports.allPackages'), accessor: (r) => r.packageName },
      { key: 'packageType', header: t('packages.type'), accessor: (r) => r.packageType },
      { key: 'category', header: t('schedule.category'), accessor: (r) => r.category },
      { key: 'unitsSold', header: t('reports.unitsSold'), accessor: (r) => r.unitsSold },
      { key: 'revenue', header: t('reports.revenue'), accessor: (r) => r.revenue },
    ];
    const date = new Date().toISOString().split('T')[0];
    exportToCsv(tableData, csvColumns, `package-sales-over-time-${date}`);
  };

  return (
    <ReportPageLayout
      title={t('reports.packageSalesOverTimeTitle')}
      onExportCSV={handleExportCSV}
    >
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
            title={t('reports.totalPackagesSold')}
            value={stats?.totalPackagesSold || 0}
            color="primary"
          />
          <ReportStatCard
            title={t('reports.avgPackagesPerDay')}
            value={stats?.avgPackagesPerDay || 0}
            color="teal"
          />
          <ReportStatCard
            title={t('reports.revenue')}
            value={`฿${(stats?.revenue || 0).toLocaleString()}`}
            color="purple"
          />
          <ReportStatCard
            title={t('reports.avgRevenuePerDay')}
            value={`฿${(stats?.avgRevenuePerDay || 0).toLocaleString()}`}
            color="warning"
          />
        </div>
      )}

      {/* Chart */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{t('reports.packageSalesOverTimeTitle')}</CardTitle>
          <Tabs value={timePeriod} onValueChange={(v) => setTimePeriod(v as TimePeriod)}>
            <TabsList>
              <TabsTrigger value="day">{t('reports.day')}</TabsTrigger>
              <TabsTrigger value="week">{t('reports.week')}</TabsTrigger>
              <TabsTrigger value="month">{t('reports.month')}</TabsTrigger>
              <TabsTrigger value="year">{t('reports.year')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px]" />
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData}>
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
                <Bar
                  yAxisId="left"
                  dataKey="units"
                  name={t('reports.unitsSold')}
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  name={t('reports.revenue')}
                  stroke="hsl(var(--accent-teal))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
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
          rowKey={(row) => `${row.date}-${row.packageName}`}
        />
      )}
    </ReportPageLayout>
  );
};

export default PackageSalesOverTimePage;
