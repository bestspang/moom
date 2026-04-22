import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, StatCard } from '@/components/common';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart3, Users, Calendar, Package, TrendingUp, 
  AlertTriangle, Clock, PieChart, Shield, DollarSign,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { useInsightsOverview, useRevenueDaily } from '@/hooks/useInsightsMetrics';
import { useRevenueByMonth, useMemberGrowth, useClassFillRate, useLeadFunnel } from '@/hooks/useAnalytics';
import { useCohortRetention } from '@/hooks/useCohortRetention';
import { usePeakHourRevenue } from '@/hooks/usePeakHourRevenue';
import { formatCurrency } from '@/lib/formatters';
import { useBusinessHealth } from '@/hooks/useBusinessHealth';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { ReportItem } from '@/components/reports/ReportItem';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOUR_LABELS = Array.from({ length: 12 }, (_, i) => `${i + 6}:00`);

// Industry benchmarks (static defaults)
const BENCHMARKS = {
  retention: 72,
  arpu: 2500,
  utilization: 65,
  conversion: 15,
};

const BenchmarkIndicator = ({ value, benchmark, suffix = '%' }: { value: number; benchmark: number; suffix?: string }) => {
  const isAbove = value >= benchmark;
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-[10px] font-medium',
      isAbove ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400',
    )}>
      {isAbove ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {benchmark}{suffix}
    </span>
  );
};

