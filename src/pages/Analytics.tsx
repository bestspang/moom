import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader } from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRevenueByMonth, useMemberGrowth, useClassFillRate, useLeadFunnel } from '@/hooks/useAnalytics';
import { formatCurrency } from '@/lib/formatters';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { cn } from '@/lib/utils';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOUR_LABELS = Array.from({ length: 12 }, (_, i) => `${i + 6}:00`);

const Analytics = () => {
  const { t } = useLanguage();
  const { data: revenueData, isLoading: revLoading } = useRevenueByMonth();
  const { data: growthData, isLoading: growthLoading } = useMemberGrowth();
  const { data: fillData, isLoading: fillLoading } = useClassFillRate();
  const { data: funnelData, isLoading: funnelLoading } = useLeadFunnel();

  return (
    <div>
      <PageHeader
        title={t('analytics.title')}
        breadcrumbs={[{ label: t('nav.analytics') }, { label: t('analytics.title') }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Trends */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('analytics.revenueTrends')}</CardTitle>
          </CardHeader>
          <CardContent>
            {revLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), t('analytics.revenue')]}
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Member Growth */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('analytics.memberGrowth')}</CardTitle>
          </CardHeader>
          <CardContent>
            {growthLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="newMembers" stroke="hsl(var(--primary))" strokeWidth={2} name={t('analytics.newMembers')} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="expired" stroke="hsl(var(--destructive))" strokeWidth={2} name={t('analytics.expired')} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Class Fill Rate Heatmap */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('analytics.classFillRate')}</CardTitle>
          </CardHeader>
          <CardContent>
            {fillLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[500px]">
                  {/* Hour headers */}
                  <div className="flex gap-0.5 mb-0.5 pl-12">
                    {HOUR_LABELS.map((h) => (
                      <div key={h} className="flex-1 text-[10px] text-muted-foreground text-center">{h}</div>
                    ))}
                  </div>
                  {/* Rows by day */}
                  {DAY_LABELS.map((day, dayIdx) => (
                    <div key={day} className="flex gap-0.5 mb-0.5">
                      <div className="w-12 text-[11px] text-muted-foreground flex items-center">{day}</div>
                      {HOUR_LABELS.map((_, hourIdx) => {
                        const cell = fillData?.find((c) => c.day === dayIdx && c.hour === hourIdx + 6);
                        const rate = cell?.fillRate || 0;
                        return (
                          <div
                            key={hourIdx}
                            className={cn(
                              'flex-1 aspect-square rounded-sm flex items-center justify-center text-[9px] font-medium transition-colors',
                              rate === 0 && 'bg-muted text-muted-foreground/50',
                              rate > 0 && rate <= 30 && 'bg-primary/20 text-primary',
                              rate > 30 && rate <= 60 && 'bg-primary/40 text-primary-foreground',
                              rate > 60 && rate <= 80 && 'bg-primary/70 text-primary-foreground',
                              rate > 80 && 'bg-primary text-primary-foreground',
                            )}
                            title={`${day} ${hourIdx + 6}:00 — ${rate}%`}
                          >
                            {rate > 0 ? `${rate}` : ''}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  {/* Legend */}
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

        {/* Lead Conversion Funnel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('analytics.leadFunnel')}</CardTitle>
          </CardHeader>
          <CardContent>
            {funnelLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <div className="space-y-3 py-4">
                {funnelData?.map((stage, idx) => (
                  <div key={stage.key} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{stage.stage}</span>
                      <span className="text-muted-foreground">{stage.count}</span>
                    </div>
                    <div className="h-8 bg-muted rounded-md overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-md transition-all',
                          idx === 0 && 'bg-primary/30',
                          idx === 1 && 'bg-primary/50',
                          idx === 2 && 'bg-primary/70',
                          idx === 3 && 'bg-primary',
                        )}
                        style={{ width: `${Math.max(stage.percent, 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
