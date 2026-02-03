import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DataTable, EmptyState, type Column } from '@/components/common';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportPageLayout, ReportStatCard, ReportFilters } from '@/components/reports';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useActiveMembers } from '@/hooks/useReports';
import { subDays } from 'date-fns';
import { exportToCsv, type CsvColumn } from '@/lib/exportCsv';

interface ActiveMemberRow {
  date: string;
  activeMembers: number;
  location: string;
  ageGroup: string;
  gender: string;
}

const ActiveMembersPage = () => {
  const { t, language } = useLanguage();
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({
    start: subDays(new Date(), 30),
    end: new Date(),
  });
  const [filters, setFilters] = useState({
    location: 'all',
    age: 'all',
    gender: 'all',
  });

  const { data, isLoading } = useActiveMembers(dateRange, filters);

  const stats = data?.stats;
  const chartData = data?.chartData || [];
  const tableData = data?.tableData || [];

  const columns: Column<ActiveMemberRow>[] = [
    { key: 'date', header: t('reports.date'), cell: (row) => row.date },
    { key: 'activeMembers', header: t('reports.activeMembers'), cell: (row) => row.activeMembers },
    { key: 'location', header: t('lobby.location'), cell: (row) => row.location },
    { key: 'ageGroup', header: t('reports.age'), cell: (row) => row.ageGroup },
    { key: 'gender', header: t('reports.gender'), cell: (row) => row.gender },
  ];

  const filterOptions = [
    {
      id: 'location',
      label: t('reports.allLocations'),
      value: filters.location,
      options: [
        { value: 'all', label: t('reports.allLocations') },
      ],
      onChange: (value: string) => setFilters((f) => ({ ...f, location: value })),
    },
    {
      id: 'age',
      label: t('reports.allAges'),
      value: filters.age,
      options: [
        { value: 'all', label: t('reports.allAges') },
        { value: '18-25', label: '18-25' },
        { value: '26-35', label: '26-35' },
        { value: '36-45', label: '36-45' },
        { value: '46+', label: '46+' },
      ],
      onChange: (value: string) => setFilters((f) => ({ ...f, age: value })),
    },
    {
      id: 'gender',
      label: t('reports.allGenders'),
      value: filters.gender,
      options: [
        { value: 'all', label: t('reports.allGenders') },
        { value: 'male', label: language === 'th' ? 'ชาย' : 'Male' },
        { value: 'female', label: language === 'th' ? 'หญิง' : 'Female' },
      ],
      onChange: (value: string) => setFilters((f) => ({ ...f, gender: value })),
    },
  ];

  const handleExportCSV = () => {
    const csvColumns: CsvColumn<ActiveMemberRow>[] = [
      { key: 'date', header: t('reports.date'), accessor: (r) => r.date },
      { key: 'activeMembers', header: t('reports.activeMembers'), accessor: (r) => r.activeMembers },
      { key: 'location', header: t('lobby.location'), accessor: (r) => r.location },
      { key: 'ageGroup', header: t('reports.age'), accessor: (r) => r.ageGroup },
      { key: 'gender', header: t('reports.gender'), accessor: (r) => r.gender },
    ];
    const date = new Date().toISOString().split('T')[0];
    exportToCsv(tableData, csvColumns, `active-members-${date}`);
  };

  return (
    <ReportPageLayout
      title={t('reports.activeMembersTitle')}
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
            title={t('reports.mostActiveDay')}
            value={stats?.mostActiveDay || 0}
            subtitle={stats?.mostActiveDayDate || '-'}
            color="primary"
          />
          <ReportStatCard
            title={t('reports.leastActiveDay')}
            value={stats?.leastActiveDay || 0}
            subtitle={stats?.leastActiveDayDate || '-'}
            color="warning"
          />
          <ReportStatCard
            title={t('reports.avgActivePerDay')}
            value={stats?.avgActivePerDay || 0}
            color="teal"
          />
          <ReportStatCard
            title={t('reports.newActivePerDay')}
            value={stats?.newActivePerDay || 0}
            color="purple"
          />
        </div>
      )}

      {/* Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t('reports.activeMembers')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px]" />
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                  }}
                />
                <Legend />
                <Bar
                  dataKey="activeMembers"
                  name={t('reports.activeMembers')}
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
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
          rowKey={(row) => `${row.date}-${row.location}`}
        />
      )}
    </ReportPageLayout>
  );
};

export default ActiveMembersPage;
