import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { DataTable, EmptyState, type Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { useMembersAtRiskStats, type MemberAtRisk, type RiskLevel } from '@/hooks/useReports';
import { ReportPageLayout, ReportStatCard } from '@/components/reports';
import { cn } from '@/lib/utils';
import { exportToCsv, type CsvColumn } from '@/lib/exportCsv';

const MembersAtRiskPage = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState<RiskLevel | 'all'>('all');

  const { data, isLoading } = useMembersAtRiskStats();

  const stats = data?.stats;
  const members = data?.members || [];

  // Filter members based on selected risk level
  const filteredMembers = selectedFilter === 'all'
    ? members
    : members.filter((m) => m.riskLevel === selectedFilter);

  // Pie chart data - donut style
  const chartData = stats ? [
    { name: t('reports.riskLevels.high'), value: stats.highRisk.count, color: 'hsl(var(--danger))' },
    { name: t('reports.riskLevels.medium'), value: stats.mediumRisk.count, color: 'hsl(var(--warning))' },
    { name: t('reports.riskLevels.low'), value: stats.lowRisk.count, color: 'hsl(var(--accent-teal))' },
  ].filter(d => d.value > 0) : [];

  const COLORS = ['hsl(var(--danger))', 'hsl(var(--warning))', 'hsl(var(--accent-teal))'];

  const columns: Column<MemberAtRisk>[] = [
    {
      key: 'name',
      header: t('members.title'),
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={row.avatar} />
            <AvatarFallback className="text-xs">
              {row.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'packageName',
      header: t('reports.atRiskPackage'),
      cell: (row) => row.packageName,
    },
    {
      key: 'packageType',
      header: t('packages.type'),
      cell: (row) => (
        <span className="capitalize">{row.packageType}</span>
      ),
    },
    {
      key: 'usage',
      header: t('lobby.usage'),
      cell: (row) => row.usage,
    },
    {
      key: 'expiresIn',
      header: t('reports.expiresIn'),
      cell: (row) => (
        <span className={cn(
          row.expiresIn <= 7 && 'text-danger font-medium',
          row.expiresIn <= 30 && row.expiresIn > 7 && 'text-warning font-medium'
        )}>
          {row.expiresIn} {language === 'th' ? 'วัน' : 'days'}
        </span>
      ),
    },
    {
      key: 'phone',
      header: t('leads.contactNumber'),
      cell: (row) => row.phone,
    },
  ];

  const filterButtons = [
    { key: 'all' as const, label: t('common.all'), count: stats?.total || 0 },
    { key: 'high' as const, label: t('reports.riskLevels.high'), count: stats?.highRisk.count || 0, color: 'danger' },
    { key: 'medium' as const, label: t('reports.riskLevels.medium'), count: stats?.mediumRisk.count || 0, color: 'warning' },
    { key: 'low' as const, label: t('reports.riskLevels.low'), count: stats?.lowRisk.count || 0, color: 'teal' },
  ];

  const handleExportCSV = () => {
    const csvColumns: CsvColumn<MemberAtRisk>[] = [
      { key: 'name', header: t('members.title'), accessor: (r) => r.name },
      { key: 'packageName', header: t('reports.atRiskPackage'), accessor: (r) => r.packageName },
      { key: 'packageType', header: t('packages.type'), accessor: (r) => r.packageType },
      { key: 'usage', header: t('lobby.usage'), accessor: (r) => r.usage },
      { key: 'expiresIn', header: t('reports.expiresIn'), accessor: (r) => r.expiresIn },
      { key: 'phone', header: t('leads.contactNumber'), accessor: (r) => r.phone },
      { key: 'riskLevel', header: t('reports.riskLevel'), accessor: (r) => r.riskLevel },
    ];
    const date = new Date().toISOString().split('T')[0];
    exportToCsv(filteredMembers, csvColumns, `members-at-risk-${date}`);
  };

  return (
    <ReportPageLayout
      title={t('reports.membersAtRisk')}
      onExportCSV={handleExportCSV}
    >
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Skeleton className="h-72 lg:col-span-1" />
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Donut Chart */}
          <Card className="lg:col-span-1">
            <CardContent className="pt-6">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[240px] flex items-center justify-center text-muted-foreground">
                  {t('common.noData')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ReportStatCard
              title={t('reports.riskLevels.high')}
              value={stats?.highRisk.count || 0}
              subtitle={`${stats?.highRisk.percent || 0}%`}
              color="danger"
              info={t('reports.highRiskInfo')}
            />
            <ReportStatCard
              title={t('reports.riskLevels.medium')}
              value={stats?.mediumRisk.count || 0}
              subtitle={`${stats?.mediumRisk.percent || 0}%`}
              color="warning"
              info={t('reports.mediumRiskInfo')}
            />
            <ReportStatCard
              title={t('reports.riskLevels.low')}
              value={stats?.lowRisk.count || 0}
              subtitle={`${stats?.lowRisk.percent || 0}%`}
              color="teal"
              info={t('reports.lowRiskInfo')}
            />
          </div>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {filterButtons.map((btn) => {
          const isActive = selectedFilter === btn.key;
          const colorClasses = {
            danger: isActive ? 'bg-danger hover:bg-danger/90 text-white' : 'text-danger border-danger hover:bg-danger/10',
            warning: isActive ? 'bg-warning hover:bg-warning/90 text-warning-foreground' : 'text-warning border-warning hover:bg-warning/10',
            teal: isActive ? 'bg-accent-teal hover:bg-accent-teal/90 text-white' : 'text-accent-teal border-accent-teal hover:bg-accent-teal/10',
          };

          return (
            <Button
              key={btn.key}
              variant={isActive && btn.key === 'all' ? 'default' : 'outline'}
              size="sm"
              className={btn.color ? colorClasses[btn.color as keyof typeof colorClasses] : ''}
              onClick={() => setSelectedFilter(btn.key)}
            >
              {btn.label} ({btn.count})
            </Button>
          );
        })}
      </div>

      {/* Members Table */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : filteredMembers.length === 0 ? (
        <EmptyState message={t('common.noData')} />
      ) : (
        <DataTable
          columns={columns}
          data={filteredMembers}
          rowKey={(row) => `${row.id}-${row.packageName}`}
          onRowClick={(row) => navigate(`/members/${row.id}/detail`)}
        />
      )}
    </ReportPageLayout>
  );
};

export default MembersAtRiskPage;
