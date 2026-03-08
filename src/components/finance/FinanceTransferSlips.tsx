import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DateRangePicker, SearchBar, DataTable, StatusBadge, StatusTabs, type Column, type StatusTab } from '@/components/common';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, getDateLocale } from '@/lib/formatters';
import { format } from 'date-fns';

interface FinanceTransferSlipsProps {
  slips: any[] | undefined;
  slipStats: { needs_review: number; approved: number; voided: number } | undefined;
  isLoading: boolean;
  dateRange: { start?: Date; end?: Date };
  onDateRangeChange: (range: { start?: Date; end?: Date }) => void;
  search: string;
  onSearchChange: (v: string) => void;
  statusTab: string;
  onStatusTabChange: (v: string) => void;
  onSlipClick: (slipId: string) => void;
}

export const FinanceTransferSlips = ({
  slips,
  slipStats,
  isLoading,
  dateRange,
  onDateRangeChange,
  search,
  onSearchChange,
  statusTab,
  onStatusTabChange,
  onSlipClick,
}: FinanceTransferSlipsProps) => {
  const { t, language } = useLanguage();

  const getStatusVariant = (status: string | null) => {
    switch (status) {
      case 'approved': return 'paid';
      case 'needs_review': return 'pending';
      case 'rejected': return 'voided';
      case 'voided': return 'voided';
      default: return 'default';
    }
  };

  const slipColumns: Column<any>[] = [
    {
      key: 'dateTime',
      header: t('finance.dateTime'),
      cell: (row) => row.slip_datetime ? format(new Date(row.slip_datetime), 'd MMM yyyy HH:mm', { locale: getDateLocale(language) }) : '-',
    },
    { key: 'transactionId', header: t('finance.transactionNo'), cell: (row) => row.linked_transaction ? (row.linked_transaction as any).transaction_id : '-' },
    {
      key: 'packageName',
      header: t('transferSlips.packageName'),
      cell: (row) => row.package ? (language === 'th' && row.package.name_th ? row.package.name_th : row.package.name_en) : '-',
    },
    {
      key: 'packageType',
      header: t('transferSlips.packageType'),
      cell: (row) => row.package?.type ? (
        <StatusBadge variant="default">{row.package.type}</StatusBadge>
      ) : '-',
    },
    {
      key: 'soldTo',
      header: t('transferSlips.soldTo'),
      cell: (row) => row.member ? `${row.member.first_name} ${row.member.last_name}` : row.member_name_text || '-',
    },
    {
      key: 'amount',
      header: t('finance.amount'),
      cell: (row) => formatCurrency(Number(row.amount_thb)),
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
      },
    },
  ];

  const slipStatusTabs: StatusTab[] = [
    { key: 'needs_review', label: t('transferSlips.needsReview'), count: slipStats?.needs_review || 0, color: 'red' },
    { key: 'approved', label: t('transferSlips.paid'), count: slipStats?.approved || 0, color: 'teal' },
    { key: 'voided', label: t('transferSlips.voided'), count: slipStats?.voided || 0, color: 'gray' },
  ];

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <DateRangePicker startDate={dateRange.start} endDate={dateRange.end} onChange={onDateRangeChange} />
        <SearchBar
          placeholder={t('transferSlips.searchPlaceholder')}
          value={search}
          onChange={onSearchChange}
          className="max-w-md"
        />
      </div>

      <StatusTabs tabs={slipStatusTabs} activeTab={statusTab} onChange={onStatusTabChange} />

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : (
        <DataTable
          columns={slipColumns}
          data={slips || []}
          rowKey={(row) => row.id}
          onRowClick={(row) => onSlipClick(row.id)}
          emptyMessage={t('transferSlips.noSlips')}
        />
      )}
    </div>
  );
};
