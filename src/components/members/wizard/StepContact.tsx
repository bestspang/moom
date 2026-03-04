import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import type { MemberWizardFormData } from './types';

interface StepContactProps {
  register: UseFormRegister<MemberWizardFormData>;
  errors: FieldErrors<MemberWizardFormData>;
}

export const StepContact: React.FC<StepContactProps> = ({ register, errors }) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('leads.contactNumber')}</Label>
        <Input
          {...register('phone')}
          className={errors.phone ? 'border-destructive' : ''}
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>{t('auth.email')}</Label>
        <Input
          type="email"
          {...register('email')}
          className={errors.email ? 'border-destructive' : ''}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{t('memberWizard.phoneOrEmailRequired')}</p>

      {/* LINE Link placeholder */}
      <div className="rounded-lg border border-dashed p-4 space-y-2">
        <Label className="text-muted-foreground">LINE</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" disabled className="w-full">
                {t('memberWizard.linkLine')}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('memberWizard.linkLineTooltip')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
