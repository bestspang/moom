import { useState } from 'react';
import { format } from 'date-fns';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DataTable, EmptyState, type Column } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { MemberBilling } from '@/hooks/useMemberDetails';
import {
  useCreateMemberBilling,
  useUpdateMemberBilling,
  useDeleteMemberBilling,
} from '@/hooks/useMemberDetails';

interface MemberBillingTabProps {
  billing: MemberBilling[];
  memberId: string;
  isLoading: boolean;
}

interface BillingFormData {
  description: string;
  amount: string;
  billing_date: Date;
  transaction_id: string;
}

const emptyForm: BillingFormData = {
  description: '',
  amount: '',
  billing_date: new Date(),
  transaction_id: '',
};

export const MemberBillingTab = ({ billing, memberId, isLoading }: MemberBillingTabProps) => {
  const { t } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<BillingFormData>(emptyForm);

  const createBilling = useCreateMemberBilling();
  const updateBilling = useUpdateMemberBilling();
  const deleteBilling = useDeleteMemberBilling();

  const isSaving = createBilling.isPending || updateBilling.isPending;

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (row: MemberBilling) => {
    setEditingId(row.id);
    setForm({
      description: row.description || '',
      amount: String(row.amount),
      billing_date: row.billing_date ? new Date(row.billing_date) : new Date(),
      transaction_id: row.transaction_id || '',
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const amount = parseFloat(form.amount);
    if (!form.description.trim() || isNaN(amount) || amount <= 0) return;

    const billingDate = format(form.billing_date, 'yyyy-MM-dd');

    if (editingId) {
      updateBilling.mutate(
        {
          id: editingId,
          memberId,
          data: {
            description: form.description.trim(),
            amount,
            billing_date: billingDate,
            transaction_id: form.transaction_id || null,
          },
        },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createBilling.mutate(
        {
          memberId,
          description: form.description.trim(),
          amount,
          billing_date: billingDate,
          transaction_id: form.transaction_id || null,
        },
        { onSuccess: () => setDialogOpen(false) }
      );
    }
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteBilling.mutate(
      { id: deleteId, memberId },
      { onSuccess: () => setDeleteId(null) }
    );
  };

  const columns: Column<MemberBilling>[] = [
    { key: 'billing_date', header: t('members.date'), cell: (row) => formatDate(row.billing_date) },
    { key: 'description', header: t('members.billingDescription'), cell: (row) => row.description || '-' },
    { key: 'amount', header: t('members.billingAmount'), cell: (row) => formatCurrency(row.amount) },
    { key: 'transaction', header: t('members.transactionId'), cell: (row) => row.transaction?.transaction_id || '-' },
    {
      key: 'actions',
      header: t('common.actions'),
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(row.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" />
          {t('members.addBilling')}
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-48" />
      ) : billing.length === 0 ? (
        <EmptyState message={t('common.noData')} />
      ) : (
        <DataTable columns={columns} data={billing} rowKey={(row) => row.id} />
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? t('members.editBilling') : t('members.addBilling')}</DialogTitle>
            <DialogDescription>
              {editingId ? t('members.editBilling') : t('members.addBilling')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('members.billingDescription')}</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder={t('members.billingDescription')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('members.billingAmount')}</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('members.billingDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-left font-normal')}>
                    {format(form.billing_date, 'dd/MM/yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.billing_date}
                    onSelect={(d) => d && setForm((f) => ({ ...f, billing_date: d }))}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !form.description.trim() || !form.amount}>
              {isSaving ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('members.deleteBilling')}</AlertDialogTitle>
            <AlertDialogDescription>{t('members.confirmDeleteBilling')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
