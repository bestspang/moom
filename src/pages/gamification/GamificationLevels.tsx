import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useGamificationLevels, useCreateGamificationLevel, useUpdateGamificationLevel, useDeleteGamificationLevel } from '@/hooks/useGamificationLevels';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface LevelForm {
  level_number: number;
  name_en: string;
  name_th: string;
  xp_required: number;
  badge_color: string;
  is_active: boolean;
}

const emptyForm: LevelForm = { level_number: 1, name_en: '', name_th: '', xp_required: 0, badge_color: '#6366f1', is_active: true };

const GamificationLevels = () => {
  const { t, language } = useLanguage();
  const { data: levels, isLoading } = useGamificationLevels();
  const createLevel = useCreateGamificationLevel();
  const updateLevel = useUpdateGamificationLevel();
  const deleteLevel = useDeleteGamificationLevel();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LevelForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    const nextNum = (levels?.length ?? 0) + 1;
    setEditingId(null);
    setForm({ ...emptyForm, level_number: nextNum });
    setDialogOpen(true);
  };

  const openEdit = (level: any) => {
    setEditingId(level.id);
    setForm({ level_number: level.level_number, name_en: level.name_en, name_th: level.name_th || '', xp_required: level.xp_required, badge_color: level.badge_color || '#6366f1', is_active: level.is_active });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const payload = { ...form, name_th: form.name_th || null, badge_color: form.badge_color || null, perks: [] };
    if (editingId) {
      updateLevel.mutate({ id: editingId, ...payload }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createLevel.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  if (isLoading) return <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{t('gamification.levels.description')}</p>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" />{t('gamification.levels.addLevel')}</Button>
      </div>

      {!levels?.length ? (
        <EmptyState icon={Plus} title={t('gamification.levels.noLevels')} description={t('gamification.levels.noLevelsDesc')} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {levels.map((level) => (
            <Card key={level.id} className="relative group">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: level.badge_color || 'hsl(var(--primary))' }}>
                    {level.level_number}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{language === 'th' && level.name_th ? level.name_th : level.name_en}</p>
                    <p className="text-xs text-muted-foreground">{level.xp_required.toLocaleString()} XP</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${level.is_active ? 'text-accent-teal' : 'text-muted-foreground'}`}>
                    {level.is_active ? t('common.active') : t('common.inactive')}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(level)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(level.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingId ? t('gamification.levels.editLevel') : t('gamification.levels.addLevel')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Level #</Label>
              <Input type="number" value={form.level_number} onChange={(e) => setForm(f => ({ ...f, level_number: Number(e.target.value) }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name (EN)</Label><Input value={form.name_en} onChange={(e) => setForm(f => ({ ...f, name_en: e.target.value }))} /></div>
              <div><Label>Name (TH)</Label><Input value={form.name_th} onChange={(e) => setForm(f => ({ ...f, name_th: e.target.value }))} /></div>
            </div>
            <div><Label>XP Required</Label><Input type="number" value={form.xp_required} onChange={(e) => setForm(f => ({ ...f, xp_required: Number(e.target.value) }))} /></div>
            <div><Label>{t('gamification.levels.color')}</Label><Input type="color" value={form.badge_color} onChange={(e) => setForm(f => ({ ...f, badge_color: e.target.value }))} className="h-9 w-16 p-1" /></div>
            <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm(f => ({ ...f, is_active: v }))} /><Label>{t('common.active')}</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={!form.name_en || createLevel.isPending || updateLevel.isPending}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t('common.confirmDelete')}</AlertDialogTitle><AlertDialogDescription>{t('gamification.levels.deleteConfirm')}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => { if (deleteId) deleteLevel.mutate(deleteId); setDeleteId(null); }}>{t('common.delete')}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GamificationLevels;
