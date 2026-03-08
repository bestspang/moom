import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DateRangePicker, SearchBar, DataTable, StatusBadge, type Column } from '@/components/common';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, getDateLocale } from '@/lib/formatters';
import { format } from 'date-fns';

const PAGE_SIZE = 50;

interface FinanceTransactionsProps {
  transactions: any[] | undefined;
  isLoading: boolean;
  dateRange: { start?: Date; end?: Date };
  onDateRangeChange: (range: { start?: Date; end?: Date }) => void;
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  paymentMethodFilter: string;
  onPaymentMethodFilterChange: (v: string) => void;
  page: number;
  onPageChange: (p: number) => void;
}

export const FinanceTransactions = ({
  transactions,
  isLoading,
  dateRange,
  onDateRangeChange,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  paymentMethodFilter,
  onPaymentMethodFilterChange,
  page,
  onPageChange,
}: FinanceTransactionsProps) => {
  const { t, language } = useLanguage();

  const paginatedData = React.useMemo(() => {
    if (!transactions) return [];
    const start = (page - 1) * PAGE_SIZE;
    return transactions.slice(start, start + PAGE_SIZE);
  }, [transactions, page]);

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
      cash: t('finance.cash'),
      bank_transfer: t('finance.bankTransfer'),
      credit_card: t('finance.creditCard'),
      promptpay: t('finance.promptpay'),
      card_stripe: t('finance.stripeCard'),
      qr_promptpay_stripe: t('finance.stripePromptpay'),
      other: t('finance.other'),
    };
    return method ? (map[method] || method) : '-';
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
      cell: (row) => format(new Date(row.paid_at || row.created_at), 'd MMM yyyy HH:mm', { locale: getDateLocale(language) }),
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
      ),
    },
    {
      key: 'type',
      header: t('packages.type'),
      cell: (row) => (
        <StatusBadge variant="default">{row.type || '-'}</StatusBadge>
      ),
    },
    {
      key: 'soldTo',
      header: t('finance.soldTo'),
      cell: (row) => row.sold_to_name || (row.member ? `${row.member.first_name} ${row.member.last_name}` : '-'),
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
      },
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
          failed: t('finance.failed'),
          refunded: t('finance.refunded'),
        };
        return (
          <StatusBadge variant={getStatusVariant(row.status) as any}>
            {statusLabels[row.status] || row.status || '-'}
          </StatusBadge>
        );
      },
    },
  ];

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <DateRangePicker startDate={dateRange.start} endDate={dateRange.end} onChange={onDateRangeChange} />
        <SearchBar
          placeholder={t('finance.searchPlaceholder')}
          value={search}
          onChange={(v) => { onSearchChange(v); onPageChange(1); }}
          className="max-w-md"
        />
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
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
        <Select value={paymentMethodFilter} onValueChange={onPaymentMethodFilterChange}>
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

      {isLoading ? (
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
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};
