import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGamificationShopRules, useCreateShopRule, useUpdateShopRule, useDeleteShopRule, type ShopRewardRule } from '@/hooks/useGamificationShopRules';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DataTable } from '@/components/common/DataTable';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface ShopRuleForm {
  order_type: string;
  min_spend: number;
  xp_per_order: number;
  xp_per_spend_unit: number;
  spend_unit: number;
  xp_cap: string;
  coin_per_spend_unit: number;
  coin_spend_unit: number;
  coin_cap: string;
  required_level: number;
  is_active: boolean;
}

const emptyForm: ShopRuleForm = {
  order_type: 'merch', min_spend: 0, xp_per_order: 0,
  xp_per_spend_unit: 0, spend_unit: 100, xp_cap: '',
  coin_per_spend_unit: 0, coin_spend_unit: 100, coin_cap: '',
  required_level: 0, is_active: true,
};

const GamificationShopRules = () => {
  const { t } = useLanguage();
  const { data: rules, isLoading } = useGamificationShopRules();
  const create = useCreateShopRule();
  const update = useUpdateShopRule();
  const del = useDeleteShopRule();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ShopRewardRule | null>(null);
  const [form, setForm] = useState<ShopRuleForm>(emptyForm);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (r: ShopRewardRule) => {
    setEditing(r);
    setForm({
      order_type: r.order_type, min_spend: r.min_spend, xp_per_order: r.xp_per_order,
      xp_per_spend_unit: r.xp_per_spend_unit, spend_unit: r.spend_unit,
      xp_cap: r.xp_cap?.toString() || '', coin_per_spend_unit: r.coin_per_spend_unit,
      coin_spend_unit: r.coin_spend_unit, coin_cap: r.coin_cap?.toString() || '',
      required_level: r.required_level, is_active: r.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const payload = {
      ...form,
      xp_cap: form.xp_cap ? Number(form.xp_cap) : null,
      coin_cap: form.coin_cap ? Number(form.coin_cap) : null,
    };
    if (editing) {
      update.mutate({ id: editing.id, ...payload }, { onSuccess: () => setDialogOpen(false) });
    } else {
      create.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const isPending = create.isPending || update.isPending;

  if (isLoading) return <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Configure XP and Coin earn rules for shop purchases.</p>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Add Rule</Button>
      </div>

      {!rules || rules.length === 0 ? (
        <EmptyState message="No shop rules" description="Configure how purchases earn XP and Coin." />
      ) : (
        <DataTable
          data={rules}
          columns={[
            { key: 'orderType', header: 'Order Type', cell: (r: ShopRewardRule) => r.order_type },
            { key: 'xpOrder', header: 'XP/Order', cell: (r: ShopRewardRule) => r.xp_per_order },
            { key: 'xpUnit', header: 'XP/Unit', cell: (r: ShopRewardRule) => `${r.xp_per_spend_unit} per ฿${r.spend_unit}` },
            { key: 'xpCap', header: 'XP Cap', cell: (r: ShopRewardRule) => r.xp_cap ?? '∞' },
            { key: 'coinUnit', header: 'Coin/Unit', cell: (r: ShopRewardRule) => `${r.coin_per_spend_unit} per ฿${r.coin_spend_unit}` },
            { key: 'coinCap', header: 'Coin Cap', cell: (r: ShopRewardRule) => r.coin_cap ?? '∞' },
            { key: 'active', header: 'Active', cell: (r: ShopRewardRule) => r.is_active ? '✅' : '—' },
            { key: 'actions', header: '', cell: (r: ShopRewardRule) => (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del.mutate(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            )},
          ]}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Shop Rule' : 'Create Shop Rule'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Order Type</Label>
                <Select value={form.order_type} onValueChange={v => setForm(f => ({ ...f, order_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="merch">Merch</SelectItem>
                    <SelectItem value="package">Package</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Min Spend (฿)</Label><Input type="number" value={form.min_spend} onChange={e => setForm(f => ({ ...f, min_spend: Number(e.target.value) }))} /></div>
            </div>
            <p className="text-xs font-bold text-foreground uppercase tracking-wider">XP Rules</p>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>XP/Order</Label><Input type="number" value={form.xp_per_order} onChange={e => setForm(f => ({ ...f, xp_per_order: Number(e.target.value) }))} /></div>
              <div><Label>XP/Spend Unit</Label><Input type="number" value={form.xp_per_spend_unit} onChange={e => setForm(f => ({ ...f, xp_per_spend_unit: Number(e.target.value) }))} /></div>
              <div><Label>XP Cap</Label><Input type="number" value={form.xp_cap} onChange={e => setForm(f => ({ ...f, xp_cap: e.target.value }))} placeholder="∞" /></div>
            </div>
            <p className="text-xs font-bold text-foreground uppercase tracking-wider">Coin Rules</p>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Spend Unit (฿)</Label><Input type="number" value={form.coin_spend_unit} onChange={e => setForm(f => ({ ...f, coin_spend_unit: Number(e.target.value) }))} /></div>
              <div><Label>Coin/Unit</Label><Input type="number" value={form.coin_per_spend_unit} onChange={e => setForm(f => ({ ...f, coin_per_spend_unit: Number(e.target.value) }))} /></div>
              <div><Label>Coin Cap</Label><Input type="number" value={form.coin_cap} onChange={e => setForm(f => ({ ...f, coin_cap: e.target.value }))} placeholder="∞" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Required Level</Label><Input type="number" value={form.required_level} onChange={e => setForm(f => ({ ...f, required_level: Number(e.target.value) }))} /></div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label>{t('common.active')}</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GamificationShopRules;
