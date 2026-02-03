import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DataTable, EmptyState, type Column } from '@/components/common';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportPageLayout, ReportStatCard, ReportFilters } from '@/components/reports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { usePackageSales } from '@/hooks/useReports';
import { subDays } from 'date-fns';
import { exportToCsv, type CsvColumn } from '@/lib/exportCsv';

interface PackageSaleRow {
  packageName: string;
  packageType: string;
  category: string;
  unitsSold: number;
  revenue: number;
}

const PackageSalesPage = () => {
  const { t, language } = useLanguage();
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({
    start: subDays(new Date(), 30),
    end: new Date(),
  });
  const [filters, setFilters] = useState({
    packageType: 'all',
    category: 'all',
  });

  const { data, isLoading } = usePackageSales(dateRange, filters);

  const stats = data?.stats;
  const chartData = data?.chartData || [];
  const tableData = data?.tableData || [];

  const columns: Column<PackageSaleRow>[] = [
    { key: 'packageName', header: t('transferSlips.packageName'), cell: (row) => row.packageName },
    { key: 'packageType', header: t('packages.type'), cell: (row) => row.packageType },
    { key: 'category', header: t('schedule.category'), cell: (row) => row.category },
    { key: 'unitsSold', header: t('reports.unitsSold'), cell: (row) => row.unitsSold },
    { key: 'revenue', header: `${t('reports.revenue')} (฿)`, cell: (row) => row.revenue.toLocaleString() },
  ];

  const filterOptions = [
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
    const csvColumns: CsvColumn<PackageSaleRow>[] = [
      { key: 'packageName', header: t('transferSlips.packageName'), accessor: (r) => r.packageName },
      { key: 'packageType', header: t('packages.type'), accessor: (r) => r.packageType },
      { key: 'category', header: t('schedule.category'), accessor: (r) => r.category },
      { key: 'unitsSold', header: t('reports.unitsSold'), accessor: (r) => r.unitsSold },
      { key: 'revenue', header: t('reports.revenue'), accessor: (r) => r.revenue },
    ];
    const date = new Date().toISOString().split('T')[0];
    exportToCsv(tableData, csvColumns, `package-sales-${date}`);
  };

  return (
    <ReportPageLayout
      title={t('reports.packageSalesTitle')}
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
            title={t('reports.maxUnitsSold')}
            value={stats?.maxUnitsSold || 0}
            subtitle={stats?.maxUnitsSoldPackage || '-'}
            color="primary"
          />
          <ReportStatCard
            title={t('reports.minUnitsSold')}
            value={stats?.minUnitsSold || 0}
            subtitle={stats?.minUnitsSoldPackage || '-'}
            color="warning"
          />
          <ReportStatCard
            title={t('reports.maxRevenue')}
            value={`฿${(stats?.maxRevenue || 0).toLocaleString()}`}
            subtitle={stats?.maxRevenuePackage || '-'}
            color="teal"
          />
          <ReportStatCard
            title={t('reports.minRevenue')}
            value={`฿${(stats?.minRevenue || 0).toLocaleString()}`}
            subtitle={stats?.minRevenuePackage || '-'}
            color="danger"
          />
        </div>
      )}

      {/* Chart - Double Bar */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t('reports.packageSalesTitle')}</CardTitle>
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
                <Legend />
                <Bar
                  dataKey="units"
                  name={t('reports.unitsSold')}
                  fill="hsl(var(--primary))"
                  radius={[0, 4, 4, 0]}
                />
                <Bar
                  dataKey="revenue"
                  name={t('reports.revenue')}
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
          rowKey={(row) => row.packageName}
        />
      )}
    </ReportPageLayout>
  );
};

export default PackageSalesPage;