const Insights = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { can } = usePermissions();
  const canFinance = can('finance', 'read');

  const { data: overview, isLoading: overviewLoading } = useInsightsOverview();
  const { data: healthData } = useBusinessHealth();
  const { data: revenueData, isLoading: revLoading } = useRevenueByMonth();
  const { data: dailyRevenue, isLoading: dailyLoading } = useRevenueDaily();
  const { data: growthData, isLoading: growthLoading } = useMemberGrowth();
  const { data: fillData, isLoading: fillLoading } = useClassFillRate();
  const { data: funnelData, isLoading: funnelLoading } = useLeadFunnel();
  const { data: cohortData, isLoading: cohortLoading } = useCohortRetention();
  const { data: peakData, isLoading: peakLoading } = usePeakHourRevenue();

  return (
    <div>
      <PageHeader
        title={t('insights.title')}
        breadcrumbs={[{ label: t('nav.insights') }]}
      />

      <Tabs defaultValue="overview">
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            {t('insights.overview')}
          </TabsTrigger>
          {canFinance && (
            <TabsTrigger value="revenue" className="gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              {t('insights.revenue')}
            </TabsTrigger>
          )}
          <TabsTrigger value="members" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {t('insights.members')}
          </TabsTrigger>
          <TabsTrigger value="retention" className="gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            {t('insights.retention')}
          </TabsTrigger>
          <TabsTrigger value="classes" className="gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {t('insights.classes')}
          </TabsTrigger>
          <TabsTrigger value="packages" className="gap-1.5">
            <Package className="h-3.5 w-3.5" />
            {t('insights.packages')}
          </TabsTrigger>
        </TabsList>

        {/* ========== OVERVIEW TAB ========== */}
        <TabsContent value="overview">
          {/* KPI Cards with benchmark indicators */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {overviewLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}><CardContent className="p-3"><Skeleton className="h-12 w-full" /></CardContent></Card>
              ))
            ) : (
              <>
                {canFinance && (
                  <StatCard
                    title={t('insights.arpu')}
                    value={formatCurrency(overview?.arpu || 0)}
                    color="teal"
                    subtitle={<>{t('insights.perMember')} <BenchmarkIndicator value={overview?.arpu || 0} benchmark={BENCHMARKS.arpu} suffix="" /></>}
                  />
                )}
                <StatCard
                  title={t('insights.retentionRate')}
                  value={`${overview?.retentionRate || 0}%`}
                  color="blue"
                  subtitle={<BenchmarkIndicator value={overview?.retentionRate || 0} benchmark={BENCHMARKS.retention} />}
                />
                <StatCard
                  title={t('insights.classUtilization')}
                  value={`${overview?.classUtilization || 0}%`}
                  color="orange"
                  subtitle={<BenchmarkIndicator value={overview?.classUtilization || 0} benchmark={BENCHMARKS.utilization} />}
                />
                <StatCard
                  title={t('insights.leadConversion')}
                  value={`${overview?.leadConversionRate || 0}%`}
                  color="teal"
                  subtitle={<BenchmarkIndicator value={overview?.leadConversionRate || 0} benchmark={BENCHMARKS.conversion} />}
                />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-4">
            <StatCard title={t('insights.activeMembers')} value={overview?.activeMembers || 0} color="blue" />
            {canFinance && <StatCard title={t('insights.monthlyRevenue')} value={formatCurrency(overview?.totalRevenue || 0)} color="teal" />}
            {canFinance && <StatCard title={t('insights.estLtv')} value={formatCurrency(overview?.ltv || 0)} color="orange" subtitle={t('insights.lifetime')} />}
            {canFinance && <StatCard title={t('insights.rpv')} value={formatCurrency(overview?.rpv || 0)} color="blue" subtitle={t('insights.rpvSubtitle')} />}
          </div>

          {/* 30-day revenue sparkline */}
          {canFinance && (
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t('insights.revenueTrend30d')}</CardTitle>
              </CardHeader>
              <CardContent>
                {dailyLoading ? (
                  <Skeleton className="h-[120px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={120}>
                    <AreaChart data={dailyRevenue}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={4} />
                      <Tooltip formatter={(v: number) => [formatCurrency(v), t('insights.revenue')]} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} />
                      <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" fill="url(#revGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          )}

          {/* Lead funnel */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t('analytics.leadFunnel')}</CardTitle>
            </CardHeader>
            <CardContent>
              {funnelLoading ? (
                <Skeleton className="h-[180px] w-full" />
              ) : (
                <div className="space-y-2 py-2">
                  {funnelData?.map((stage, idx) => (
                    <div key={stage.key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">{stage.stage}</span>
                        <span className="text-muted-foreground">{stage.count}</span>
                      </div>
                      <div className="h-6 bg-muted rounded-md overflow-hidden">
                        <div className={cn('h-full rounded-md transition-all',
                          idx === 0 && 'bg-primary/30', idx === 1 && 'bg-primary/50',
                          idx === 2 && 'bg-primary/70', idx === 3 && 'bg-primary',
                        )} style={{ width: `${Math.max(stage.percent, 4)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== REVENUE TAB (finance-gated) ========== */}
        {canFinance && <TabsContent value="revenue">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t('analytics.revenueTrends')}</CardTitle>
              </CardHeader>
              <CardContent>
                {revLoading ? <Skeleton className="h-[250px] w-full" /> : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <Tooltip formatter={(v: number) => [formatCurrency(v), t('analytics.revenue')]} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">{t('insights.detailedReports')}</h3>
              <ReportItem title={t('reports.packageSalesTitle')} description={t('reports.packageSalesDesc')} buttonText={t('reports.viewFullReport')} onClick={() => navigate('/report/package/sales')} icon={<BarChart3 className="h-4 w-4" />} accentColor="teal" />
              <ReportItem title={t('reports.packageSalesOverTimeTitle')} description={t('reports.packageSalesOverTimeDesc')} buttonText={t('reports.viewFullReport')} onClick={() => navigate('/report/package/sales-over-time')} icon={<Calendar className="h-4 w-4" />} accentColor="primary" />
            </div>
          </div>
        </TabsContent>}

        {/* ========== MEMBERS TAB ========== */}
        <TabsContent value="members">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t('analytics.memberGrowth')}</CardTitle>
              </CardHeader>
              <CardContent>
                {growthLoading ? <Skeleton className="h-[250px] w-full" /> : (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={growthData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="newMembers" stroke="hsl(var(--primary))" strokeWidth={2} name={t('analytics.newMembers')} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="expired" stroke="hsl(var(--destructive))" strokeWidth={2} name={t('analytics.expired')} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">{t('insights.detailedReports')}</h3>
              <ReportItem title={t('reports.activeMembersTitle')} description={t('reports.activeMembersDesc')} buttonText={t('reports.viewFullReport')} onClick={() => navigate('/report/member/active-members')} icon={<Users className="h-4 w-4" />} accentColor="primary" />
              <ReportItem title={t('reports.membersAtRisk')} description={t('reports.membersAtRiskDesc')} buttonText={t('reports.viewFullReport')} onClick={() => navigate('/report/member/members-at-risk')} icon={<AlertTriangle className="h-4 w-4" />} accentColor="warning" />
              <ReportItem title={t('reports.membersPackageUsage')} description={t('reports.packageUsageDesc')} buttonText={t('reports.viewFullReport')} onClick={() => navigate('/report/member/package-usage')} icon={<Package className="h-4 w-4" />} accentColor="teal" />
            </div>
          </div>
        </TabsContent>

        {/* ========== RETENTION TAB (NEW) ========== */}
        <TabsContent value="retention">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t('insights.cohortRetention')}</CardTitle>
              <CardDescription className="text-xs">{t('insights.cohortRetentionDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {cohortLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-3 font-medium text-muted-foreground">{t('insights.cohortMonth')}</th>
                        <th className="text-right py-2 px-2 font-medium text-muted-foreground">{t('insights.joined')}</th>
                        <th className="text-right py-2 px-2 font-medium text-muted-foreground">{t('insights.month1')}</th>
                        <th className="text-right py-2 px-2 font-medium text-muted-foreground">{t('insights.month3')}</th>
                        <th className="text-right py-2 px-2 font-medium text-muted-foreground">{t('insights.month6')}</th>
                        <th className="text-right py-2 px-2 font-medium text-muted-foreground">{t('insights.month12')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cohortData?.map((row) => (
                        <tr key={row.cohortMonth} className="border-b border-border/50">
                          <td className="py-2 pr-3 font-medium">{row.cohortLabel}</td>
                          <td className="text-right py-2 px-2 text-muted-foreground">{row.totalJoined}</td>
                          <td className="text-right py-2 px-2">
                            <CohortCell value={row.m1} />
                          </td>
                          <td className="text-right py-2 px-2">
                            <CohortCell value={row.m3} />
                          </td>
                          <td className="text-right py-2 px-2">
                            <CohortCell value={row.m6} />
                          </td>
                          <td className="text-right py-2 px-2">
                            <CohortCell value={row.m12} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cohort retention area chart */}
          {!cohortLoading && cohortData && cohortData.some(r => r.m1 >= 0) && (
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t('insights.retentionRate')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={cohortData.filter(r => r.m1 >= 0)}>
                    <defs>
                      <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="cohortLabel" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} formatter={(v: number) => [`${v}%`, '']} />
                    <Area type="monotone" dataKey="m1" stroke="hsl(var(--primary))" fill="url(#retGrad)" strokeWidth={2} name="1 Month" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ========== CLASSES TAB ========== */}
        <TabsContent value="classes">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Fill rate heatmap */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t('analytics.classFillRate')}</CardTitle>
              </CardHeader>
              <CardContent>
                {fillLoading ? <Skeleton className="h-[250px] w-full" /> : (
                  <div className="overflow-x-auto">
                    <div className="min-w-[500px]">
                      <div className="flex gap-0.5 mb-0.5 pl-12">
                        {HOUR_LABELS.map((h) => (
                          <div key={h} className="flex-1 text-[10px] text-muted-foreground text-center">{h}</div>
                        ))}
                      </div>
                      {DAY_LABELS.map((day, dayIdx) => (
                        <div key={day} className="flex gap-0.5 mb-0.5">
                          <div className="w-12 text-[11px] text-muted-foreground flex items-center">{day}</div>
                          {HOUR_LABELS.map((_, hourIdx) => {
                            const cell = fillData?.find((c) => c.day === dayIdx && c.hour === hourIdx + 6);
                            const rate = cell?.fillRate || 0;
                            return (
                              <div key={hourIdx} className={cn(
                                'flex-1 aspect-square rounded-sm flex items-center justify-center text-[9px] font-medium',
                                rate === 0 && 'bg-muted text-muted-foreground/50',
                                rate > 0 && rate <= 30 && 'bg-primary/20 text-primary',
                                rate > 30 && rate <= 60 && 'bg-primary/40 text-primary-foreground',
                                rate > 60 && rate <= 80 && 'bg-primary/70 text-primary-foreground',
                                rate > 80 && 'bg-primary text-primary-foreground',
                              )} title={`${day} ${hourIdx + 6}:00 — ${rate}%`}>
                                {rate > 0 ? `${rate}` : ''}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                      <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
                        <span>{t('analytics.low')}</span>
                        <div className="flex gap-0.5">
                          <div className="w-4 h-4 rounded-sm bg-muted" />
                          <div className="w-4 h-4 rounded-sm bg-primary/20" />
                          <div className="w-4 h-4 rounded-sm bg-primary/40" />
                          <div className="w-4 h-4 rounded-sm bg-primary/70" />
                          <div className="w-4 h-4 rounded-sm bg-primary" />
                        </div>
                        <span>{t('analytics.high')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Peak hour revenue overlay */}
            {canFinance && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{t('insights.peakHourRevenue')}</CardTitle>
                  <CardDescription className="text-xs">{t('insights.peakHourDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {peakLoading ? <Skeleton className="h-[250px] w-full" /> : (
                    <div className="overflow-x-auto">
                      <div className="min-w-[500px]">
                        <div className="flex gap-0.5 mb-0.5 pl-12">
                          {HOUR_LABELS.map((h) => (
                            <div key={h} className="flex-1 text-[10px] text-muted-foreground text-center">{h}</div>
                          ))}
                        </div>
                        {DAY_LABELS.map((day, dayIdx) => (
                          <div key={day} className="flex gap-0.5 mb-0.5">
                            <div className="w-12 text-[11px] text-muted-foreground flex items-center">{day}</div>
                            {HOUR_LABELS.map((_, hourIdx) => {
                              const cell = peakData?.find((c) => c.day === dayIdx && c.hour === hourIdx + 6);
                              const rpc = cell?.revenuePerClass || 0;
                              // Color scale based on revenue per class
                              const maxRpc = Math.max(...(peakData || []).map(c => c.revenuePerClass), 1);
                              const intensity = rpc / maxRpc;
                              return (
                                <div key={hourIdx} className={cn(
                                  'flex-1 aspect-square rounded-sm flex items-center justify-center text-[8px] font-medium',
                                  intensity === 0 && 'bg-muted text-muted-foreground/50',
                                  intensity > 0 && intensity <= 0.25 && 'bg-green-200 dark:bg-green-900/40 text-green-800 dark:text-green-300',
                                  intensity > 0.25 && intensity <= 0.5 && 'bg-green-300 dark:bg-green-800/50 text-green-900 dark:text-green-200',
                                  intensity > 0.5 && intensity <= 0.75 && 'bg-green-400 dark:bg-green-700/60 text-green-950 dark:text-green-100',
                                  intensity > 0.75 && 'bg-green-500 dark:bg-green-600/70 text-white',
                                )} title={`${day} ${hourIdx + 6}:00 — ${formatCurrency(rpc)}/class`}>
                                  {rpc > 0 ? `${(rpc / 1000).toFixed(0)}k` : ''}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                        <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
                          <span>{t('analytics.low')}</span>
                          <div className="flex gap-0.5">
                            <div className="w-4 h-4 rounded-sm bg-muted" />
                            <div className="w-4 h-4 rounded-sm bg-green-200 dark:bg-green-900/40" />
                            <div className="w-4 h-4 rounded-sm bg-green-300 dark:bg-green-800/50" />
                            <div className="w-4 h-4 rounded-sm bg-green-400 dark:bg-green-700/60" />
                            <div className="w-4 h-4 rounded-sm bg-green-500 dark:bg-green-600/70" />
                          </div>
                          <span>{t('analytics.high')}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="space-y-2 lg:col-span-2">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">{t('insights.detailedReports')}</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                <ReportItem title={t('reports.classCapacityByHourTitle')} description={t('reports.classCapacityByHourDesc')} buttonText={t('reports.viewFullReport')} onClick={() => navigate('/report/class/capacity-by-hour')} icon={<Clock className="h-4 w-4" />} accentColor="teal" />
                <ReportItem title={t('reports.classCapacityTitle')} description={t('reports.classCapacityDesc')} buttonText={t('reports.viewFullReport')} onClick={() => navigate('/report/class/capacity-over-time')} icon={<TrendingUp className="h-4 w-4" />} accentColor="primary" />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ========== PACKAGES TAB ========== */}
        <TabsContent value="packages">
          <div className="space-y-2">
            <ReportItem title={t('reports.packageSalesTitle')} description={t('reports.packageSalesDesc')} buttonText={t('reports.viewFullReport')} onClick={() => navigate('/report/package/sales')} icon={<BarChart3 className="h-4 w-4" />} accentColor="teal" />
            <ReportItem title={t('reports.packageSalesOverTimeTitle')} description={t('reports.packageSalesOverTimeDesc')} buttonText={t('reports.viewFullReport')} onClick={() => navigate('/report/package/sales-over-time')} icon={<Calendar className="h-4 w-4" />} accentColor="primary" />
            <ReportItem title={t('reports.membersPackageAtRisk')} description={t('reports.packageAtRiskDesc')} buttonText={t('reports.viewFullReport')} onClick={() => navigate('/report/member/package-at-risk')} icon={<AlertTriangle className="h-4 w-4" />} accentColor="warning" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Cohort cell with color-coded retention %
const CohortCell = ({ value }: { value: number }) => {
  if (value < 0) return <span className="text-muted-foreground/50">—</span>;
  return (
    <span className={cn(
      'inline-flex items-center justify-center w-10 h-6 rounded text-[11px] font-semibold',
      value >= 80 && 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      value >= 60 && value < 80 && 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
      value >= 40 && value < 60 && 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
      value >= 20 && value < 40 && 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400',
      value < 20 && 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
    )}>
      {value}%
    </span>
  );
};

export default Insights;
