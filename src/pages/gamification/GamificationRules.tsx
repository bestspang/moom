import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useGamificationRules, useCreateGamificationRule, useUpdateGamificationRule, useDeleteGamificationRule } from '@/hooks/useGamificationRules';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface RuleForm {
  action_key: string;
  label_en: string;
  label_th: string;
  xp_value: number;
  points_value: number;
  cooldown_minutes: number;
  max_per_day: number | null;
  is_active: boolean;
  sort_order: number;
}

const emptyForm: RuleForm = { action_key: '', label_en: '', label_th: '', xp_value: 0, points_value: 0, cooldown_minutes: 0, max_per_day: null, is_active: true, sort_order: 0 };

const GamificationRules = () => {
  const { t, language } = useLanguage();
  const { data: rules, isLoading } = useGamificationRules();
  const createRule = useCreateGamificationRule();
  const updateRule = useUpdateGamificationRule();
  const deleteRule = useDeleteGamificationRule();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RuleForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (rule: any) => {
    setEditingId(rule.id);
    setForm({ action_key: rule.action_key, label_en: rule.label_en, label_th: rule.label_th || '', xp_value: rule.xp_value, points_value: rule.points_value, cooldown_minutes: rule.cooldown_minutes || 0, max_per_day: rule.max_per_day, is_active: rule.is_active, sort_order: rule.sort_order });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const payload = { ...form, label_th: form.label_th || null, max_per_day: form.max_per_day || null };
    if (editingId) {
      updateRule.mutate({ id: editingId, ...payload }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createRule.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  if (isLoading) return <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{t('gamification.rules.description')}</p>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" />{t('gamification.rules.addRule')}</Button>
      </div>

      {!rules?.length ? (
        <EmptyState icon={<Plus className="h-12 w-12" />} message={t('gamification.rules.noRules')} description={t('gamification.rules.noRulesDesc')} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium">{t('gamification.rules.action')}</th>
                    <th className="text-left p-3 font-medium">{t('gamification.rules.label')}</th>
                    <th className="text-right p-3 font-medium">XP</th>
                    <th className="text-right p-3 font-medium">{t('gamification.rules.points')}</th>
                    <th className="text-right p-3 font-medium">{t('gamification.rules.cooldown')}</th>
                    <th className="text-right p-3 font-medium">{t('gamification.rules.maxDay')}</th>
                    <th className="text-center p-3 font-medium">{t('common.status')}</th>
                    <th className="text-right p-3 font-medium">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono text-xs">{rule.action_key}</td>
                      <td className="p-3">{language === 'th' && rule.label_th ? rule.label_th : rule.label_en}</td>
                      <td className="p-3 text-right font-medium">{rule.xp_value}</td>
                      <td className="p-3 text-right font-medium">{rule.points_value}</td>
                      <td className="p-3 text-right text-muted-foreground">{rule.cooldown_minutes ? `${rule.cooldown_minutes}m` : '—'}</td>
                      <td className="p-3 text-right text-muted-foreground">{rule.max_per_day ?? '∞'}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-block w-2 h-2 rounded-full ${rule.is_active ? 'bg-accent-teal' : 'bg-muted-foreground'}`} />
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(rule)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(rule.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingId ? t('gamification.rules.editRule') : t('gamification.rules.addRule')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{t('gamification.rules.action')}</Label><Input value={form.action_key} onChange={(e) => setForm(f => ({ ...f, action_key: e.target.value }))} placeholder="e.g. check_in" disabled={!!editingId} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Label (EN)</Label><Input value={form.label_en} onChange={(e) => setForm(f => ({ ...f, label_en: e.target.value }))} /></div>
              <div><Label>Label (TH)</Label><Input value={form.label_th} onChange={(e) => setForm(f => ({ ...f, label_th: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>XP</Label><Input type="number" value={form.xp_value} onChange={(e) => setForm(f => ({ ...f, xp_value: Number(e.target.value) }))} /></div>
              <div><Label>{t('gamification.rules.points')}</Label><Input type="number" value={form.points_value} onChange={(e) => setForm(f => ({ ...f, points_value: Number(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t('gamification.rules.cooldown')} (min)</Label><Input type="number" value={form.cooldown_minutes} onChange={(e) => setForm(f => ({ ...f, cooldown_minutes: Number(e.target.value) }))} /></div>
              <div><Label>{t('gamification.rules.maxDay')}</Label><Input type="number" value={form.max_per_day ?? ''} onChange={(e) => setForm(f => ({ ...f, max_per_day: e.target.value ? Number(e.target.value) : null }))} placeholder="∞" /></div>
            </div>
            <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm(f => ({ ...f, is_active: v }))} /><Label>{t('common.active')}</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={!form.action_key || !form.label_en || createRule.isPending || updateRule.isPending}>
              {(createRule.isPending || updateRule.isPending) ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t('common.confirmDelete')}</AlertDialogTitle><AlertDialogDescription>{t('gamification.rules.deleteConfirm')}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => { if (deleteId) deleteRule.mutate(deleteId); setDeleteId(null); }}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GamificationRules;
