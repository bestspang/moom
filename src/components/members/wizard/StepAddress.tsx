import React from 'react';
import { UseFormRegister } from 'react-hook-form';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import type { MemberWizardFormData } from './types';

interface StepAddressProps {
  register: UseFormRegister<MemberWizardFormData>;
}

export const StepAddress: React.FC<StepAddressProps> = ({ register }) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('form.address')}</Label>
        <Textarea {...register('address')} rows={4} placeholder={t('memberWizard.addressPlaceholder')} />
      </div>
    </div>
  );
};
