import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Trash2, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateMember, useNextMemberId } from '@/hooks/useMembers';
import { useConvertLeadToMember } from '@/hooks/useLeads';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { StepIndicator } from './wizard/StepIndicator';
import { StepProfile } from './wizard/StepProfile';
import { StepContact } from './wizard/StepContact';
import { StepAddress } from './wizard/StepAddress';
import { StepEmergency } from './wizard/StepEmergency';
import { StepMedical } from './wizard/StepMedical';
import { StepOther } from './wizard/StepOther';
import { createMemberWizardSchema, STEP_FIELDS, TOTAL_STEPS } from './wizard/types';
import type { MemberWizardFormData } from './wizard/types';

const DRAFT_KEY = 'member-create-draft';

interface CreateMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<MemberWizardFormData>;
  convertLeadId?: string;
}

export const CreateMemberDialog: React.FC<CreateMemberDialogProps> = ({
  open,
  onOpenChange,
  initialData,
  convertLeadId,
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const createMember = useCreateMember();
  const convertLead = useConvertLeadToMember();
  const { data: nextMemberId, refetch: refetchMemberId } = useNextMemberId();
  const isMobile = useIsMobile();
  const [currentStep, setCurrentStep] = useState(1);
  const [stepError, setStepError] = useState('');

  const schema = useMemo(() => createMemberWizardSchema(t), [t]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<MemberWizardFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      hasMedicalConditions: false,
      allowPhysicalContact: true,
    },
  });

  const formValues = watch();

  const stepLabels = useMemo(() => [
    t('memberWizard.stepProfile'),
    t('memberWizard.stepContact'),
    t('memberWizard.stepAddress'),
    t('memberWizard.stepEmergency'),
    t('memberWizard.stepMedical'),
    t('memberWizard.stepOther'),
  ], [t]);

  // Draft save (debounced)
  useEffect(() => {
    if (!open) return;
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...formValues, _step: currentStep }));
      } catch {}
    }, 500);
    return () => clearTimeout(timeout);
  }, [formValues, open, currentStep]);

  // Restore draft or initialData + refetch ID on open
  useEffect(() => {
    if (open) {
      refetchMemberId();
      // If initialData provided (convert flow), prefill from lead
      if (initialData) {
        Object.entries(initialData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) setValue(key as any, value);
        });
        return;
      }
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          const draft = JSON.parse(saved);
          const { _step, ...fields } = draft;
          Object.entries(fields).forEach(([key, value]) => {
            if (value !== undefined && value !== null) setValue(key as any, value);
          });
          if (_step) setCurrentStep(_step);
          toast({ title: t('leads.draftRestored') });
        }
      } catch {}
    } else {
      setCurrentStep(1);
      setStepError('');
    }
  }, [open]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    reset({
      hasMedicalConditions: false,
      allowPhysicalContact: true,
    });
    setCurrentStep(1);
    setStepError('');
    onOpenChange(false);
  }, [reset, onOpenChange]);

  const handleNext = async () => {
    setStepError('');
    const fields = STEP_FIELDS[currentStep];
    const valid = await trigger(fields);
    if (!valid) {
      setStepError(t('memberWizard.completeRequired'));
      return;
    }
    // Special: step 2 needs refine check (phone or email)
    if (currentStep === 2) {
      const phone = formValues.phone?.trim();
      const email = formValues.email?.trim();
      if (!phone && !email) {
        setStepError(t('memberWizard.phoneOrEmailRequired'));
        return;
      }
    }
    setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    setStepError('');
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const onSubmit = async (data: MemberWizardFormData) => {
    try {
      const newMember = await createMember.mutateAsync({
        member_id: nextMemberId || 'M-0000001',
        first_name: data.firstName,
        last_name: data.lastName,
        nickname: data.nickname || null,
        email: data.email || null,
        phone: data.phone || null,
        date_of_birth: data.dateOfBirth || null,
        gender: data.gender || null,
        register_location_id: data.registerLocationId || null,
        address: data.address || null,
        emergency_contact_name: data.emergencyContactName || null,
        emergency_contact_phone: data.emergencyContactPhone || null,
        emergency_relationship: data.emergencyRelationship || null,
        medical: {
          has_conditions: data.hasMedicalConditions || false,
          notes: data.medicalNotes || '',
        } as any,
        consents: {
          allow_physical_contact: data.allowPhysicalContact ?? true,
          physical_contact_notes: data.physicalContactNotes || '',
        } as any,
        source: data.source || null,
        package_interest_id: data.packageInterestId || null,
        notes: data.notes || null,
        status: 'active',
        is_new: true,
      });

      // If converting from lead, update lead status
      if (convertLeadId && newMember?.id) {
        await convertLead.mutateAsync({ leadId: convertLeadId, memberId: newMember.id });
        toast({
          title: t('common.success'),
          description: t('leads.convertSuccess'),
        });
      } else {
        toast({
          title: t('common.success'),
          description: t('members.memberCreated'),
        });
      }

      localStorage.removeItem(DRAFT_KEY);
      onOpenChange(false);
      reset();
      setCurrentStep(1);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: error.message,
      });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepProfile
            register={register}
            setValue={setValue}
            errors={errors}
            watchGender={formValues.gender}
            watchLocationId={formValues.registerLocationId}
          />
        );
      case 2:
        return <StepContact register={register} errors={errors} />;
      case 3:
        return <StepAddress register={register} />;
      case 4:
        return <StepEmergency register={register} errors={errors} />;
      case 5:
        return <StepMedical register={register} setValue={setValue} watch={watch} />;
      case 6:
        return (
          <StepOther
            register={register}
            setValue={setValue}
            watchSource={formValues.source}
            watchPackageId={formValues.packageInterestId}
          />
        );
      default:
        return null;
    }
  };

  const FormContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
      <StepIndicator
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        stepLabels={stepLabels}
      />

      <div className="flex-1 overflow-y-auto py-4 px-1 min-h-0">
        {renderStep()}
      </div>

      {/* Error banner */}
      {stepError && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {stepError}
        </div>
      )}

      {/* Bottom bar */}
      <div className="flex items-center justify-between pt-4 border-t mt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearDraft}
          className="text-muted-foreground"
        >
          <Trash2 className="mr-1 h-4 w-4" />
          {t('leads.discardDraft')}
        </Button>
        <div className="flex gap-2">
          {currentStep > 1 && (
            <Button type="button" variant="outline" onClick={handleBack}>
              {t('common.back')}
            </Button>
          )}
          {currentStep < TOTAL_STEPS ? (
            <Button type="button" onClick={handleNext}>
              {t('common.next')}
            </Button>
          ) : (
            <Button type="submit" disabled={createMember.isPending}>
              {createMember.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.create')}
            </Button>
          )}
        </div>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-4 pb-6">
          <DrawerHeader className="text-left">
            <DrawerTitle>{t('members.createMember')}</DrawerTitle>
            <DrawerDescription>
              {nextMemberId && `ID: ${nextMemberId}`}
            </DrawerDescription>
          </DrawerHeader>
          <div className="max-h-[70vh] overflow-y-auto">
            {FormContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('members.createMember')}</DialogTitle>
          <DialogDescription>
            {nextMemberId && `ID: ${nextMemberId}`}
          </DialogDescription>
        </DialogHeader>
        {FormContent}
      </DialogContent>
    </Dialog>
  );
};
