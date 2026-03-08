import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TrainerTier {
  id: string;
  trainer_type: string;
  tier_name_en: string;
  tier_name_th: string | null;
  min_score: number;
  sort_order: number | null;
  is_active: boolean;
  perks: any;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTier?: TrainerTier | null;
  defaultType?: string;
}

interface TierForm {
  trainer_type: string;
  tier_name_en: string;
  tier_name_th: string;
  min_score: number;
  sort_order: number;
  is_active: boolean;
}

const emptyForm: TierForm = {
  trainer_type: 'in_house', tier_name_en: '', tier_name_th: '', min_score: 0, sort_order: 0, is_active: true,
};

const CreateTrainerTierDialog = ({ open, onOpenChange, editingTier, defaultType }: Props) => {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [form, setForm] = useState<TierForm>(emptyForm);

  const create = useMutation({
    mutationFn: async (tier: Partial<TierForm>) => {
      const { data, error } = await supabase.from('gamification_trainer_tiers').insert([tier as any]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gamification-trainer-tiers'] }); toast.success('Tier created'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from('gamification_trainer_tiers').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gamification-trainer-tiers'] }); toast.success('Tier updated'); },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    if (editingTier) {
      setForm({
        trainer_type: editingTier.trainer_type,
        tier_name_en: editingTier.tier_name_en,
        tier_name_th: editingTier.tier_name_th || '',
        min_score: editingTier.min_score,
        sort_order: editingTier.sort_order || 0,
        is_active: editingTier.is_active,
      });
    } else {
      setForm({ ...emptyForm, trainer_type: defaultType || 'in_house' });
    }
  }, [editingTier, open, defaultType]);

  const handleSave = () => {
    const payload = { ...form, tier_name_th: form.tier_name_th || null };
    if (editingTier) {
      update.mutate({ id: editingTier.id, ...payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      create.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingTier ? t('common.edit') : 'Add Trainer Tier'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Trainer Type</Label>
            <Select value={form.trainer_type} onValueChange={v => setForm(f => ({ ...f, trainer_type: v }))} disabled={!!editingTier}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="in_house">{t('gamification.trainers.inHouse')}</SelectItem>
                <SelectItem value="freelance">{t('gamification.trainers.freelance')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Tier Name (EN) *</Label><Input value={form.tier_name_en} onChange={e => setForm(f => ({ ...f, tier_name_en: e.target.value }))} /></div>
            <div><Label>Tier Name (TH)</Label><Input value={form.tier_name_th} onChange={e => setForm(f => ({ ...f, tier_name_th: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t('gamification.trainers.minScore')}</Label><Input type="number" value={form.min_score} onChange={e => setForm(f => ({ ...f, min_score: Number(e.target.value) }))} /></div>
            <div><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} /></div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
            <Label>{t('common.active')}</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={!form.tier_name_en || isPending}>
            {isPending ? t('common.saving') : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTrainerTierDialog;
