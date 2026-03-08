import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateGamificationChallenge, useUpdateGamificationChallenge, type GamificationChallenge } from '@/hooks/useGamificationChallenges';
import { useGamificationBadges } from '@/hooks/useGamificationBadges';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingChallenge?: GamificationChallenge | null;
}

interface ChallengeForm {
  name_en: string;
  name_th: string;
  description_en: string;
  description_th: string;
  type: string;
  goal_type: string;
  goal_value: number;
  goal_action_key: string;
  reward_xp: number;
  reward_points: number;
  reward_badge_id: string;
  start_date: string;
  end_date: string;
  status: string;
}

const emptyForm: ChallengeForm = {
  name_en: '', name_th: '', description_en: '', description_th: '',
  type: 'daily', goal_type: 'action_count', goal_value: 1, goal_action_key: '',
  reward_xp: 0, reward_points: 0, reward_badge_id: '',
  start_date: '', end_date: '', status: 'draft',
};

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">{children}</p>
);

const CreateChallengeDialog = ({ open, onOpenChange, editingChallenge }: Props) => {
  const { t } = useLanguage();
  const create = useCreateGamificationChallenge();
  const update = useUpdateGamificationChallenge();
  const { data: badges } = useGamificationBadges();
  const [form, setForm] = useState<ChallengeForm>(emptyForm);

  useEffect(() => {
    if (editingChallenge) {
      setForm({
        name_en: editingChallenge.name_en,
        name_th: editingChallenge.name_th || '',
        description_en: editingChallenge.description_en || '',
        description_th: editingChallenge.description_th || '',
        type: editingChallenge.type,
        goal_type: editingChallenge.goal_type,
        goal_value: editingChallenge.goal_value,
        goal_action_key: editingChallenge.goal_action_key || '',
        reward_xp: editingChallenge.reward_xp,
        reward_points: editingChallenge.reward_points,
        reward_badge_id: editingChallenge.reward_badge_id || '',
        start_date: editingChallenge.start_date?.slice(0, 10) || '',
        end_date: editingChallenge.end_date?.slice(0, 10) || '',
        status: editingChallenge.status,
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingChallenge, open]);

  const handleSave = () => {
    const payload = {
      ...form,
      name_th: form.name_th || null,
      description_en: form.description_en || null,
      description_th: form.description_th || null,
      goal_action_key: form.goal_action_key || null,
      reward_badge_id: form.reward_badge_id || null,
    };
    if (editingChallenge) {
      update.mutate({ id: editingChallenge.id, ...payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      create.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingChallenge ? t('common.edit') : t('gamification.challenges.create')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <SectionHeader>{t('gamification.challenges.sectionBasic')}</SectionHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t('gamification.form.nameEn')} {t('gamification.form.required')}</Label><Input value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} /></div>
            <div><Label>{t('gamification.form.nameTh')}</Label><Input value={form.name_th} onChange={e => setForm(f => ({ ...f, name_th: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t('gamification.form.descriptionEn')}</Label><Textarea rows={2} value={form.description_en} onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))} /></div>
            <div><Label>{t('gamification.form.descriptionTh')}</Label><Textarea rows={2} value={form.description_th} onChange={e => setForm(f => ({ ...f, description_th: e.target.value }))} /></div>
          </div>

          <SectionHeader>{t('gamification.challenges.sectionGoal')}</SectionHeader>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>{t('gamification.form.type')}</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{t('gamification.challenges.daily')}</SelectItem>
                  <SelectItem value="weekly">{t('gamification.challenges.weekly')}</SelectItem>
                  <SelectItem value="seasonal">{t('gamification.challenges.seasonal')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('gamification.challenges.goalType')}</Label>
              <Select value={form.goal_type} onValueChange={v => setForm(f => ({ ...f, goal_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="action_count">{t('gamification.challenges.goalTypeActionCount')}</SelectItem>
                  <SelectItem value="xp_threshold">{t('gamification.challenges.goalTypeXpThreshold')}</SelectItem>
                  <SelectItem value="class_count">{t('gamification.challenges.goalTypeClassCount')}</SelectItem>
                  <SelectItem value="streak">{t('gamification.challenges.goalTypeStreak')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>{t('gamification.challenges.goalValue')}</Label><Input type="number" value={form.goal_value} onChange={e => setForm(f => ({ ...f, goal_value: Number(e.target.value) }))} /></div>
          </div>
          <div><Label>{t('gamification.challenges.goalActionKey')}</Label><Input value={form.goal_action_key} onChange={e => setForm(f => ({ ...f, goal_action_key: e.target.value }))} placeholder={t('gamification.challenges.goalActionKeyHint')} /></div>

          <SectionHeader>{t('gamification.challenges.sectionReward')}</SectionHeader>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>{t('gamification.challenges.rewardXp')}</Label><Input type="number" value={form.reward_xp} onChange={e => setForm(f => ({ ...f, reward_xp: Number(e.target.value) }))} /></div>
            <div><Label>{t('gamification.challenges.rewardPoints')}</Label><Input type="number" value={form.reward_points} onChange={e => setForm(f => ({ ...f, reward_points: Number(e.target.value) }))} /></div>
            <div>
              <Label>{t('gamification.challenges.rewardBadge')}</Label>
              <Select value={form.reward_badge_id} onValueChange={v => setForm(f => ({ ...f, reward_badge_id: v }))}>
                <SelectTrigger><SelectValue placeholder={t('gamification.form.none')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('gamification.form.none')}</SelectItem>
                  {badges?.map(b => <SelectItem key={b.id} value={b.id}>{b.name_en}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <SectionHeader>{t('gamification.challenges.sectionSchedule')}</SectionHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t('gamification.challenges.startDate')} {t('gamification.form.required')}</Label><Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
            <div><Label>{t('gamification.challenges.endDate')} {t('gamification.form.required')}</Label><Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></div>
          </div>
          <div>
            <Label>{t('common.status')}</Label>
            <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">{t('gamification.challenges.draft')}</SelectItem>
                <SelectItem value="active">{t('common.active')}</SelectItem>
                <SelectItem value="ended">{t('gamification.challenges.ended')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={!form.name_en || !form.start_date || !form.end_date || isPending}>
            {isPending ? t('common.saving') : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChallengeDialog;
