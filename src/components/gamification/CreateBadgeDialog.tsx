import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateGamificationBadge, useUpdateGamificationBadge, type GamificationBadge } from '@/hooks/useGamificationBadges';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBadge?: GamificationBadge | null;
}

interface BadgeForm {
  name_en: string;
  name_th: string;
  description_en: string;
  description_th: string;
  tier: string;
  display_priority: number;
  is_active: boolean;
}

const emptyForm: BadgeForm = {
  name_en: '', name_th: '', description_en: '', description_th: '',
  tier: 'bronze', display_priority: 0, is_active: true,
};

const CreateBadgeDialog = ({ open, onOpenChange, editingBadge }: Props) => {
  const { t } = useLanguage();
  const create = useCreateGamificationBadge();
  const update = useUpdateGamificationBadge();
  const [form, setForm] = useState<BadgeForm>(emptyForm);

  useEffect(() => {
    if (editingBadge) {
      setForm({
        name_en: editingBadge.name_en,
        name_th: editingBadge.name_th || '',
        description_en: editingBadge.description_en || '',
        description_th: editingBadge.description_th || '',
        tier: editingBadge.tier,
        display_priority: editingBadge.display_priority,
        is_active: editingBadge.is_active,
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingBadge, open]);

  const handleSave = () => {
    const payload = {
      ...form,
      name_th: form.name_th || null,
      description_en: form.description_en || null,
      description_th: form.description_th || null,
    };
    if (editingBadge) {
      update.mutate({ id: editingBadge.id, ...payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      create.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingBadge ? t('common.edit') : t('gamification.badges.create')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Name (EN) *</Label><Input value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} /></div>
            <div><Label>Name (TH)</Label><Input value={form.name_th} onChange={e => setForm(f => ({ ...f, name_th: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Description (EN)</Label><Textarea rows={2} value={form.description_en} onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))} /></div>
            <div><Label>Description (TH)</Label><Textarea rows={2} value={form.description_th} onChange={e => setForm(f => ({ ...f, description_th: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tier</Label>
              <Select value={form.tier} onValueChange={v => setForm(f => ({ ...f, tier: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Display Priority</Label><Input type="number" value={form.display_priority} onChange={e => setForm(f => ({ ...f, display_priority: Number(e.target.value) }))} /></div>
          </div>
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

export default CreateBadgeDialog;
