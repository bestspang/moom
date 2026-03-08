import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, ManageDropdown } from '@/components/common';
import { useFinanceTransactions, computeFinanceStats } from '@/hooks/useFinance';
import { useExpenses, useCreateExpense, useDeleteExpense, computePnL } from '@/hooks/useExpenses';
import { useTransferSlipsList, useTransferSlipStats } from '@/hooks/useTransferSlips';
import { useRevenueForecast } from '@/hooks/useRevenueForecast';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { exportToCsv, type CsvColumn } from '@/lib/exportCsv';
import { toast } from 'sonner';
import { ImportCenterDialog } from '@/components/import/ImportCenterDialog';
import { SlipDetailDialog } from '@/components/transfer-slips/SlipDetailDialog';
import {
  FinanceOverview,
  FinanceTransactions,
  FinanceTransferSlips,
  FinanceForecasting,
  FinancePnL,
} from '@/components/finance';

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
  const [searchParams] = useSearchParams();
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

  // Data hooks
  const { data: transactions, isLoading: txLoading } = useFinanceTransactions({
    startDate: dateRange.start, endDate: dateRange.end, search, status: statusFilter, paymentMethod: paymentMethodFilter,
  });
  const { data: slips, isLoading: slipsLoading } = useTransferSlipsList({
    startDate: dateRange.start, endDate: dateRange.end, search: slipSearch, status: slipStatusTab,
  });
  const { data: slipStats } = useTransferSlipStats();
  const { data: forecast, isLoading: forecastLoading } = useRevenueForecast();
  const { data: expenses, isLoading: expensesLoading } = useExpenses({ startDate: dateRange.start, endDate: dateRange.end });
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();

  const stats = useMemo(() => computeFinanceStats(transactions), [transactions]);
  const pnl = useMemo(() => computePnL(transactions, expenses), [transactions, expenses]);

  // Overview chart data
  const dailyRevenueData = useMemo(() => {
    if (!transactions) return [];
    const dayMap = new Map<string, number>();
    transactions.forEach((tx) => {
      if (tx.status !== 'paid') return;
      const day = format(new Date(tx.created_at), 'MM/dd');
      dayMap.set(day, (dayMap.get(day) || 0) + Number(tx.amount));
    });
    return Array.from(dayMap.entries()).map(([day, amount]) => ({ day, amount })).sort((a, b) => a.day.localeCompare(b.day));
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
      name: method, value: amount, color: PAYMENT_COLORS[method] || 'hsl(var(--muted-foreground))',
    }));
  }, [transactions]);

  const methodLabel = (method: string) => {
    const map: Record<string, string> = {
      cash: t('finance.cash'), bank_transfer: t('finance.bankTransfer'), credit_card: t('finance.creditCard'),
      promptpay: t('finance.promptpay'), card_stripe: 'Stripe Card', qr_promptpay_stripe: 'Stripe PromptPay',
    };
    return map[method] || method;
  };

  const formatPaymentMethod = (method: string | null): string => {
    const map: Record<string, string> = {
      cash: t('finance.cash'), bank_transfer: t('finance.bankTransfer'), credit_card: t('finance.creditCard'),
      promptpay: t('finance.promptpay'), card_stripe: t('finance.stripeCard'), qr_promptpay_stripe: t('finance.stripePromptpay'), other: t('finance.other'),
    };
    return method ? (map[method] || method) : '-';
  };

  // Export handlers
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
    exportToCsv(transactions, csvColumns, `finance-export-${new Date().toISOString().split('T')[0]}`);
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
    exportToCsv(slips, csvColumns, `transfer-slips-${new Date().toISOString().split('T')[0]}`);
    toast.success(t('common.export'));
  };

  const downloadTemplate = (headers: string[], filename: string) => {
    const csv = headers.join(',');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloadTemplate'));
  };

  return (
    <div>
      <PageHeader
        title={t('finance.title')}
        breadcrumbs={[{ label: t('finance.title') }]}
        actions={
          activeMainTab === 'transactions' ? (
            <ManageDropdown
              onExport={handleExportCsv}
              onDownloadTemplate={() => downloadTemplate(
                ['Date & Time', 'Transaction no.', 'Order name', 'Type', 'Sold to', 'Register location', 'Price excluding vat', 'VAT @7%', 'Price including vat', 'Sold at', 'Payment method', 'Tax invoice no.', 'Status', 'Staff'],
                'transactions-template.csv'
              )}
              onImport={() => setImportOpen(true)}
              exportDisabled={!transactions?.length}
            />
          ) : activeMainTab === 'slips' ? (
            <ManageDropdown
              onExport={handleExportSlips}
              onDownloadTemplate={() => downloadTemplate(['transaction_id', 'order_name', 'amount', 'status'], 'transfer-slips-template.csv')}
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
          <TabsTrigger value="pnl">{t('finance.pnl')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <FinanceOverview
            stats={stats}
            dailyRevenueData={dailyRevenueData}
            paymentBreakdown={paymentBreakdown}
            isLoading={txLoading}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            methodLabel={methodLabel}
          />
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <FinanceTransactions
            transactions={transactions}
            isLoading={txLoading}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={(v) => { setStatusFilter(v); setPage(1); }}
            paymentMethodFilter={paymentMethodFilter}
            onPaymentMethodFilterChange={(v) => { setPaymentMethodFilter(v); setPage(1); }}
            page={page}
            onPageChange={setPage}
          />
        </TabsContent>

        <TabsContent value="slips" className="mt-4">
          <FinanceTransferSlips
            slips={slips}
            slipStats={slipStats}
            isLoading={slipsLoading}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            search={slipSearch}
            onSearchChange={setSlipSearch}
            statusTab={slipStatusTab}
            onStatusTabChange={setSlipStatusTab}
            onSlipClick={(id) => { setSelectedSlipId(id); setSlipDetailOpen(true); }}
          />
        </TabsContent>

        <TabsContent value="forecasting" className="mt-4">
          <FinanceForecasting forecast={forecast} isLoading={forecastLoading} />
        </TabsContent>

        <TabsContent value="pnl" className="mt-4">
          <FinancePnL
            pnl={pnl}
            expenses={expenses}
            expensesLoading={expensesLoading}
            onCreateExpense={(data, opts) => createExpense.mutate(data, opts)}
            isCreating={createExpense.isPending}
            onDeleteExpense={(id) => deleteExpense.mutate(id)}
          />
        </TabsContent>
      </Tabs>

      <ImportCenterDialog open={importOpen} onOpenChange={setImportOpen} presetEntity={activeMainTab === 'slips' ? 'slips' : 'finance'} />
      <SlipDetailDialog slipId={selectedSlipId} open={slipDetailOpen} onOpenChange={setSlipDetailOpen} />
    </div>
  );
};

export default Finance;
