import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGamificationCoupons, useCreateCouponTemplate, useUpdateCouponTemplate, useDeleteCouponTemplate, type CouponTemplate } from '@/hooks/useGamificationCoupons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DataTable } from '@/components/common/DataTable';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface CouponForm {
  name_en: string;
  name_th: string;
  discount_type: string;
  discount_value: number;
  max_discount: string;
  min_spend: string;
  valid_days: number;
  applies_to: string;
  stackable: boolean;
  is_active: boolean;
}

const emptyForm: CouponForm = {
  name_en: '', name_th: '', discount_type: 'fixed', discount_value: 0,
  max_discount: '', min_spend: '', valid_days: 14, applies_to: 'all',
  stackable: false, is_active: true,
};

const GamificationCoupons = () => {
  const { t } = useLanguage();
  const { data: coupons, isLoading } = useGamificationCoupons();
  const create = useCreateCouponTemplate();
  const update = useUpdateCouponTemplate();
  const del = useDeleteCouponTemplate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CouponTemplate | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (c: CouponTemplate) => {
    setEditing(c);
    setForm({
      name_en: c.name_en, name_th: c.name_th || '', discount_type: c.discount_type,
      discount_value: c.discount_value, max_discount: c.max_discount?.toString() || '',
      min_spend: c.min_spend?.toString() || '', valid_days: c.valid_days,
      applies_to: c.applies_to, stackable: c.stackable, is_active: c.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const payload = {
      name_en: form.name_en, name_th: form.name_th || null,
      discount_type: form.discount_type, discount_value: form.discount_value,
      max_discount: form.max_discount ? Number(form.max_discount) : null,
      min_spend: form.min_spend ? Number(form.min_spend) : null,
      valid_days: form.valid_days, applies_to: form.applies_to,
      stackable: form.stackable, is_active: form.is_active,
    };
    if (editing) {
      update.mutate({ id: editing.id, ...payload }, { onSuccess: () => setDialogOpen(false) });
    } else {
      create.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const isPending = create.isPending || update.isPending;

  if (isLoading) return <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Manage coupon templates for merch, packages, and events.</p>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Add Coupon</Button>
      </div>

      {!coupons || coupons.length === 0 ? (
        <EmptyState title="No coupon templates" description="Create coupon templates to offer discounts through the reward system." />
      ) : (
        <DataTable
          data={coupons}
          columns={[
            { header: 'Name', accessorFn: (r: CouponTemplate) => r.name_en },
            { header: 'Type', accessorFn: (r: CouponTemplate) => r.discount_type === 'fixed' ? `฿${r.discount_value}` : `${r.discount_value}%` },
            { header: 'Min Spend', accessorFn: (r: CouponTemplate) => r.min_spend ? `฿${r.min_spend}` : '—' },
            { header: 'Applies To', cell: ({ row }: any) => <StatusBadge status={row.original.applies_to} /> },
            { header: 'Valid Days', accessorFn: (r: CouponTemplate) => r.valid_days },
            { header: 'Active', cell: ({ row }: any) => row.original.is_active ? '✅' : '—' },
            { header: '', cell: ({ row }: any) => (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(row.original)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del.mutate(row.original.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            )},
          ]}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Coupon Template' : 'Create Coupon Template'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name (EN) *</Label><Input value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} /></div>
              <div><Label>Name (TH)</Label><Input value={form.name_th} onChange={e => setForm(f => ({ ...f, name_th: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Discount Type</Label>
                <Select value={form.discount_type} onValueChange={v => setForm(f => ({ ...f, discount_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed (฿)</SelectItem>
                    <SelectItem value="percent">Percent (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Discount Value *</Label><Input type="number" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: Number(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Max Discount (฿)</Label><Input type="number" value={form.max_discount} onChange={e => setForm(f => ({ ...f, max_discount: e.target.value }))} placeholder="None" /></div>
              <div><Label>Min Spend (฿)</Label><Input type="number" value={form.min_spend} onChange={e => setForm(f => ({ ...f, min_spend: e.target.value }))} placeholder="None" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valid Days</Label><Input type="number" value={form.valid_days} onChange={e => setForm(f => ({ ...f, valid_days: Number(e.target.value) }))} /></div>
              <div>
                <Label>Applies To</Label>
                <Select value={form.applies_to} onValueChange={v => setForm(f => ({ ...f, applies_to: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="merch">Merch</SelectItem>
                    <SelectItem value="package">Package</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.stackable} onCheckedChange={v => setForm(f => ({ ...f, stackable: v }))} />
                <Label>Stackable</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label>{t('common.active')}</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={!form.name_en || isPending}>
              {isPending ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GamificationCoupons;
