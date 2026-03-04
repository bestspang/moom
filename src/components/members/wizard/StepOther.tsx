import React from 'react';
import { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePackages } from '@/hooks/usePackages';
import type { MemberWizardFormData } from './types';

const SOURCE_OPTIONS = ['walk_in', 'referral', 'social_media', 'website', 'other'] as const;

interface StepOtherProps {
  register: UseFormRegister<MemberWizardFormData>;
  setValue: UseFormSetValue<MemberWizardFormData>;
  watchSource?: string;
  watchPackageId?: string;
}

export const StepOther: React.FC<StepOtherProps> = ({ register, setValue, watchSource, watchPackageId }) => {
  const { t, language } = useLanguage();
  const { data: packages } = usePackages('on_sale');

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('leads.source')}</Label>
        <Select value={watchSource || ''} onValueChange={(v) => setValue('source', v)}>
          <SelectTrigger>
            <SelectValue placeholder={t('leads.selectSource')} />
          </SelectTrigger>
          <SelectContent>
            {SOURCE_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>{t(`leads.sourceOptions.${s}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t('memberWizard.packageInterest')}</Label>
        <Select value={watchPackageId || ''} onValueChange={(v) => setValue('packageInterestId', v)}>
          <SelectTrigger>
            <SelectValue placeholder={t('memberWizard.selectPackage')} />
          </SelectTrigger>
          <SelectContent>
            {packages?.map((pkg) => (
              <SelectItem key={pkg.id} value={pkg.id}>
                {language === 'th' ? (pkg.name_th || pkg.name_en) : pkg.name_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t('memberWizard.internalNotes')}</Label>
        <Textarea {...register('notes')} rows={3} placeholder={t('memberWizard.internalNotesPlaceholder')} />
      </div>
    </div>
  );
};
