import React, { useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  personProfileSchema,
  personContactSchema,
  emergencyContactSchema,
  medicalInfoSchema,
  consentInfoSchema,
} from '@/lib/personSchemas';
import { Loader2, Trash2, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateLead } from '@/hooks/useLeads';
import { useLocations } from '@/hooks/useLocations';
import { usePackages } from '@/hooks/usePackages';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { toast } from 'sonner';

const DRAFT_KEY = 'lead-create-draft';

interface CreateLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SOURCE_OPTIONS = ['walk_in', 'referral', 'social_media', 'website', 'other'] as const;

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => (
  <Collapsible defaultOpen={defaultOpen}>
    <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium text-foreground hover:text-primary transition-colors group">
      {title}
      <ChevronDown className="h-4 w-4 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
    </CollapsibleTrigger>
    <CollapsibleContent className="space-y-4 pt-2">
      {children}
    </CollapsibleContent>
  </Collapsible>
);

export const CreateLeadDialog: React.FC<CreateLeadDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { t } = useLanguage();
  const createLead = useCreateLead();
  const { data: locations } = useLocations();
  const { data: packages } = usePackages();
  const isMobile = useIsMobile();

  const leadSchema = useMemo(() => personProfileSchema(t)
    .merge(personContactSchema(t))
    .merge(emergencyContactSchema())
    .merge(medicalInfoSchema())
    .merge(consentInfoSchema())
    .merge(z.object({
      source: z.string().optional(),
      registerLocationId: z.string().optional(),
      notes: z.string().max(2000).optional().or(z.literal('')),
      internalNotes: z.string().max(2000).optional().or(z.literal('')),
      address1: z.string().max(500).optional().or(z.literal('')),
      address2: z.string().max(500).optional().or(z.literal('')),
      subdistrict: z.string().max(100).optional().or(z.literal('')),
      district: z.string().max(100).optional().or(z.literal('')),
      province: z.string().max(100).optional().or(z.literal('')),
      postalCode: z.string().max(10).optional().or(z.literal('')),
      packageInterestId: z.string().optional(),
    }))
    .refine(
      (data) => (data.phone && data.phone.trim().length > 0) || (data.email && data.email.trim().length > 0),
      { message: t('leads.phoneOrEmailRequired'), path: ['phone'] }
    ), [t]);

  type LeadFormData = z.infer<typeof leadSchema>;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      hasMedicalConditions: false,
      allowPhysicalContact: false,
    },
  });

  const formValues = watch();
  const hasMedical = watch('hasMedicalConditions');
  const allowContact = watch('allowPhysicalContact');

  // Save draft on change
  useEffect(() => {
    if (!open) return;
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(formValues));
      } catch {
        // Ignore localStorage failures; draft persistence is best-effort.
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [formValues, open]);

  // Restore draft on open
  useEffect(() => {
    if (open) {
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          const draft = JSON.parse(saved) as LeadFormData;
          Object.entries(draft).forEach(([key, value]) => {
            if (value !== undefined && value !== null) setValue(key as any, value);
          });
          toast.info(t('leads.draftRestored'));
        }
      } catch {
        // Ignore malformed or unavailable draft data.
      }
    }
  }, [open, setValue, t]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    reset();
  }, [reset]);

  const onSubmit = async (data: LeadFormData) => {
    try {
      await createLead.mutateAsync({
        first_name: data.firstName,
        last_name: data.lastName || null,
        nickname: data.nickname || null,
        phone: data.phone || null,
        email: data.email?.toLowerCase().trim() || null,
        gender: data.gender || null,
        date_of_birth: data.dateOfBirth || null,
        source: data.source || null,
        register_location_id: data.registerLocationId || null,
        notes: data.notes || null,
        address_1: data.address1 || null,
        address_2: data.address2 || null,
        subdistrict: data.subdistrict || null,
        district: data.district || null,
        province: data.province || null,
        postal_code: data.postalCode || null,
        emergency_first_name: data.emergencyContactName || null,
        emergency_phone: data.emergencyContactPhone || null,
        emergency_relationship: data.emergencyRelationship || null,
        has_medical_conditions: data.hasMedicalConditions || false,
        medical_notes: data.medicalNotes || null,
        allow_physical_contact: data.allowPhysicalContact || false,
        physical_contact_notes: data.physicalContactNotes || null,
        internal_notes: data.internalNotes || null,
        package_interest_id: data.packageInterestId || null,
      } as any);

      localStorage.removeItem(DRAFT_KEY);
      onOpenChange(false);
      reset();
    } catch {
      // Error handled by mutation
    }
  };

  const FormContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <p className="text-xs text-muted-foreground mb-4">{t('form.requiredFieldsNote')}</p>

      {/* Profile — always open */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lead-firstName">{t('auth.firstName')} *</Label>
            <Input id="lead-firstName" {...register('firstName')} className={errors.firstName ? 'border-destructive' : ''} />
            {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead-lastName">{t('auth.lastName')}</Label>
            <Input id="lead-lastName" {...register('lastName')} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="lead-nickname">{t('form.nickname')}</Label>
          <Input id="lead-nickname" {...register('nickname')} />
        </div>
      </div>

      {/* Contact — always open */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lead-phone">{t('leads.contactNumber')} *</Label>
            <Input id="lead-phone" {...register('phone')} className={errors.phone ? 'border-destructive' : ''} />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead-email">{t('leads.email')}</Label>
            <Input id="lead-email" type="email" {...register('email')} className={`lowercase ${errors.email ? 'border-destructive' : ''}`} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">{t('leads.phoneOrEmailRequired')}</p>
      </div>

      {/* Gender & DOB */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lead-dob">{t('form.dateOfBirth')}</Label>
          <Input id="lead-dob" type="date" {...register('dateOfBirth')} />
        </div>
        <div className="space-y-2">
          <Label>{t('form.gender')}</Label>
          <Select onValueChange={(value) => setValue('gender', value as any)} value={formValues.gender || undefined}>
            <SelectTrigger><SelectValue placeholder={t('form.selectGender')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">{t('form.male')}</SelectItem>
              <SelectItem value="female">{t('form.female')}</SelectItem>
              <SelectItem value="other">{t('form.other')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Source & Location */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('leads.source')}</Label>
          <Select onValueChange={(value) => setValue('source', value)} value={formValues.source || undefined}>
            <SelectTrigger><SelectValue placeholder={t('leads.selectSource')} /></SelectTrigger>
            <SelectContent>
              {SOURCE_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{t(`leads.sourceOptions.${s}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t('lobby.location')} *</Label>
          <Select onValueChange={(value) => setValue('registerLocationId', value)} value={formValues.registerLocationId || undefined}>
            <SelectTrigger><SelectValue placeholder={t('leads.selectLocation')} /></SelectTrigger>
            <SelectContent>
              {locations?.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Address — collapsible */}
      <CollapsibleSection title={t('leads.addressSection')}>
        <div className="space-y-2">
          <Label>{t('leads.address1')}</Label>
          <Input {...register('address1')} />
        </div>
        <div className="space-y-2">
          <Label>{t('leads.address2')}</Label>
          <Input {...register('address2')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t('leads.subdistrict')}</Label>
            <Input {...register('subdistrict')} />
          </div>
          <div className="space-y-2">
            <Label>{t('leads.district')}</Label>
            <Input {...register('district')} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t('leads.province')}</Label>
            <Input {...register('province')} />
          </div>
          <div className="space-y-2">
            <Label>{t('leads.postalCode')}</Label>
            <Input {...register('postalCode')} />
          </div>
        </div>
      </CollapsibleSection>

      {/* Emergency Contact — collapsible */}
      <CollapsibleSection title={t('leads.emergencySection')}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t('leads.emergencyName')}</Label>
            <Input {...register('emergencyContactName')} />
          </div>
          <div className="space-y-2">
            <Label>{t('leads.emergencyPhone')}</Label>
            <Input {...register('emergencyContactPhone')} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>{t('leads.emergencyRelationship')}</Label>
          <Input {...register('emergencyRelationship')} />
        </div>
      </CollapsibleSection>

      {/* Medical — collapsible */}
      <CollapsibleSection title={t('leads.medicalSection')}>
        <div className="flex items-center gap-3">
          <Switch
            checked={hasMedical || false}
            onCheckedChange={(v) => setValue('hasMedicalConditions', v)}
          />
          <Label>{t('leads.hasMedicalConditions')}</Label>
        </div>
        {hasMedical && (
          <div className="space-y-2">
            <Label>{t('leads.medicalNotes')}</Label>
            <Textarea {...register('medicalNotes')} rows={2} />
          </div>
        )}
      </CollapsibleSection>

      {/* Consent — collapsible */}
      <CollapsibleSection title={t('leads.consentSection')}>
        <div className="flex items-center gap-3">
          <Switch
            checked={allowContact || false}
            onCheckedChange={(v) => setValue('allowPhysicalContact', v)}
          />
          <Label>{t('leads.allowPhysicalContact')}</Label>
        </div>
        {allowContact && (
          <div className="space-y-2">
            <Label>{t('leads.physicalContactNotes')}</Label>
            <Textarea {...register('physicalContactNotes')} rows={2} />
          </div>
        )}
      </CollapsibleSection>

      {/* Other — collapsible */}
      <CollapsibleSection title={t('leads.otherSection')}>
        <div className="space-y-2">
          <Label>{t('leads.packageInterest')}</Label>
          <Select onValueChange={(value) => setValue('packageInterestId', value)} value={formValues.packageInterestId || undefined}>
            <SelectTrigger><SelectValue placeholder={t('leads.selectPackage')} /></SelectTrigger>
            <SelectContent>
              {packages?.map((pkg) => (
                <SelectItem key={pkg.id} value={pkg.id}>{pkg.name_en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t('leads.internalNotes')}</Label>
          <Textarea {...register('internalNotes')} rows={2} />
        </div>
        <div className="space-y-2">
          <Label>{t('leads.notes')}</Label>
          <Textarea {...register('notes')} rows={2} />
        </div>
      </CollapsibleSection>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="ghost" size="sm" onClick={clearDraft} className="text-muted-foreground">
          <Trash2 className="mr-1 h-4 w-4" />
          {t('leads.discardDraft')}
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={createLead.isPending}>
            {createLead.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('common.create')}
          </Button>
        </div>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-4 pb-6">
          <DrawerHeader className="text-left">
            <DrawerTitle>{t('leads.createLead')}</DrawerTitle>
            <DrawerDescription>{t('leads.createLeadDesc')}</DrawerDescription>
          </DrawerHeader>
          <div className="max-h-[70vh] overflow-y-auto px-1">
            {FormContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('leads.createLead')}</DialogTitle>
          <DialogDescription>{t('leads.createLeadDesc')}</DialogDescription>
        </DialogHeader>
        {FormContent}
      </DialogContent>
    </Dialog>
  );
};
