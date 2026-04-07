import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DataTable, EmptyState, type Column } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { useDeleteMemberPackage, type MemberPackage } from '@/hooks/useMemberDetails';
import { EditMemberPackageDialog } from './EditMemberPackageDialog';

interface MemberPackagesTabProps {
  packages: MemberPackage[];
  isLoading: boolean;
  onPurchase: () => void;
}

export const MemberPackagesTab = ({ packages, isLoading, onPurchase }: MemberPackagesTabProps) => {
  const { t, language } = useLanguage();
  const [status, setStatus] = useState('active');
  const [editPkg, setEditPkg] = useState<MemberPackage | null>(null);
  const [deletePkg, setDeletePkg] = useState<MemberPackage | null>(null);
  const deleteMutation = useDeleteMemberPackage();

  const filtered = packages.filter((pkg) => {
    if (status === 'active') return pkg.status === 'active';
    if (status === 'ready') return pkg.status === 'ready_to_use';
    if (status === 'hold') return pkg.status === 'on_hold';
    if (status === 'completed') return pkg.status === 'completed' || pkg.status === 'expired';
    return true;
  });

  const handleDelete = () => {
    if (!deletePkg) return;
    deleteMutation.mutate(
      { id: deletePkg.id, memberId: deletePkg.member_id },
      { onSuccess: () => setDeletePkg(null) }
    );
  };

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
    { key: 'activation_date', header: t('members.activationDate'), cell: (row) => formatDate(row.activation_date) },
    { key: 'expiry_date', header: t('members.expiryDate'), cell: (row) => formatDate(row.expiry_date) },
    { key: 'purchase_transaction', header: t('members.transactionId'), cell: (row) => (row as any).purchase_transaction?.transaction_id || '-' },
    { key: 'actions', header: '', cell: (row) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditPkg(row)}>
            <Pencil className="h-4 w-4 mr-2" /> {t('members.editPackage')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDeletePkg(row)} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" /> {t('members.deletePackage')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )},
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

      {/* Edit dialog */}
      {editPkg && (
        <EditMemberPackageDialog
          open={!!editPkg}
          onOpenChange={(open) => { if (!open) setEditPkg(null); }}
          pkg={editPkg}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deletePkg} onOpenChange={(open) => { if (!open) setDeletePkg(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('members.confirmDeletePackage')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
