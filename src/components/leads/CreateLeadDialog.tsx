import React, { useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  personProfileSchema,
  personContactSchema,
  personAddressSchema,
} from '@/lib/personSchemas';
import { Loader2, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateLead } from '@/hooks/useLeads';
import { useLocations } from '@/hooks/useLocations';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

export const CreateLeadDialog: React.FC<CreateLeadDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { t } = useLanguage();
  const createLead = useCreateLead();
  const { data: locations } = useLocations();
  const isMobile = useIsMobile();

  const leadSchema = useMemo(() => personProfileSchema(t)
    .merge(personContactSchema(t))
    .merge(personAddressSchema())
    .merge(z.object({
      source: z.string().optional(),
      registerLocationId: z.string().optional(),
      notes: z.string().max(2000).optional(),
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
  });

  const formValues = watch();

  // Save draft on change
  useEffect(() => {
    if (!open) return;
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(formValues));
      } catch {}
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
            if (value) setValue(key as any, value);
          });
          toast.info(t('leads.draftRestored'));
        }
      } catch {}
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
        email: data.email || null,
        gender: data.gender || null,
        date_of_birth: data.dateOfBirth || null,
        source: data.source || null,
        register_location_id: data.registerLocationId || null,
        address: data.address || null,
        notes: data.notes || null,
      });

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

      {/* Name */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lead-firstName">{t('auth.firstName')} *</Label>
          <Input
            id="lead-firstName"
            {...register('firstName')}
            className={errors.firstName ? 'border-destructive' : ''}
          />
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

      {/* Contact */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lead-phone">{t('leads.contactNumber')} *</Label>
          <Input
            id="lead-phone"
            {...register('phone')}
            className={errors.phone ? 'border-destructive' : ''}
          />
          {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lead-email">{t('leads.email')}</Label>
          <Input
            id="lead-email"
            type="email"
            {...register('email')}
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">{t('leads.phoneOrEmailRequired')}</p>

      {/* Gender & DOB */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lead-dob">{t('form.dateOfBirth')}</Label>
          <Input id="lead-dob" type="date" {...register('dateOfBirth')} />
        </div>
        <div className="space-y-2">
          <Label>{t('form.gender')}</Label>
          <Select onValueChange={(value) => setValue('gender', value as any)}>
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

      {/* Source & Location */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('leads.source')}</Label>
          <Select onValueChange={(value) => setValue('source', value)}>
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
          <Label>{t('lobby.location')}</Label>
          <Select onValueChange={(value) => setValue('registerLocationId', value)}>
            <SelectTrigger>
              <SelectValue placeholder={t('leads.selectLocation')} />
            </SelectTrigger>
            <SelectContent>
              {locations?.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="lead-address">{t('form.address')}</Label>
        <Input id="lead-address" {...register('address')} />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="lead-notes">{t('leads.notes')}</Label>
        <Textarea id="lead-notes" {...register('notes')} rows={3} />
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4">
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
