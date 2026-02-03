import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, StatCard, DateRangePicker, SearchBar, DataTable, StatusBadge, type Column } from '@/components/common';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/formatters';
import { useFinanceTransactions, useFinanceStats } from '@/hooks/useFinance';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const Finance = () => {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  });

  const { data: transactions, isLoading } = useFinanceTransactions({
    startDate: dateRange.start,
    endDate: dateRange.end,
    search,
  });
  const { data: stats } = useFinanceStats(dateRange.start, dateRange.end);

  const getStatusVariant = (status: string | null) => {
    switch (status) {
      case 'paid': return 'paid';
      case 'pending': return 'pending';
      case 'voided': return 'voided';
      case 'needs_review': return 'pending';
      default: return 'default';
    }
  };

  const columns: Column<any>[] = [
    { 
      key: 'dateTime', 
      header: t('finance.dateTime'), 
      cell: (row) => format(new Date(row.created_at), 'd MMM yyyy HH:mm')
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
      key: 'amount', 
      header: t('finance.amount'), 
      cell: (row) => formatCurrency(Number(row.amount))
    },
    { 
      key: 'status', 
      header: t('common.status'), 
      cell: (row) => (
        <StatusBadge variant={getStatusVariant(row.status) as any}>
          {row.status?.replace('_', ' ') || '-'}
        </StatusBadge>
      )
    },
  ];

  return (
    <div>
      <PageHeader 
        title={t('finance.title')} 
        breadcrumbs={[{ label: t('nav.finance') }, { label: t('finance.title') }]} 
      />
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <DateRangePicker 
          startDate={dateRange.start} 
          endDate={dateRange.end} 
          onChange={setDateRange} 
        />
        <SearchBar 
          placeholder={t('finance.searchPlaceholder')} 
          value={search} 
          onChange={setSearch} 
          className="max-w-md" 
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title={t('finance.transactions')} 
          value={stats?.transactions || 0} 
          color="blue" 
        />
        <StatCard 
          title={t('finance.totalSales')} 
          value={formatCurrency(stats?.totalSales || 0)} 
          color="magenta" 
        />
        <StatCard 
          title={t('finance.netIncome')} 
          value={formatCurrency(stats?.netIncome || 0)} 
          color="orange" 
        />
        <StatCard 
          title={t('finance.refundsGiven')} 
          value={formatCurrency(stats?.refunds || 0)} 
          color="gray" 
        />
      </div>
      
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={transactions || []}
          rowKey={(row) => row.id}
          emptyMessage={t('common.noData')}
        />
      )}
    </div>
  );
};

export default Finance;
