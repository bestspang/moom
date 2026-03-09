import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateGamificationReward, useUpdateGamificationReward, type GamificationReward } from '@/hooks/useGamificationRewards';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingReward?: GamificationReward | null;
}

interface RewardForm {
  name_en: string;
  name_th: string;
  description_en: string;
  description_th: string;
  category: string;
  reward_type: string;
  points_cost: number;
  cash_price: string;
  level_required: number;
  stock: string;
  is_unlimited: boolean;
  is_active: boolean;
}

const emptyForm: RewardForm = {
  name_en: '', name_th: '', description_en: '', description_th: '',
  category: 'perk', reward_type: 'digital', points_cost: 0, cash_price: '',
  level_required: 0, stock: '', is_unlimited: true, is_active: true,
};

const CreateRewardDialog = ({ open, onOpenChange, editingReward }: Props) => {
  const { t } = useLanguage();
  const create = useCreateGamificationReward();
  const update = useUpdateGamificationReward();
  const [form, setForm] = useState<RewardForm>(emptyForm);

  useEffect(() => {
    if (editingReward) {
      setForm({
        name_en: editingReward.name_en,
        name_th: editingReward.name_th || '',
        description_en: editingReward.description_en || '',
        description_th: editingReward.description_th || '',
        category: editingReward.category,
        reward_type: (editingReward as any).reward_type || 'digital',
        points_cost: editingReward.points_cost,
        cash_price: (editingReward as any).cash_price?.toString() || '',
        level_required: editingReward.level_required,
        stock: editingReward.stock?.toString() || '',
        is_unlimited: editingReward.is_unlimited,
        is_active: editingReward.is_active,
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingReward, open]);

  const handleSave = () => {
    const payload = {
      name_en: form.name_en,
      name_th: form.name_th || null,
      description_en: form.description_en || null,
      description_th: form.description_th || null,
      category: form.category,
      reward_type: form.reward_type,
      points_cost: form.points_cost,
      cash_price: form.cash_price ? Number(form.cash_price) : 0,
      level_required: form.level_required,
      stock: form.is_unlimited ? null : (form.stock ? Number(form.stock) : null),
      is_unlimited: form.is_unlimited,
      is_active: form.is_active,
    };
    if (editingReward) {
      update.mutate({ id: editingReward.id, ...payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      create.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingReward ? t('common.edit') : t('gamification.rewards.create')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t('gamification.form.nameEn')} {t('gamification.form.required')}</Label><Input value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} /></div>
            <div><Label>{t('gamification.form.nameTh')}</Label><Input value={form.name_th} onChange={e => setForm(f => ({ ...f, name_th: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t('gamification.form.descriptionEn')}</Label><Textarea rows={2} value={form.description_en} onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))} /></div>
            <div><Label>{t('gamification.form.descriptionTh')}</Label><Textarea rows={2} value={form.description_th} onChange={e => setForm(f => ({ ...f, description_th: e.target.value }))} /></div>
          </div>
          <div>
            <Label>{t('gamification.form.category')}</Label>
            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="perk">{t('gamification.rewards.categoryPerk')}</SelectItem>
                <SelectItem value="merch">{t('gamification.rewards.categoryMerch')}</SelectItem>
                <SelectItem value="access">{t('gamification.rewards.categoryAccess')}</SelectItem>
                <SelectItem value="package_booster">{t('gamification.rewards.categoryPackageBooster')}</SelectItem>
                <SelectItem value="event">{t('gamification.rewards.categoryEvent')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t('gamification.rewards.pointsCost')} {t('gamification.form.required')}</Label><Input type="number" value={form.points_cost} onChange={e => setForm(f => ({ ...f, points_cost: Number(e.target.value) }))} /></div>
            <div><Label>{t('gamification.rewards.levelRequired')}</Label><Input type="number" value={form.level_required} onChange={e => setForm(f => ({ ...f, level_required: Number(e.target.value) }))} /></div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_unlimited} onCheckedChange={v => setForm(f => ({ ...f, is_unlimited: v }))} />
            <Label>{t('gamification.rewards.unlimitedStock')}</Label>
          </div>
          {!form.is_unlimited && (
            <div><Label>{t('gamification.rewards.stock')}</Label><Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder={t('gamification.rewards.totalUnits')} /></div>
          )}
          <div className="flex items-center gap-2">
            <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
            <Label>{t('common.active')}</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={!form.name_en || isPending}>
            {isPending ? t('common.saving') : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRewardDialog;
