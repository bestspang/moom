import React from 'react';
import { UseFormRegister } from 'react-hook-form';
import { Input } from '@/components/ui/input';
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
        <Label>{t('memberWizard.address1')}</Label>
        <Input {...register('address1')} placeholder={t('memberWizard.address1Placeholder')} />
      </div>
      <div className="space-y-2">
        <Label>{t('memberWizard.address2')}</Label>
        <Input {...register('address2')} placeholder={t('memberWizard.address2Placeholder')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('memberWizard.subdistrict')}</Label>
          <Input {...register('subdistrict')} placeholder={t('memberWizard.subdistrict')} />
        </div>
        <div className="space-y-2">
          <Label>{t('memberWizard.district')}</Label>
          <Input {...register('district')} placeholder={t('memberWizard.district')} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('memberWizard.province')}</Label>
          <Input {...register('province')} placeholder={t('memberWizard.province')} />
        </div>
        <div className="space-y-2">
          <Label>{t('memberWizard.postalCode')}</Label>
          <Input {...register('postalCode')} placeholder={t('memberWizard.postalCode')} />
        </div>
      </div>
    </div>
  );
};
