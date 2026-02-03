import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, DataTable, EmptyState, type Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useMembersAtRiskStats, type MemberAtRisk, type RiskLevel } from '@/hooks/useReports';
import { cn } from '@/lib/utils';

const MembersAtRiskPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState<RiskLevel | 'all'>('all');

  const { data, isLoading } = useMembersAtRiskStats();

  const stats = data?.stats;
  const members = data?.members || [];

  // Filter members based on selected risk level
  const filteredMembers = selectedFilter === 'all'
    ? members
    : members.filter((m) => m.riskLevel === selectedFilter);

  // Pie chart data
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
          {row.expiresIn} {t('packages.create.daysAfterActivation').split(' ')[0].toLowerCase()}
        </span>
      ),
    },
    {
      key: 'phone',
      header: t('leads.contactNumber'),
      cell: (row) => row.phone,
    },
  ];

  const riskDefinitions = [
    {
      level: 'high' as const,
      label: t('reports.riskLevels.high'),
      percent: stats?.highRisk.percent || 0,
      count: stats?.highRisk.count || 0,
      criteria: '≤30 days or ≤33% and ≤3 remaining sessions',
      color: 'bg-danger',
      textColor: 'text-danger',
    },
    {
      level: 'medium' as const,
      label: t('reports.riskLevels.medium'),
      percent: stats?.mediumRisk.percent || 0,
      count: stats?.mediumRisk.count || 0,
      criteria: '≤60 days or ≤60% and ≤15 remaining sessions',
      color: 'bg-warning',
      textColor: 'text-warning',
    },
    {
      level: 'low' as const,
      label: t('reports.riskLevels.low'),
      percent: stats?.lowRisk.percent || 0,
      count: stats?.lowRisk.count || 0,
      criteria: '≥61 days and ≥61% and ≥16 remaining sessions',
      color: 'bg-accent-teal',
      textColor: 'text-accent-teal',
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('reports.membersAtRisk')}
        breadcrumbs={[
          { label: t('nav.reports'), href: '/report' },
          { label: t('reports.membersAtRisk') },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/report')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back')}
            </Button>
            <Button variant="outline">{t('reports.manage')}</Button>
            <Button variant="outline">{t('common.export')}</Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Skeleton className="h-64 lg:col-span-1" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Pie Chart */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">{t('reports.membersAtRisk')}</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  {t('common.noData')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risk Level Definitions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Risk Level Criteria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium">Level</th>
                      <th className="text-left py-2 px-3 font-medium">%</th>
                      <th className="text-left py-2 px-3 font-medium">Count</th>
                      <th className="text-left py-2 px-3 font-medium">Criteria</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskDefinitions.map((def) => (
                      <tr key={def.level} className="border-b last:border-0">
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <div className={cn('w-3 h-3 rounded-full', def.color)} />
                            <span className={def.textColor}>{def.label}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3">{def.percent}%</td>
                        <td className="py-2 px-3">{def.count}</td>
                        <td className="py-2 px-3 text-muted-foreground">{def.criteria}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Button
          variant={selectedFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedFilter('all')}
        >
          {t('common.all')} ({stats?.total || 0})
        </Button>
        <Button
          variant={selectedFilter === 'high' ? 'default' : 'outline'}
          size="sm"
          className={selectedFilter === 'high' ? 'bg-danger hover:bg-danger/90' : 'text-danger border-danger'}
          onClick={() => setSelectedFilter('high')}
        >
          {t('reports.riskLevels.high')} ({stats?.highRisk.count || 0})
        </Button>
        <Button
          variant={selectedFilter === 'medium' ? 'default' : 'outline'}
          size="sm"
          className={selectedFilter === 'medium' ? 'bg-warning hover:bg-warning/90 text-warning-foreground' : 'text-warning border-warning'}
          onClick={() => setSelectedFilter('medium')}
        >
          {t('reports.riskLevels.medium')} ({stats?.mediumRisk.count || 0})
        </Button>
        <Button
          variant={selectedFilter === 'low' ? 'default' : 'outline'}
          size="sm"
          className={selectedFilter === 'low' ? 'bg-accent-teal hover:bg-accent-teal/90 text-white' : 'text-accent-teal border-accent-teal'}
          onClick={() => setSelectedFilter('low')}
        >
          {t('reports.riskLevels.low')} ({stats?.lowRisk.count || 0})
        </Button>
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
    </div>
  );
};

export default MembersAtRiskPage;
