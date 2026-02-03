import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, DateRangePicker, SearchBar, StatusTabs, DataTable, StatusBadge, type Column, type StatusTab } from '@/components/common';
import { Skeleton } from '@/components/ui/skeleton';
import { useTransferSlips, useTransferSlipStats } from '@/hooks/useFinance';
import { formatCurrency } from '@/lib/formatters';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const TransferSlips = () => {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('needs_review');
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  });

  const { data: slips, isLoading } = useTransferSlips({
    startDate: dateRange.start,
    endDate: dateRange.end,
    search,
    slipStatus: activeTab,
  });
  const { data: stats } = useTransferSlipStats();

  const statusTabs: StatusTab[] = [
    { key: 'needs_review', label: t('transferSlips.needsReview'), count: stats?.needs_review || 0, color: 'red' },
    { key: 'paid', label: t('transferSlips.paid'), count: stats?.paid || 0, color: 'teal' },
    { key: 'voided', label: t('transferSlips.voided'), count: stats?.voided || 0, color: 'gray' },
  ];

  const getStatusVariant = (status: string | null) => {
    switch (status) {
      case 'paid': return 'paid';
      case 'needs_review': return 'pending';
      case 'voided': return 'voided';
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
        title={t('transferSlips.title')} 
        breadcrumbs={[{ label: t('nav.finance') }, { label: t('transferSlips.title') }]} 
      />
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <DateRangePicker 
          startDate={dateRange.start} 
          endDate={dateRange.end} 
          onChange={setDateRange} 
        />
        <SearchBar 
          placeholder={t('transferSlips.searchPlaceholder')} 
          value={search} 
          onChange={setSearch} 
          className="max-w-md" 
        />
      </div>
      
      <StatusTabs tabs={statusTabs} activeTab={activeTab} onChange={setActiveTab} />
      
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={slips || []}
          rowKey={(row) => row.id}
          emptyMessage={t('common.noData')}
        />
      )}
    </div>
  );
};

export default TransferSlips;
