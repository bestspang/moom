import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGamificationQuests, useCreateQuestTemplate, useUpdateQuestTemplate, useDeleteQuestTemplate, type QuestTemplate } from '@/hooks/useGamificationQuests';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DataTable } from '@/components/common/DataTable';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { FilterChips } from '@/apps/shared/components/FilterChips';

const PERIOD_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'seasonal', label: 'Seasonal' },
];

interface QuestForm {
  name_en: string;
  name_th: string;
  description_en: string;
  description_th: string;
  audience_type: string;
  quest_period: string;
  goal_type: string;
  goal_action_key: string;
  goal_value: number;
  xp_reward: number;
  coin_reward: number;
  is_active: boolean;
  sort_order: number;
}

const emptyForm: QuestForm = {
  name_en: '', name_th: '', description_en: '', description_th: '',
  audience_type: 'member', quest_period: 'daily', goal_type: 'action_count',
  goal_action_key: '', goal_value: 1, xp_reward: 0, coin_reward: 0,
  is_active: true, sort_order: 0,
};

const GamificationQuests = () => {
  const { t } = useLanguage();
  const { data: quests, isLoading } = useGamificationQuests();
  const create = useCreateQuestTemplate();
  const update = useUpdateQuestTemplate();
  const del = useDeleteQuestTemplate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<QuestTemplate | null>(null);
  const [form, setForm] = useState<QuestForm>(emptyForm);
  const [periodFilter, setPeriodFilter] = useState('all');

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (q: QuestTemplate) => {
    setEditing(q);
    setForm({
      name_en: q.name_en, name_th: q.name_th || '', description_en: q.description_en || '',
      description_th: q.description_th || '', audience_type: q.audience_type,
      quest_period: q.quest_period, goal_type: q.goal_type,
      goal_action_key: q.goal_action_key || '', goal_value: q.goal_value,
      xp_reward: q.xp_reward, coin_reward: q.coin_reward,
      is_active: q.is_active, sort_order: q.sort_order,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const payload = { ...form, name_th: form.name_th || null, description_en: form.description_en || null, description_th: form.description_th || null, goal_action_key: form.goal_action_key || null };
    if (editing) {
      update.mutate({ id: editing.id, ...payload }, { onSuccess: () => setDialogOpen(false) });
    } else {
      create.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const filtered = (quests ?? []).filter(q => periodFilter === 'all' || q.quest_period === periodFilter);
  const isPending = create.isPending || update.isPending;

  if (isLoading) return <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Manage daily, weekly, monthly, and seasonal quest templates.</p>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Add Quest</Button>
      </div>

      <FilterChips options={PERIOD_FILTERS} selected={periodFilter} onChange={setPeriodFilter} />

      {filtered.length === 0 ? (
        <EmptyState message="No quest templates" description="Create your first quest template to start assigning quests to members." />
      ) : (
        <DataTable
          data={filtered}
          rowKey={(r: QuestTemplate) => r.id}
          columns={[
            { key: 'name', header: 'Name', cell: (r: QuestTemplate) => r.name_en },
            { key: 'period', header: 'Period', cell: (r: QuestTemplate) => <StatusBadge>{r.quest_period}</StatusBadge> },
            { key: 'audience', header: 'Audience', cell: (r: QuestTemplate) => r.audience_type },
            { key: 'goal', header: 'Goal', cell: (r: QuestTemplate) => `${r.goal_action_key || r.goal_type} × ${r.goal_value}` },
            { key: 'xp', header: 'XP', cell: (r: QuestTemplate) => r.xp_reward },
            { key: 'coin', header: 'Coin', cell: (r: QuestTemplate) => r.coin_reward },
            { key: 'active', header: 'Active', cell: (r: QuestTemplate) => r.is_active ? '✅' : '—' },
            { key: 'actions', header: '', cell: (r: QuestTemplate) => (
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
            <DialogTitle>{editing ? 'Edit Quest Template' : 'Create Quest Template'}</DialogTitle>
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
                <Label>Period</Label>
                <Select value={form.quest_period} onValueChange={v => setForm(f => ({ ...f, quest_period: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="seasonal">Seasonal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Audience</Label>
                <Select value={form.audience_type} onValueChange={v => setForm(f => ({ ...f, audience_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="trainer_inhouse">Trainer (In-house)</SelectItem>
                    <SelectItem value="trainer_freelance">Trainer (Freelance)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Goal Type</Label>
                <Select value={form.goal_type} onValueChange={v => setForm(f => ({ ...f, goal_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="action_count">Action Count</SelectItem>
                    <SelectItem value="xp_threshold">XP Threshold</SelectItem>
                    <SelectItem value="class_count">Class Count</SelectItem>
                    <SelectItem value="streak">Streak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Action Key</Label><Input value={form.goal_action_key} onChange={e => setForm(f => ({ ...f, goal_action_key: e.target.value }))} placeholder="e.g. check_in" /></div>
              <div><Label>Goal Value</Label><Input type="number" value={form.goal_value} onChange={e => setForm(f => ({ ...f, goal_value: Number(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>XP Reward</Label><Input type="number" value={form.xp_reward} onChange={e => setForm(f => ({ ...f, xp_reward: Number(e.target.value) }))} /></div>
              <div><Label>Coin Reward</Label><Input type="number" value={form.coin_reward} onChange={e => setForm(f => ({ ...f, coin_reward: Number(e.target.value) }))} /></div>
              <div><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} /></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <Label>{t('common.active')}</Label>
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

export default GamificationQuests;
