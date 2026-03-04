import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUpdateTraining, type TrainingTemplateRow } from '@/hooks/useTrainingTemplates';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  training: TrainingTemplateRow;
}

export const EditTrainingNameDialog = ({ open, onOpenChange, training }: Props) => {
  const { t } = useLanguage();
  const updateTraining = useUpdateTraining();
  const [name, setName] = useState(training.name);

  const canSubmit = name.trim().length > 0 && name.trim() !== training.name;

  const handleSave = () => {
    updateTraining.mutate(
      { id: training.id, name: name.trim() },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('workouts.editTraining')}</DialogTitle>
          <DialogDescription>{t('workouts.editTrainingDesc')}</DialogDescription>
        </DialogHeader>
        <div>
          <Label>{t('workouts.trainingName')} *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={!canSubmit || updateTraining.isPending}>
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
