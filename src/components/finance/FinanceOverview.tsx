import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { StatCard, DateRangePicker } from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface FinanceOverviewProps {
  stats: { transactions: number; totalSales: number; netIncome: number; refunds: number };
  dailyRevenueData: { day: string; amount: number }[];
  paymentBreakdown: { name: string; value: number; color: string }[];
  isLoading: boolean;
  dateRange: { start?: Date; end?: Date };
  onDateRangeChange: (range: { start?: Date; end?: Date }) => void;
  methodLabel: (method: string) => string;
}

export const FinanceOverview = ({
  stats,
  dailyRevenueData,
  paymentBreakdown,
  isLoading,
  dateRange,
  onDateRangeChange,
  methodLabel,
}: FinanceOverviewProps) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title={t('finance.transactions')} value={stats.transactions} color="blue" />
        <StatCard title={t('finance.totalSales')} value={formatCurrency(stats.totalSales)} color="magenta" />
        <StatCard title={t('finance.netIncome')} value={formatCurrency(stats.netIncome)} color="orange" />
        <StatCard title={t('finance.refundsGiven')} value={formatCurrency(stats.refunds)} color="gray" />
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <DateRangePicker startDate={dateRange.start} endDate={dateRange.end} onChange={onDateRangeChange} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('finance.dailyRevenue')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : dailyRevenueData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">{t('finance.noTransactions')}</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dailyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('finance.paymentBreakdown')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : paymentBreakdown.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">{t('finance.noTransactions')}</div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={220}>
                  <PieChart>
                    <Pie data={paymentBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                      {paymentBreakdown.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [formatCurrency(value), methodLabel(name)]}
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {paymentBreakdown.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span>{methodLabel(entry.name)}</span>
                      <span className="text-muted-foreground ml-auto">{formatCurrency(entry.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
