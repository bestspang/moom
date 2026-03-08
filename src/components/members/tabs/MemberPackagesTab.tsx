import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DataTable, EmptyState, type Column } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/lib/formatters';
import type { MemberPackage } from '@/hooks/useMemberDetails';

interface MemberPackagesTabProps {
  packages: MemberPackage[];
  isLoading: boolean;
  onPurchase: () => void;
}

export const MemberPackagesTab = ({ packages, isLoading, onPurchase }: MemberPackagesTabProps) => {
  const { t, language } = useLanguage();
  const [status, setStatus] = useState('active');

  const filtered = packages.filter((pkg) => {
    if (status === 'active') return pkg.status === 'active';
    if (status === 'ready') return pkg.status === 'ready_to_use';
    if (status === 'hold') return pkg.status === 'on_hold';
    if (status === 'completed') return pkg.status === 'completed' || pkg.status === 'expired';
    return true;
  });

  const columns: Column<MemberPackage>[] = [
    { key: 'package', header: t('members.packageName'), cell: (row) => (
      language === 'th' ? row.package?.name_th || row.package?.name_en : row.package?.name_en
    ) || '-' },
    { key: 'status', header: t('common.status'), cell: (row) => (
      <Badge variant={row.status === 'active' ? 'default' : 'secondary'}>{row.status}</Badge>
    )},
    { key: 'sessions_remaining', header: t('members.sessionsRemaining'), cell: (row) =>
      row.package?.sessions ? `${row.sessions_remaining || 0}/${row.package.sessions}` : t('common.unlimited')
    },
    { key: 'expiry_date', header: t('members.expiryDate'), cell: (row) => formatDate(row.expiry_date) },
    { key: 'purchase_transaction', header: t('members.transactionId'), cell: (row) => (row as any).purchase_transaction?.transaction_id || '-' },
  ];

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <Tabs value={status} onValueChange={setStatus}>
          <TabsList>
            <TabsTrigger value="active">{t('members.activePackages')}</TabsTrigger>
            <TabsTrigger value="ready">{t('members.readyToUse')}</TabsTrigger>
            <TabsTrigger value="hold">{t('members.onHold')}</TabsTrigger>
            <TabsTrigger value="completed">{t('members.completed')}</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button className="bg-primary hover:bg-primary/90" onClick={onPurchase}>
          {t('members.purchasePackage')}
        </Button>
      </div>
      {isLoading ? (
        <Skeleton className="h-48" />
      ) : filtered.length === 0 ? (
        <EmptyState message={t('common.noData')} />
      ) : (
        <DataTable columns={columns} data={filtered} rowKey={(row) => row.id} />
      )}
    </>
  );
};
