import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DataTable, EmptyState, type Column } from '@/components/common';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ReportPageLayout, ReportStatCard, ReportFilters } from '@/components/reports';
import { useMemberPackageAtRisk, type PackageAtRiskRow } from '@/hooks/useReports';
import { exportToCsv, type CsvColumn } from '@/lib/exportCsv';
import { cn } from '@/lib/utils';

const MemberPackageAtRiskPage = () => {
  const { t } = useLanguage();
  const [filters, setFilters] = useState({ packageType: 'all', riskLevel: 'all' });

  const { data, isLoading } = useMemberPackageAtRisk(filters);

  const stats = data?.stats;
  const tableData = data?.tableData || [];

  const riskBadgeClass = (level: string) =>
    cn({
      'bg-danger/10 text-danger border-danger/30': level === 'high',
      'bg-warning/10 text-warning border-warning/30': level === 'medium',
      'bg-accent-teal/10 text-accent-teal border-accent-teal/30': level === 'low',
    });

  const columns: Column<PackageAtRiskRow>[] = [
    { key: 'memberName', header: t('members.title'), cell: (row) => row.memberName },
    { key: 'packageName', header: t('transferSlips.packageName'), cell: (row) => row.packageName },
    { key: 'packageType', header: t('packages.type'), cell: (row) => row.packageType },
    { key: 'sessionsRemaining', header: t('reports.sessionsRemaining'), cell: (row) => row.sessionsRemaining },
    { key: 'daysUntilExpiry', header: t('reports.daysUntilExpiry'), cell: (row) => row.daysUntilExpiry },
    { key: 'expiryDate', header: t('packages.expiryDate'), cell: (row) => row.expiryDate },
    {
      key: 'riskLevel',
      header: t('reports.riskLevel'),
      cell: (row) => (
        <Badge variant="outline" className={riskBadgeClass(row.riskLevel)}>
          {t(`reports.riskLevels.${row.riskLevel}`)}
        </Badge>
      ),
    },
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
      id: 'riskLevel',
      label: t('reports.allRiskLevels'),
      value: filters.riskLevel,
      options: [
        { value: 'all', label: t('reports.allRiskLevels') },
        { value: 'high', label: t('reports.riskLevels.high') },
        { value: 'medium', label: t('reports.riskLevels.medium') },
        { value: 'low', label: t('reports.riskLevels.low') },
      ],
      onChange: (value: string) => setFilters((f) => ({ ...f, riskLevel: value })),
    },
  ];

  const handleExportCSV = () => {
    const csvColumns: CsvColumn<PackageAtRiskRow>[] = [
      { key: 'memberName', header: t('members.title'), accessor: (r) => r.memberName },
      { key: 'packageName', header: t('transferSlips.packageName'), accessor: (r) => r.packageName },
      { key: 'packageType', header: t('packages.type'), accessor: (r) => r.packageType },
      { key: 'sessionsRemaining', header: t('reports.sessionsRemaining'), accessor: (r) => r.sessionsRemaining },
      { key: 'daysUntilExpiry', header: t('reports.daysUntilExpiry'), accessor: (r) => r.daysUntilExpiry },
      { key: 'expiryDate', header: t('packages.expiryDate'), accessor: (r) => r.expiryDate },
      { key: 'riskLevel', header: t('reports.riskLevel'), accessor: (r) => r.riskLevel },
    ];
    const date = new Date().toISOString().split('T')[0];
    exportToCsv(tableData, csvColumns, `package-at-risk-${date}`);
  };

  return (
    <ReportPageLayout
      title={t('reports.membersPackageAtRisk')}
      onExportCSV={handleExportCSV}
    >
      <ReportFilters filters={filterOptions} />

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <ReportStatCard
            title={t('reports.totalAtRisk')}
            value={stats?.totalAtRisk || 0}
            color="primary"
          />
          <ReportStatCard
            title={t('reports.riskLevels.high')}
            value={stats?.highRisk || 0}
            color="danger"
          />
          <ReportStatCard
            title={t('reports.riskLevels.medium')}
            value={stats?.mediumRisk || 0}
            color="warning"
          />
          <ReportStatCard
            title={t('reports.riskLevels.low')}
            value={stats?.lowRisk || 0}
            color="teal"
          />
        </div>
      )}

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

export default MemberPackageAtRiskPage;
