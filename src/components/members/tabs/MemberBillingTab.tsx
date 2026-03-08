import { useLanguage } from '@/contexts/LanguageContext';
import { DataTable, EmptyState, type Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency, formatDate } from '@/lib/formatters';
import type { MemberBilling } from '@/hooks/useMemberDetails';

interface MemberBillingTabProps {
  billing: MemberBilling[];
  isLoading: boolean;
}

export const MemberBillingTab = ({ billing, isLoading }: MemberBillingTabProps) => {
  const { t } = useLanguage();

  const columns: Column<MemberBilling>[] = [
    { key: 'billing_date', header: t('members.date'), cell: (row) => formatDate(row.billing_date) },
    { key: 'description', header: t('members.description'), cell: (row) => row.description || '-' },
    { key: 'amount', header: t('members.amount'), cell: (row) => formatCurrency(row.amount) },
    { key: 'transaction', header: t('members.transactionId'), cell: (row) => row.transaction?.transaction_id || '-' },
  ];

  return (
    <>
      <div className="flex justify-end mb-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button className="bg-primary hover:bg-primary/90" disabled>
                  {t('members.addBilling')}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Coming soon</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {isLoading ? (
        <Skeleton className="h-48" />
      ) : billing.length === 0 ? (
        <EmptyState message={t('common.noData')} />
      ) : (
        <DataTable columns={columns} data={billing} rowKey={(row) => row.id} />
      )}
    </>
  );
};
