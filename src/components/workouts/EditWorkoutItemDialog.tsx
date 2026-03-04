import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUpdateWorkoutItem, type WorkoutItemRow } from '@/hooks/useTrainingTemplates';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: WorkoutItemRow;
}

export const EditWorkoutItemDialog = ({ open, onOpenChange, item }: Props) => {
  const { t } = useLanguage();
  const updateItem = useUpdateWorkoutItem();

  const [name, setName] = useState(item.name);
  const [trackMetric, setTrackMetric] = useState(item.track_metric ?? '');
  const [unit, setUnit] = useState(item.unit ?? '');
  const [goalType, setGoalType] = useState(item.goal_type ?? '');
  const [description, setDescription] = useState(item.description ?? '');

  const canSubmit = name.trim().length > 0;

  const handleSave = () => {
    updateItem.mutate(
      {
        id: item.id,
        name: name.trim(),
        track_metric: trackMetric || undefined,
        unit: unit || undefined,
        goal_type: goalType || undefined,
        description: description || undefined,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('workouts.editWorkout')}</DialogTitle>
          <DialogDescription>{t('workouts.editWorkoutDesc')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>{t('workouts.workout')} *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>{t('workouts.trackMetric')}</Label>
            <Select value={trackMetric} onValueChange={setTrackMetric}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Time">Time</SelectItem>
                <SelectItem value="Rounds + Reps">Rounds + Reps</SelectItem>
                <SelectItem value="Weight">Weight</SelectItem>
                <SelectItem value="Distance">Distance</SelectItem>
                <SelectItem value="Reps">Reps</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('workouts.unit')}</Label>
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
          </div>
          <div>
            <Label>{t('workouts.goalType')}</Label>
            <Select value={goalType} onValueChange={setGoalType}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="minimize">{t('workouts.minimize')}</SelectItem>
                <SelectItem value="maximize">{t('workouts.maximize')}</SelectItem>
                <SelectItem value="target">{t('workouts.target')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('workouts.description')}</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={!canSubmit || updateItem.isPending}>
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
