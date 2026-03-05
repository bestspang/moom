import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, StatCard, DateRangePicker, SearchBar, DataTable, StatusBadge, StatusTabs, type Column, type StatusTab } from '@/components/common';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, getDateLocale } from '@/lib/formatters';
import { useFinanceTransactions, computeFinanceStats, useTransferSlips, useTransferSlipStats } from '@/hooks/useFinance';
import { useRevenueForecast } from '@/hooks/useRevenueForecast';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download } from 'lucide-react';
import { exportToCsv, type CsvColumn } from '@/lib/exportCsv';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const PAGE_SIZE = 50;

const PAYMENT_COLORS: Record<string, string> = {
  cash: 'hsl(var(--primary))',
  bank_transfer: 'hsl(142 71% 45%)',
  credit_card: 'hsl(221 83% 53%)',
  promptpay: 'hsl(280 67% 52%)',
};

const Finance = () => {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';

  const [activeMainTab, setActiveMainTab] = useState(initialTab);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  });

  // Transfer slips state
  const [slipSearch, setSlipSearch] = useState('');
  const [slipStatusTab, setSlipStatusTab] = useState('needs_review');

  // Finance transactions data
  const { data: transactions, isLoading: txLoading } = useFinanceTransactions({
    startDate: dateRange.start,
    endDate: dateRange.end,
    search,
    status: statusFilter,
    paymentMethod: paymentMethodFilter,
  });

  // Transfer slips data
  const { data: slips, isLoading: slipsLoading } = useTransferSlips({
    startDate: dateRange.start,
    endDate: dateRange.end,
    search: slipSearch,
    slipStatus: slipStatusTab,
  });
  const { data: slipStats } = useTransferSlipStats();

  // Revenue forecast
  const { data: forecast, isLoading: forecastLoading } = useRevenueForecast();

  const stats = useMemo(() => computeFinanceStats(transactions), [transactions]);

  // Client-side pagination for transactions
  const paginatedData = useMemo(() => {
    if (!transactions) return [];
    const start = (page - 1) * PAGE_SIZE;
    return transactions.slice(start, start + PAGE_SIZE);
  }, [transactions, page]);

  // Overview charts data
  const dailyRevenueData = useMemo(() => {
    if (!transactions) return [];
    const dayMap = new Map<string, number>();
    transactions.forEach((tx) => {
      if (tx.status !== 'paid') return;
      const day = format(new Date(tx.created_at), 'MM/dd');
      dayMap.set(day, (dayMap.get(day) || 0) + Number(tx.amount));
    });
    return Array.from(dayMap.entries())
      .map(([day, amount]) => ({ day, amount }))
      .sort((a, b) => a.day.localeCompare(b.day));
  }, [transactions]);

  const paymentBreakdown = useMemo(() => {
    if (!transactions) return [];
    const methodMap = new Map<string, number>();
    transactions.forEach((tx) => {
      if (tx.status !== 'paid') return;
      const method = tx.payment_method || 'other';
      methodMap.set(method, (methodMap.get(method) || 0) + Number(tx.amount));
    });
    return Array.from(methodMap.entries()).map(([method, amount]) => ({
      name: method,
      value: amount,
      color: PAYMENT_COLORS[method] || 'hsl(var(--muted-foreground))',
    }));
  }, [transactions]);

  const forecastChartData = useMemo(() => {
    if (!forecast) return [];
    return [
      { label: t('revenueForecast.lastMonth'), amount: forecast.lastMonth },
      { label: t('revenueForecast.thisMonth'), amount: forecast.thisMonth },
      { label: t('revenueForecast.nextMonth'), amount: forecast.projectedNextMonth },
    ];
  }, [forecast, t]);

  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const getStatusVariant = (status: string | null) => {
    switch (status) {
      case 'paid': return 'paid';
      case 'pending': return 'pending';
      case 'voided': return 'voided';
      case 'needs_review': return 'pending';
      default: return 'default';
    }
  };

  const handleExportCsv = () => {
    if (!transactions?.length) return;
    const csvColumns: CsvColumn<any>[] = [
      { key: 'dateTime', header: t('finance.dateTime'), accessor: (r) => format(new Date(r.created_at), 'yyyy-MM-dd HH:mm') },
      { key: 'transactionId', header: t('finance.transactionNo'), accessor: (r) => r.transaction_id },
      { key: 'orderName', header: t('finance.orderName'), accessor: (r) => r.order_name },
      { key: 'type', header: t('packages.type'), accessor: (r) => r.type || '' },
      { key: 'soldTo', header: t('finance.soldTo'), accessor: (r) => r.member ? `${r.member.first_name} ${r.member.last_name}` : '' },
      { key: 'location', header: t('finance.location'), accessor: (r) => r.location?.name || '' },
      { key: 'amount', header: t('finance.amount'), accessor: (r) => r.amount },
      { key: 'paymentMethod', header: t('finance.paymentMethod'), accessor: (r) => r.payment_method || '' },
      { key: 'status', header: t('common.status'), accessor: (r) => r.status || '' },
    ];
    const date = new Date().toISOString().split('T')[0];
    exportToCsv(transactions, csvColumns, `finance-export-${date}`);
  };

  const txColumns: Column<any>[] = [
    { 
      key: 'dateTime', 
      header: t('finance.dateTime'), 
      cell: (row) => format(new Date(row.created_at), 'd MMM yyyy HH:mm', { locale: getDateLocale(language) })
    },
    { key: 'transactionId', header: t('finance.transactionNo'), cell: (row) => row.transaction_id },
    { key: 'orderName', header: t('finance.orderName'), cell: (row) => row.order_name },
    { 
      key: 'type', 
      header: t('packages.type'), 
      cell: (row) => (
        <StatusBadge variant="default">
          {row.type || '-'}
        </StatusBadge>
      )
    },
    { 
      key: 'soldTo', 
      header: t('finance.soldTo'), 
      cell: (row) => row.member ? `${row.member.first_name} ${row.member.last_name}` : '-'
    },
    {
      key: 'location',
      header: t('finance.location'),
      cell: (row) => row.location?.name || '-',
    },
    { 
      key: 'amount', 
      header: t('finance.amount'), 
      cell: (row) => formatCurrency(Number(row.amount))
    },
    { 
      key: 'status', 
      header: t('common.status'), 
      cell: (row) => {
        const statusLabels: Record<string, string> = {
          paid: t('transferSlips.paid'),
          pending: t('common.pending'),
          needs_review: t('transferSlips.needsReview'),
          voided: t('transferSlips.voided'),
        };
        return (
          <StatusBadge variant={getStatusVariant(row.status) as any}>
            {statusLabels[row.status] || row.status || '-'}
          </StatusBadge>
        );
      }
    },
  ];

  const slipColumns: Column<any>[] = [
    { 
      key: 'dateTime', 
      header: t('finance.dateTime'), 
      cell: (row) => format(new Date(row.created_at), 'd MMM yyyy HH:mm', { locale: getDateLocale(language) })
    },
    { key: 'transactionId', header: t('finance.transactionNo'), cell: (row) => row.transaction_id },
    { 
      key: 'packageName', 
      header: t('transferSlips.packageName'), 
      cell: (row) => row.package ? (language === 'th' && row.package.name_th ? row.package.name_th : row.package.name_en) : row.order_name
    },
    { 
      key: 'packageType', 
      header: t('transferSlips.packageType'), 
      cell: (row) => (
        <StatusBadge variant="default">
          {row.package?.type || row.type || '-'}
        </StatusBadge>
      )
    },
    { 
      key: 'soldTo', 
      header: t('transferSlips.soldTo'), 
      cell: (row) => row.member ? `${row.member.first_name} ${row.member.last_name}` : '-'
    },
    { 
      key: 'amount', 
      header: t('finance.amount'), 
      cell: (row) => formatCurrency(Number(row.amount))
    },
    { 
      key: 'status', 
      header: t('common.status'), 
      cell: (row) => {
        const statusLabels: Record<string, string> = {
          paid: t('transferSlips.paid'),
          needs_review: t('transferSlips.needsReview'),
          voided: t('transferSlips.voided'),
        };
        return (
          <StatusBadge variant={getStatusVariant(row.status) as any}>
            {statusLabels[row.status] || row.status || '-'}
          </StatusBadge>
        );
      }
    },
  ];

  const slipStatusTabs: StatusTab[] = [
    { key: 'needs_review', label: t('transferSlips.needsReview'), count: slipStats?.needs_review || 0, color: 'red' },
    { key: 'paid', label: t('transferSlips.paid'), count: slipStats?.paid || 0, color: 'teal' },
    { key: 'voided', label: t('transferSlips.voided'), count: slipStats?.voided || 0, color: 'gray' },
  ];

  const methodLabel = (method: string) => {
    const map: Record<string, string> = {
      cash: t('finance.cash'),
      bank_transfer: t('finance.bankTransfer'),
      credit_card: t('finance.creditCard'),
      promptpay: t('finance.promptpay'),
    };
    return map[method] || method;
  };

  return (
    <div>
      <PageHeader 
        title={t('finance.title')} 
        breadcrumbs={[{ label: t('nav.finance') }, { label: t('finance.title') }]}
        actions={
          activeMainTab === 'transactions' ? (
            <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={!transactions?.length}>
              <Download className="h-4 w-4 mr-1.5" />
              {t('finance.export')}
            </Button>
          ) : undefined
        }
      />

      <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="overview">{t('finance.overview')}</TabsTrigger>
          <TabsTrigger value="transactions">{t('finance.transactions')}</TabsTrigger>
          <TabsTrigger value="slips">
            {t('nav.transferSlips')}
            {(slipStats?.needs_review || 0) > 0 && (
              <span className="ml-1.5 bg-destructive text-destructive-foreground text-[10px] rounded-full px-1.5 py-0.5 leading-none">
                {slipStats?.needs_review}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="forecasting">{t('finance.forecasting')}</TabsTrigger>
        </TabsList>

        {/* ===== Overview Tab ===== */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard title={t('finance.transactions')} value={stats.transactions} color="blue" />
            <StatCard title={t('finance.totalSales')} value={formatCurrency(stats.totalSales)} color="magenta" />
            <StatCard title={t('finance.netIncome')} value={formatCurrency(stats.netIncome)} color="orange" />
            <StatCard title={t('finance.refundsGiven')} value={formatCurrency(stats.refunds)} color="gray" />
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <DateRangePicker startDate={dateRange.start} endDate={dateRange.end} onChange={setDateRange} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Daily Revenue */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{t('finance.dailyRevenue')}</CardTitle>
              </CardHeader>
              <CardContent>
                {txLoading ? (
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

            {/* Payment Method Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{t('finance.paymentBreakdown')}</CardTitle>
              </CardHeader>
              <CardContent>
                {txLoading ? (
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
        </TabsContent>

        {/* ===== Transactions Tab ===== */}
        <TabsContent value="transactions" className="mt-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <DateRangePicker startDate={dateRange.start} endDate={dateRange.end} onChange={setDateRange} />
            <SearchBar 
              placeholder={t('finance.searchPlaceholder')} 
              value={search} 
              onChange={(v) => { setSearch(v); setPage(1); }} 
              className="max-w-md" 
            />
            <Select value={statusFilter} onValueChange={handleFilterChange(setStatusFilter)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t('finance.allStatuses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('finance.allStatuses')}</SelectItem>
                <SelectItem value="paid">{t('transferSlips.paid')}</SelectItem>
                <SelectItem value="pending">{t('common.pending')}</SelectItem>
                <SelectItem value="needs_review">{t('transferSlips.needsReview')}</SelectItem>
                <SelectItem value="voided">{t('transferSlips.voided')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentMethodFilter} onValueChange={handleFilterChange(setPaymentMethodFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('finance.allPaymentMethods')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('finance.allPaymentMethods')}</SelectItem>
                <SelectItem value="cash">{t('finance.cash')}</SelectItem>
                <SelectItem value="bank_transfer">{t('finance.bankTransfer')}</SelectItem>
                <SelectItem value="credit_card">{t('finance.creditCard')}</SelectItem>
                <SelectItem value="promptpay">{t('finance.promptpay')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {txLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <DataTable
              columns={txColumns}
              data={paginatedData}
              rowKey={(row) => row.id}
              emptyMessage={t('finance.noTransactions')}
              emptyVariant="finance"
              pagination={{ page, perPage: PAGE_SIZE, total: transactions?.length || 0 }}
              onPageChange={setPage}
            />
          )}
        </TabsContent>

        {/* ===== Transfer Slips Tab ===== */}
        <TabsContent value="slips" className="mt-4">
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <DateRangePicker startDate={dateRange.start} endDate={dateRange.end} onChange={setDateRange} />
            <SearchBar 
              placeholder={t('transferSlips.searchPlaceholder')} 
              value={slipSearch} 
              onChange={setSlipSearch} 
              className="max-w-md" 
            />
          </div>

          <StatusTabs tabs={slipStatusTabs} activeTab={slipStatusTab} onChange={setSlipStatusTab} />

          {slipsLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <DataTable
              columns={slipColumns}
              data={slips || []}
              rowKey={(row) => row.id}
              emptyMessage={t('transferSlips.noSlips')}
            />
          )}
        </TabsContent>

        {/* ===== Forecasting Tab ===== */}
        <TabsContent value="forecasting" className="mt-4 space-y-4">
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
              {forecastLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={forecastChartData}>
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Finance;
