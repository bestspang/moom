import React from 'react';
import { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import type { MemberWizardFormData } from './types';

interface StepMedicalProps {
  register: UseFormRegister<MemberWizardFormData>;
  setValue: UseFormSetValue<MemberWizardFormData>;
  watch: UseFormWatch<MemberWizardFormData>;
}

export const StepMedical: React.FC<StepMedicalProps> = ({ register, setValue, watch }) => {
  const { t } = useLanguage();
  const hasMedical = watch('hasMedicalConditions');
  const allowPhysical = watch('allowPhysicalContact');

  return (
    <div className="space-y-6">
      {/* Medical conditions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>{t('memberWizard.hasMedicalConditions')}</Label>
          <Switch
            checked={hasMedical || false}
            onCheckedChange={(v) => setValue('hasMedicalConditions', v)}
          />
        </div>
        {hasMedical && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">{t('memberWizard.medicalNotes')}</Label>
            <Textarea {...register('medicalNotes')} rows={3} />
          </div>
        )}
      </div>

      {/* Physical contact consent */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>{t('memberWizard.allowPhysicalContact')}</Label>
          <Switch
            checked={allowPhysical || false}
            onCheckedChange={(v) => setValue('allowPhysicalContact', v)}
          />
        </div>
        {allowPhysical === false && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">{t('memberWizard.physicalContactNotes')}</Label>
            <Textarea {...register('physicalContactNotes')} rows={3} />
          </div>
        )}
      </div>
    </div>
  );
};
