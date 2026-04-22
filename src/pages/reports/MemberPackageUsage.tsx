import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DataTable, EmptyState, type Column } from '@/components/common';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportPageLayout, ReportStatCard, ReportFilters } from '@/components/reports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemberPackageUsage, type PackageUsageRow } from '@/hooks/useReports';
import { exportToCsv, type CsvColumn } from '@/lib/exportCsv';

const MemberPackageUsagePage = () => {
  const { t } = useLanguage();
  const [filters, setFilters] = useState({ packageType: 'all', status: 'all' });

  const { data, isLoading } = useMemberPackageUsage(filters);

  const stats = data?.stats;
  const chartData = data?.chartData || [];
  const tableData = data?.tableData || [];

  const columns: Column<PackageUsageRow>[] = [
    { key: 'memberName', header: t('members.title'), cell: (row) => row.memberName },
    { key: 'packageName', header: t('transferSlips.packageName'), cell: (row) => row.packageName },
    { key: 'packageType', header: t('packages.type'), cell: (row) => row.packageType },
    { key: 'sessionsUsed', header: t('reports.sessionsUsed'), cell: (row) => `${row.sessionsUsed} / ${row.sessionsTotal}` },
    { key: 'usagePercent', header: t('reports.usagePercent'), cell: (row) => `${row.usagePercent}%` },
    { key: 'expiryDate', header: t('packages.expiryDate'), cell: (row) => row.expiryDate },
    { key: 'status', header: t('common.status'), cell: (row) => row.status },
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
      id: 'status',
      label: t('common.status'),
      value: filters.status,
      options: [
        { value: 'all', label: t('common.all') },
        { value: 'active', label: t('common.active') },
        { value: 'expired', label: t('packages.expired') },
        { value: 'used_up', label: t('packages.usedUp') },
      ],
      onChange: (value: string) => setFilters((f) => ({ ...f, status: value })),
    },
  ];

  const handleExportCSV = () => {
    const csvColumns: CsvColumn<PackageUsageRow>[] = [
      { key: 'memberName', header: t('members.title'), accessor: (r) => r.memberName },
      { key: 'packageName', header: t('transferSlips.packageName'), accessor: (r) => r.packageName },
      { key: 'packageType', header: t('packages.type'), accessor: (r) => r.packageType },
      { key: 'sessionsUsed', header: t('reports.sessionsUsed'), accessor: (r) => r.sessionsUsed },
      { key: 'sessionsTotal', header: t('reports.sessionsTotal'), accessor: (r) => r.sessionsTotal },
      { key: 'usagePercent', header: t('reports.usagePercent'), accessor: (r) => r.usagePercent },
      { key: 'expiryDate', header: t('packages.expiryDate'), accessor: (r) => r.expiryDate },
      { key: 'status', header: t('common.status'), accessor: (r) => r.status },
    ];
    const date = new Date().toISOString().split('T')[0];
    exportToCsv(tableData, csvColumns, `member-package-usage-${date}`);
  };

  return (
    <ReportPageLayout
      title={t('reports.membersPackageUsage')}
      onExportCSV={handleExportCSV}
    >
      <ReportFilters
        filters={filterOptions}
      />

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <ReportStatCard
            title={t('reports.totalPackages')}
            value={stats?.totalActivePackages || 0}
            color="primary"
          />
          <ReportStatCard
            title={t('reports.avgUsage')}
            value={`${stats?.avgUsagePercent || 0}%`}
            color="teal"
          />
          <ReportStatCard
            title={t('reports.fullyUsed')}
            value={stats?.fullyUsed || 0}
            color="warning"
          />
          <ReportStatCard
            title={t('reports.neverUsed')}
            value={stats?.neverUsed || 0}
            color="danger"
          />
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t('reports.usageDistribution')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[280px]" />
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                  }}
                />
                <Bar dataKey="value" name={t('reports.packages')} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
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
          rowKey={(row) => `${row.memberName}-${row.packageName}`}
        />
      )}
    </ReportPageLayout>
  );
};

export default MemberPackageUsagePage;
