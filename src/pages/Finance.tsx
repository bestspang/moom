import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, StatCard, DateRangePicker, SearchBar, DataTable, StatusBadge, StatusTabs, ManageDropdown, type Column, type StatusTab } from '@/components/common';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, getDateLocale } from '@/lib/formatters';
import { useFinanceTransactions, computeFinanceStats } from '@/hooks/useFinance';
import { useTransferSlipsList, useTransferSlipStats } from '@/hooks/useTransferSlips';
import { useRevenueForecast } from '@/hooks/useRevenueForecast';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { exportToCsv, type CsvColumn } from '@/lib/exportCsv';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ImportCenterDialog } from '@/components/import/ImportCenterDialog';
import { SlipDetailDialog } from '@/components/transfer-slips/SlipDetailDialog';

const PAGE_SIZE = 50;

const PAYMENT_COLORS: Record<string, string> = {
  cash: 'hsl(var(--primary))',
  bank_transfer: 'hsl(142 71% 45%)',
  credit_card: 'hsl(221 83% 53%)',
  promptpay: 'hsl(280 67% 52%)',
  card_stripe: 'hsl(221 83% 53%)',
  qr_promptpay_stripe: 'hsl(280 67% 52%)',
  other: 'hsl(var(--muted-foreground))',
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
  const [importOpen, setImportOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  });

  // Transfer slips state
  const [slipSearch, setSlipSearch] = useState('');
  const [slipStatusTab, setSlipStatusTab] = useState('needs_review');
  const [selectedSlipId, setSelectedSlipId] = useState<string | null>(null);
  const [slipDetailOpen, setSlipDetailOpen] = useState(false);

  // Finance transactions data
  const { data: transactions, isLoading: txLoading } = useFinanceTransactions({
    startDate: dateRange.start,
    endDate: dateRange.end,
    search,
    status: statusFilter,
    paymentMethod: paymentMethodFilter,
  });

  // Transfer slips data
  const { data: slips, isLoading: slipsLoading } = useTransferSlipsList({
    startDate: dateRange.start,
    endDate: dateRange.end,
    search: slipSearch,
    status: slipStatusTab,
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
      case 'refunded': return 'voided';
      case 'failed': return 'inactive';
      default: return 'default';
    }
  };

  const formatPaymentMethod = (method: string | null): string => {
    const map: Record<string, string> = {
      cash: 'Cash',
      bank_transfer: 'Bank Transfer',
      credit_card: 'Credit Card',
      promptpay: 'QR PromptPay',
      card_stripe: 'Stripe Card',
      qr_promptpay_stripe: 'Stripe PromptPay',
      other: 'Other',
    };
    return method ? (map[method] || method) : '-';
  };

  const handleExportCsv = () => {
    if (!transactions?.length) return;
    const csvColumns: CsvColumn<any>[] = [
      { key: 'dateTime', header: 'Date & Time', accessor: (r) => format(new Date(r.created_at), 'd MMM yyyy, HH:mm').toUpperCase() },
      { key: 'transactionId', header: 'Transaction no.', accessor: (r) => r.transaction_id },
      { key: 'orderName', header: 'Order name', accessor: (r) => r.order_name },
      { key: 'type', header: 'Type', accessor: (r) => r.type || '-' },
      { key: 'soldTo', header: 'Sold to', accessor: (r) => r.member ? `${r.member.first_name} ${r.member.last_name}` : '-' },
      { key: 'registerLocation', header: 'Register location', accessor: (r) => r.location?.name || '-' },
      { key: 'priceExclVat', header: 'Price excluding vat', accessor: (r) => (Number(r.amount) / 1.07).toFixed(2) },
      { key: 'vat', header: 'VAT @7%', accessor: (r) => (Number(r.amount) - Number(r.amount) / 1.07).toFixed(2) },
      { key: 'priceInclVat', header: 'Price including vat', accessor: (r) => Number(r.amount).toFixed(2) },
      { key: 'soldAt', header: 'Sold at', accessor: (r) => r.location?.name || '-' },
      { key: 'paymentMethod', header: 'Payment method', accessor: (r) => formatPaymentMethod(r.payment_method) },
      { key: 'taxInvoice', header: 'Tax invoice no.', accessor: (r) => r.tax_invoice_url || '-' },
      { key: 'status', header: 'Status', accessor: (r) => r.status || '-' },
      { key: 'staff', header: 'Staff', accessor: (r) => r.staff ? `${r.staff.first_name} ${r.staff.last_name}` : '-' },
    ];
    const date = new Date().toISOString().split('T')[0];
    exportToCsv(transactions, csvColumns, `finance-export-${date}`);
    toast.success(t('common.export'));
  };

  const handleExportSlips = () => {
    if (!slips?.length) return;
    const csvColumns: CsvColumn<any>[] = [
      { key: 'dateTime', header: 'Date', accessor: (r) => r.slip_datetime ? format(new Date(r.slip_datetime), 'yyyy-MM-dd HH:mm') : '' },
      { key: 'transactionId', header: 'Transaction ID', accessor: (r) => r.linked_transaction ? (r.linked_transaction as any).transaction_id : '' },
      { key: 'packageName', header: 'Package', accessor: (r) => r.package?.name_en || '' },
      { key: 'soldTo', header: 'Sold To', accessor: (r) => r.member ? `${r.member.first_name} ${r.member.last_name}` : r.member_name_text || '' },
      { key: 'amount', header: 'Amount', accessor: (r) => r.amount_thb },
      { key: 'status', header: 'Status', accessor: (r) => r.status || '' },
    ];
    const date = new Date().toISOString().split('T')[0];
    exportToCsv(slips, csvColumns, `transfer-slips-${date}`);
    toast.success(t('common.export'));
  };

  const handleDownloadTxTemplate = () => {
    const headers = ['Date & Time', 'Transaction no.', 'Order name', 'Type', 'Sold to', 'Register location', 'Price excluding vat', 'VAT @7%', 'Price including vat', 'Sold at', 'Payment method', 'Tax invoice no.', 'Status', 'Staff'];
    const csv = headers.join(',');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'transactions-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloadTemplate'));
  };

  const handleDownloadSlipTemplate = () => {
    const headers = ['transaction_id', 'order_name', 'amount', 'status'];
    const csv = headers.join(',');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'transfer-slips-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloadTemplate'));
  };

  const formatSourceType = (source: string | null): string => {
    const map: Record<string, string> = {
      stripe: 'Stripe',
      transfer_slip: 'Transfer',
      cash: 'Cash',
      bank_transfer: 'Bank Transfer',
      manual: 'Manual',
    };
    return source ? (map[source] || source) : 'Manual';
  };

  const txColumns: Column<any>[] = [
    { 
      key: 'dateTime', 
      header: t('finance.dateTime'), 
      cell: (row) => format(new Date(row.paid_at || row.created_at), 'd MMM yyyy HH:mm', { locale: getDateLocale(language) })
    },
    { key: 'transactionId', header: t('finance.transactionNo'), cell: (row) => row.transaction_id },
    { key: 'orderName', header: t('finance.orderName'), cell: (row) => row.order_name },
    {
      key: 'source',
      header: 'Source',
      cell: (row) => (
        <StatusBadge variant={row.source_type === 'stripe' ? 'active' : 'default'}>
          {formatSourceType(row.source_type)}
        </StatusBadge>
      )
    },
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
      cell: (row) => row.sold_to_name || (row.member ? `${row.member.first_name} ${row.member.last_name}` : '-')
    },
    {
      key: 'location',
      header: t('finance.location'),
      cell: (row) => row.location?.name || '-',
    },
    { 
      key: 'amount', 
      header: t('finance.amount'), 
      cell: (row) => {
        const gross = Number(row.amount);
        const vat = row.amount_vat != null ? Number(row.amount_vat) : null;
        return (
          <div className="text-right">
            <span className="font-medium">{formatCurrency(gross)}</span>
            {vat != null && (
              <span className="block text-[10px] text-muted-foreground">VAT {formatCurrency(vat)}</span>
            )}
          </div>
        );
      }
    },
    {
      key: 'paymentMethod',
      header: t('finance.paymentMethod'),
      cell: (row) => formatPaymentMethod(row.payment_method),
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
          failed: 'Failed',
          refunded: 'Refunded',
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
      cell: (row) => row.slip_datetime ? format(new Date(row.slip_datetime), 'd MMM yyyy HH:mm', { locale: getDateLocale(language) }) : '-'
    },
    { key: 'transactionId', header: t('finance.transactionNo'), cell: (row) => row.linked_transaction ? (row.linked_transaction as any).transaction_id : '-' },
    { 
      key: 'packageName', 
      header: t('transferSlips.packageName'), 
      cell: (row) => row.package ? (language === 'th' && row.package.name_th ? row.package.name_th : row.package.name_en) : '-'
    },
    { 
      key: 'packageType', 
      header: t('transferSlips.packageType'), 
      cell: (row) => row.package?.type ? (
        <StatusBadge variant="default">
          {row.package.type}
        </StatusBadge>
      ) : '-'
    },
    { 
      key: 'soldTo', 
      header: t('transferSlips.soldTo'), 
      cell: (row) => row.member ? `${row.member.first_name} ${row.member.last_name}` : row.member_name_text || '-'
    },
    { 
      key: 'amount', 
      header: t('finance.amount'), 
      cell: (row) => formatCurrency(Number(row.amount_thb))
    },
    { 
      key: 'status', 
      header: t('common.status'), 
      cell: (row) => {
        const statusLabels: Record<string, string> = {
          approved: t('transferSlips.paid'),
          needs_review: t('transferSlips.needsReview'),
          rejected: t('transferSlips.rejected'),
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
    { key: 'approved', label: t('transferSlips.paid'), count: slipStats?.approved || 0, color: 'teal' },
    { key: 'voided', label: t('transferSlips.voided'), count: slipStats?.voided || 0, color: 'gray' },
  ];

  const methodLabel = (method: string) => {
    const map: Record<string, string> = {
      cash: t('finance.cash'),
      bank_transfer: t('finance.bankTransfer'),
      credit_card: t('finance.creditCard'),
      promptpay: t('finance.promptpay'),
      card_stripe: 'Stripe Card',
      qr_promptpay_stripe: 'Stripe PromptPay',
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
            <ManageDropdown
              onExport={handleExportCsv}
              onDownloadTemplate={handleDownloadTxTemplate}
              onImport={() => setImportOpen(true)}
              exportDisabled={!transactions?.length}
            />
          ) : activeMainTab === 'slips' ? (
            <ManageDropdown
              onExport={handleExportSlips}
              onDownloadTemplate={handleDownloadSlipTemplate}
              onImport={() => setImportOpen(true)}
              exportDisabled={!slips?.length}
            />
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
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
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
                <SelectItem value="card_stripe">Stripe Card</SelectItem>
                <SelectItem value="qr_promptpay_stripe">Stripe PromptPay</SelectItem>
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
              onRowClick={(row) => { setSelectedSlipId(row.id); setSlipDetailOpen(true); }}
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

      <ImportCenterDialog open={importOpen} onOpenChange={setImportOpen} presetEntity={activeMainTab === 'slips' ? 'slips' : 'finance'} />
      <SlipDetailDialog slipId={selectedSlipId} open={slipDetailOpen} onOpenChange={setSlipDetailOpen} />
    </div>
  );
};

export default Finance;
