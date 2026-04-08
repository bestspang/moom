import { useState } from 'react';
import { differenceInDays } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { DataTable, EmptyState, type Column } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MoreHorizontal, Pencil, Trash2, Play, Plus } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { useDeleteMemberPackage, useActivateMemberPackage, type MemberPackage } from '@/hooks/useMemberDetails';
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
  const [activatePkg, setActivatePkg] = useState<MemberPackage | null>(null);
  const deleteMutation = useDeleteMemberPackage();
  const activateMutation = useActivateMemberPackage();

  const filtered = packages.filter((pkg) => {
    if (status === 'active') return pkg.status === 'active';
    if (status === 'ready') return pkg.status === 'ready_to_use';
    if (status === 'hold') return pkg.status === 'on_hold';
    if (status === 'completed') return pkg.status === 'completed' || pkg.status === 'expired';
    return true;
  });

  const statusCounts = {
    active: packages.filter(p => p.status === 'active').length,
    ready: packages.filter(p => p.status === 'ready_to_use').length,
    hold: packages.filter(p => p.status === 'on_hold').length,
    completed: packages.filter(p => p.status === 'completed' || p.status === 'expired').length,
  };

  const handleDelete = () => {
    if (!deletePkg) return;
    deleteMutation.mutate(
      { id: deletePkg.id, memberId: deletePkg.member_id },
      { onSuccess: () => setDeletePkg(null) }
    );
  };

  const handleActivate = () => {
    if (!activatePkg) return;
    activateMutation.mutate(
      { id: activatePkg.id, memberId: activatePkg.member_id, termDays: activatePkg.package?.term_days || 30 },
      { onSuccess: () => setActivatePkg(null) }
    );
  };

  const getDaysRemaining = (pkg: MemberPackage): number | null => {
    if (pkg.status !== 'active' || !pkg.expiry_date) return null;
    return differenceInDays(new Date(pkg.expiry_date), new Date());
  };

  const getDaysRemainingBadge = (days: number | null) => {
    if (days === null) return null;
    if (days <= 0) return <Badge variant="destructive" className="text-xs">{t('members.packageStatus.expired')}</Badge>;
    if (days <= 3) return <Badge variant="destructive" className="text-xs">{days} {t('common.days')}</Badge>;
    if (days <= 7) return <Badge className="bg-orange-500 text-white text-xs">{days} {t('common.days')}</Badge>;
    return <Badge variant="secondary" className="text-xs">{days} {t('common.days')}</Badge>;
  };

  const statusLabel = (s: string) => {
    const key = `members.packageStatus.${s}` as any;
    const label = t(key);
    return label !== key ? label : s.replace(/_/g, ' ');
  };

  const columns: Column<MemberPackage>[] = [
    { key: 'package', header: t('members.packageName'), cell: (row) => (
      language === 'th' ? row.package?.name_th || row.package?.name_en : row.package?.name_en
    ) || '-' },
    { key: 'status', header: t('common.status'), cell: (row) => (
      <Badge variant={row.status === 'active' ? 'default' : 'secondary'}>{statusLabel(row.status || 'ready_to_use')}</Badge>
    )},
    { key: 'days_remaining', header: t('members.daysRemaining'), cell: (row) => {
      const days = getDaysRemaining(row);
      return getDaysRemainingBadge(days) || '-';
    }},
    { key: 'sessions_remaining', header: t('members.sessionsRemaining'), cell: (row) =>
      row.package?.sessions ? `${row.sessions_remaining || 0}/${row.package.sessions}` : t('common.unlimited')
    },
    { key: 'activation_date', header: t('members.activationDate'), cell: (row) => formatDate(row.activation_date) },
    { key: 'expiry_date', header: t('members.expiryDate'), cell: (row) => formatDate(row.expiry_date) },
    { key: 'actions', header: '', cell: (row) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {row.status === 'ready_to_use' && (
            <>
              <DropdownMenuItem onClick={() => setActivatePkg(row)}>
                <Play className="h-4 w-4 mr-2" /> {t('members.activatePackage')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
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
      {/* Header: Purchase button */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{t('members.tabs.packages')}</h3>
        <Button size="sm" onClick={onPurchase}>
          <Plus className="h-4 w-4 mr-1" />
          {t('members.purchasePackage')}
        </Button>
      </div>

      {/* Status tabs with counts */}
      <Tabs value={status} onValueChange={setStatus} className="mb-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="active">
            {t('members.activePackages')} {statusCounts.active > 0 && <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">{statusCounts.active}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="ready">
            {t('members.readyToUse')} {statusCounts.ready > 0 && <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">{statusCounts.ready}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="hold">
            {t('members.onHold')} {statusCounts.hold > 0 && <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">{statusCounts.hold}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="completed">
            {t('members.completed')} {statusCounts.completed > 0 && <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">{statusCounts.completed}</Badge>}
          </TabsTrigger>
        </TabsList>
      </Tabs>

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

      {/* Activate confirmation */}
      <AlertDialog open={!!activatePkg} onOpenChange={(open) => { if (!open) setActivatePkg(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('members.activatePackage')}</AlertDialogTitle>
            <AlertDialogDescription>{t('members.activateConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleActivate} disabled={activateMutation.isPending}>
              {t('members.activatePackage')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
