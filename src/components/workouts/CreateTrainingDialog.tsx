import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateTraining } from '@/hooks/useTrainingTemplates';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const DRAFT_KEY = 'training-create-draft';

interface WorkoutRow {
  key: string;
  name: string;
  track_metric: string;
  unit: string;
  goal_type: string;
  description: string;
}

const emptyRow = (): WorkoutRow => ({
  key: crypto.randomUUID(),
  name: '',
  track_metric: '',
  unit: '',
  goal_type: '',
  description: '',
});

interface DraftState {
  trainingName: string;
  rows: WorkoutRow[];
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export const CreateTrainingDialog = ({ open, onOpenChange }: Props) => {
  const { t } = useLanguage();
  const createTraining = useCreateTraining();

  const [trainingName, setTrainingName] = useState('');
  const [rows, setRows] = useState<WorkoutRow[]>([emptyRow()]);
  const [draftRestored, setDraftRestored] = useState(false);

  // Restore draft
  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft: DraftState = JSON.parse(raw);
        setTrainingName(draft.trainingName ?? '');
        setRows(draft.rows?.length ? draft.rows : [emptyRow()]);
        setDraftRestored(true);
      }
    } catch {
      // ignore
    }
  }, [open]);

  // Autosave draft
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      const draft: DraftState = { trainingName, rows };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }, 500);
    return () => clearTimeout(timer);
  }, [trainingName, rows, open]);

  const resetForm = useCallback(() => {
    setTrainingName('');
    setRows([emptyRow()]);
    setDraftRestored(false);
    localStorage.removeItem(DRAFT_KEY);
  }, []);

  const updateRow = (key: string, field: keyof WorkoutRow, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, [field]: value } : r))
    );
  };

  const removeRow = (key: string) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.key !== key)));
  };

  const canSubmit = trainingName.trim().length > 0 && rows.some((r) => r.name.trim().length > 0);

  const handleConfirm = () => {
    createTraining.mutate(
      {
        name: trainingName.trim(),
        items: rows
          .filter((r) => r.name.trim())
          .map((r) => ({
            name: r.name.trim(),
            track_metric: r.track_metric || undefined,
            unit: r.unit || undefined,
            goal_type: r.goal_type || undefined,
            description: r.description || undefined,
          })),
      },
      {
        onSuccess: () => {
          resetForm();
          onOpenChange(false);
        },
      }
    );
  };

  const handleDiscard = () => {
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('workouts.createTraining')}</DialogTitle>
          <DialogDescription>{t('workouts.requiredFields')}</DialogDescription>
        </DialogHeader>

        {draftRestored && (
          <p className="text-xs text-muted-foreground italic">Draft restored</p>
        )}

        {/* Training name */}
        <div className="space-y-2">
          <Label>{t('workouts.trainingName')} *</Label>
          <Input
            value={trainingName}
            onChange={(e) => setTrainingName(e.target.value)}
            placeholder="e.g. CrossFit"
          />
        </div>

        {/* Workout rows */}
        <div className="space-y-3 mt-4">
          <Label>{t('workouts.workout')}</Label>
          {rows.map((row) => (
            <div key={row.key} className="grid grid-cols-12 gap-2 items-start">
              <Input
                className="col-span-3"
                placeholder={t('workouts.workout')}
                value={row.name}
                onChange={(e) => updateRow(row.key, 'name', e.target.value)}
              />
              <Select
                value={row.track_metric}
                onValueChange={(v) => updateRow(row.key, 'track_metric', v)}
              >
                <SelectTrigger className="col-span-2">
                  <SelectValue placeholder={t('workouts.trackMetric')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Time">Time</SelectItem>
                  <SelectItem value="Rounds + Reps">Rounds + Reps</SelectItem>
                  <SelectItem value="Weight">Weight</SelectItem>
                  <SelectItem value="Distance">Distance</SelectItem>
                  <SelectItem value="Reps">Reps</SelectItem>
                </SelectContent>
              </Select>
              <Input
                className="col-span-2"
                placeholder={t('workouts.unit')}
                value={row.unit}
                onChange={(e) => updateRow(row.key, 'unit', e.target.value)}
              />
              <Select
                value={row.goal_type}
                onValueChange={(v) => updateRow(row.key, 'goal_type', v)}
              >
                <SelectTrigger className="col-span-2">
                  <SelectValue placeholder={t('workouts.goalType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimize">{t('workouts.minimize')}</SelectItem>
                  <SelectItem value="maximize">{t('workouts.maximize')}</SelectItem>
                  <SelectItem value="target">{t('workouts.target')}</SelectItem>
                </SelectContent>
              </Select>
              <Input
                className="col-span-2"
                placeholder={t('workouts.description')}
                value={row.description}
                onChange={(e) => updateRow(row.key, 'description', e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="col-span-1"
                onClick={() => removeRow(row.key)}
                disabled={rows.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRows((prev) => [...prev, emptyRow()])}
          >
            <Plus className="h-4 w-4 mr-1" />
            {t('workouts.addWorkout')}
          </Button>
        </div>

        <DialogFooter className="mt-6 flex items-center justify-between gap-2">
          <Button variant="ghost" onClick={handleDiscard}>
            {t('workouts.discardDraft')}
          </Button>
          <Button onClick={handleConfirm} disabled={!canSubmit || createTraining.isPending}>
            {t('workouts.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
