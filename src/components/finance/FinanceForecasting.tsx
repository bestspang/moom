import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { StatCard } from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FinanceForecastingProps {
  forecast: { lastMonth: number; thisMonth: number; projectedNextMonth: number } | undefined;
  isLoading: boolean;
}

export const FinanceForecasting = ({ forecast, isLoading }: FinanceForecastingProps) => {
  const { t } = useLanguage();

  const chartData = React.useMemo(() => {
    if (!forecast) return [];
    return [
      { label: t('revenueForecast.lastMonth'), amount: forecast.lastMonth },
      { label: t('revenueForecast.thisMonth'), amount: forecast.thisMonth },
      { label: t('revenueForecast.nextMonth'), amount: forecast.projectedNextMonth },
    ];
  }, [forecast, t]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard title={t('revenueForecast.lastMonth')} value={formatCurrency(forecast?.lastMonth || 0)} color="gray" />
        <StatCard title={t('revenueForecast.thisMonth')} value={formatCurrency(forecast?.thisMonth || 0)} color="blue" />
        <StatCard title={`${t('revenueForecast.nextMonth')} (${t('revenueForecast.projected')})`} value={formatCurrency(forecast?.projectedNextMonth || 0)} color="magenta" />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{t('finance.revenueComparison')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), t('finance.amount')]}
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
