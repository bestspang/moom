import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, StatCard, DateRangePicker, SearchBar, DataTable, StatusBadge, type Column } from '@/components/common';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, getDateLocale } from '@/lib/formatters';
import { useFinanceTransactions, computeFinanceStats } from '@/hooks/useFinance';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { exportToCsv, type CsvColumn } from '@/lib/exportCsv';

const PAGE_SIZE = 50;

const Finance = () => {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  });

  const { data: transactions, isLoading } = useFinanceTransactions({
    startDate: dateRange.start,
    endDate: dateRange.end,
    search,
    status: statusFilter,
    paymentMethod: paymentMethodFilter,
  });

  // Stats computed from the same filtered data — guarantees KPI/table consistency
  const stats = useMemo(() => computeFinanceStats(transactions), [transactions]);

  // Client-side pagination
  const paginatedData = useMemo(() => {
    if (!transactions) return [];
    const start = (page - 1) * PAGE_SIZE;
    return transactions.slice(start, start + PAGE_SIZE);
  }, [transactions, page]);

  // Reset page on filter change
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

  const columns: Column<any>[] = [
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

  return (
    <div>
      <PageHeader 
        title={t('finance.title')} 
        breadcrumbs={[{ label: t('nav.finance') }, { label: t('finance.title') }]}
        actions={
          <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={!transactions?.length}>
            <Download className="h-4 w-4 mr-1.5" />
            {t('finance.export')}
          </Button>
        }
      />
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <DateRangePicker 
          startDate={dateRange.start} 
          endDate={dateRange.end} 
          onChange={setDateRange} 
        />
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
      
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard 
          title={t('finance.transactions')} 
          value={stats.transactions} 
          color="blue" 
        />
        <StatCard 
          title={t('finance.totalSales')} 
          value={formatCurrency(stats.totalSales)} 
          color="magenta" 
        />
        <StatCard 
          title={t('finance.netIncome')} 
          value={formatCurrency(stats.netIncome)} 
          color="orange" 
        />
        <StatCard 
          title={t('finance.refundsGiven')} 
          value={formatCurrency(stats.refunds)} 
          color="gray" 
        />
      </div>
      
      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={paginatedData}
          rowKey={(row) => row.id}
          emptyMessage={t('finance.noTransactions')}
          emptyVariant="finance"
          pagination={{
            page,
            perPage: PAGE_SIZE,
            total: transactions?.length || 0,
          }}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default Finance;
