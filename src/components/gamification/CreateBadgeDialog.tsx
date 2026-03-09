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
  badge_type: string;
  effect_type: string;
  duration_days: string;
  display_priority: number;
  is_active: boolean;
}

const emptyForm: BadgeForm = {
  name_en: '', name_th: '', description_en: '', description_th: '',
  tier: 'bronze', badge_type: 'permanent', effect_type: 'cosmetic',
  duration_days: '', display_priority: 0, is_active: true,
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
        badge_type: (editingBadge as any).badge_type || 'permanent',
        effect_type: (editingBadge as any).effect_type || 'cosmetic',
        duration_days: (editingBadge as any).duration_days?.toString() || '',
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
      duration_days: form.duration_days ? Number(form.duration_days) : null,
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
            <div><Label>{t('gamification.form.nameEn')} {t('gamification.form.required')}</Label><Input value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} /></div>
            <div><Label>{t('gamification.form.nameTh')}</Label><Input value={form.name_th} onChange={e => setForm(f => ({ ...f, name_th: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t('gamification.form.descriptionEn')}</Label><Textarea rows={2} value={form.description_en} onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))} /></div>
            <div><Label>{t('gamification.form.descriptionTh')}</Label><Textarea rows={2} value={form.description_th} onChange={e => setForm(f => ({ ...f, description_th: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t('gamification.badges.tier')}</Label>
              <Select value={form.tier} onValueChange={v => setForm(f => ({ ...f, tier: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bronze">{t('gamification.badges.bronze')}</SelectItem>
                  <SelectItem value="silver">{t('gamification.badges.silver')}</SelectItem>
                  <SelectItem value="gold">{t('gamification.badges.gold')}</SelectItem>
                  <SelectItem value="platinum">{t('gamification.badges.platinum')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Badge Type</Label>
              <Select value={form.badge_type} onValueChange={v => setForm(f => ({ ...f, badge_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="boost">Boost</SelectItem>
                  <SelectItem value="access">Access</SelectItem>
                  <SelectItem value="seasonal">Seasonal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Effect Type</Label>
              <Select value={form.effect_type} onValueChange={v => setForm(f => ({ ...f, effect_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cosmetic">Cosmetic</SelectItem>
                  <SelectItem value="coin_bonus">Coin Bonus</SelectItem>
                  <SelectItem value="xp_bonus">XP Bonus</SelectItem>
                  <SelectItem value="access">Access</SelectItem>
                  <SelectItem value="discount">Discount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Duration (days)</Label><Input type="number" value={form.duration_days} onChange={e => setForm(f => ({ ...f, duration_days: e.target.value }))} placeholder="∞" /></div>
            <div><Label>{t('gamification.badges.displayPriority')}</Label><Input type="number" value={form.display_priority} onChange={e => setForm(f => ({ ...f, display_priority: Number(e.target.value) }))} /></div>
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
