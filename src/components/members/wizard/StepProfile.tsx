import React from 'react';
import { UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { Camera } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocations } from '@/hooks/useLocations';
import type { MemberWizardFormData } from './types';

interface StepProfileProps {
  register: UseFormRegister<MemberWizardFormData>;
  setValue: UseFormSetValue<MemberWizardFormData>;
  errors: FieldErrors<MemberWizardFormData>;
  watchGender?: string;
  watchLocationId?: string;
}

export const StepProfile: React.FC<StepProfileProps> = ({
  register,
  setValue,
  errors,
  watchGender,
  watchLocationId,
}) => {
  const { t } = useLanguage();
  const { data: locations } = useLocations();

  return (
    <div className="space-y-4">
      {/* Photo placeholder */}
      <div className="flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Camera className="h-8 w-8 text-muted-foreground" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('auth.firstName')} *</Label>
          <Input
            {...register('firstName')}
            className={errors.firstName ? 'border-destructive' : ''}
          />
          {errors.firstName && (
            <p className="text-sm text-destructive">{errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>{t('auth.lastName')} *</Label>
          <Input
            {...register('lastName')}
            className={errors.lastName ? 'border-destructive' : ''}
          />
          {errors.lastName && (
            <p className="text-sm text-destructive">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('form.nickname')}</Label>
        <Input {...register('nickname')} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('form.dateOfBirth')}</Label>
          <Input type="date" {...register('dateOfBirth')} />
        </div>
        <div className="space-y-2">
          <Label>{t('form.gender')}</Label>
          <Select
            value={watchGender || ''}
            onValueChange={(v) => setValue('gender', v as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('form.selectGender')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">{t('form.male')}</SelectItem>
              <SelectItem value="female">{t('form.female')}</SelectItem>
              <SelectItem value="other">{t('form.other')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('memberWizard.registerLocation')} *</Label>
        <Select
          value={watchLocationId || ''}
          onValueChange={(v) => setValue('registerLocationId', v)}
        >
          <SelectTrigger className={errors.registerLocationId ? 'border-destructive' : ''}>
            <SelectValue placeholder={t('leads.selectLocation')} />
          </SelectTrigger>
          <SelectContent>
            {locations?.map((loc) => (
              <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.registerLocationId && (
          <p className="text-sm text-destructive">{errors.registerLocationId.message}</p>
        )}
      </div>
    </div>
  );
};
