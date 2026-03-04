import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import type { MemberWizardFormData } from './types';

interface StepEmergencyProps {
  register: UseFormRegister<MemberWizardFormData>;
  errors: FieldErrors<MemberWizardFormData>;
}

export const StepEmergency: React.FC<StepEmergencyProps> = ({ register, errors }) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('memberWizard.emergencyName')}</Label>
        <Input {...register('emergencyContactName')} />
      </div>

      <div className="space-y-2">
        <Label>{t('memberWizard.emergencyPhone')}</Label>
        <Input
          {...register('emergencyContactPhone')}
          className={errors.emergencyContactPhone ? 'border-destructive' : ''}
        />
        {errors.emergencyContactPhone && (
          <p className="text-sm text-destructive">{errors.emergencyContactPhone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>{t('memberWizard.emergencyRelationship')}</Label>
        <Input {...register('emergencyRelationship')} placeholder={t('memberWizard.emergencyRelationshipPlaceholder')} />
      </div>
    </div>
  );
};
