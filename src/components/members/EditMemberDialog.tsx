import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUpdateMember } from '@/hooks/useMembers';
import { useLocations } from '@/hooks/useLocations';
import { usePackages } from '@/hooks/usePackages';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
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

type Member = Database['public']['Tables']['members']['Row'];

type EditMemberFormData = {
  firstName: string;
  lastName: string;
  nickname?: string;
  email?: string;
  phone?: string;
  lineId?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  registerLocationId?: string;
  status: 'active' | 'suspended' | 'on_hold' | 'inactive';
  // Address
  address1?: string;
  address2?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  // Emergency
  emergencyFirstName?: string;
  emergencyLastName?: string;
  emergencyPhone?: string;
  emergencyRelationship?: string;
  // Medical
  hasMedicalConditions?: boolean;
  medicalNotes?: string;
  // Consent
  allowPhysicalContact?: boolean;
  physicalContactNotes?: string;
  // Other
  source?: string;
  packageInterestId?: string;
  notes?: string;
};

interface EditMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
}

export const EditMemberDialog: React.FC<EditMemberDialogProps> = ({
  open,
  onOpenChange,
  member,
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const updateMember = useUpdateMember();
  const { data: locations } = useLocations();
  const { data: packages } = usePackages();

  const memberSchema = useMemo(() => z.object({
    firstName: z.string().min(1, t('validation.firstNameRequired')).max(100),
    lastName: z.string().min(1, t('validation.lastNameRequired')).max(100),
    nickname: z.string().max(50).optional(),
    email: z.string().email(t('validation.invalidEmail')).optional().or(z.literal('')),
    phone: z.string().max(20).optional(),
    lineId: z.string().max(100).optional(),
    dateOfBirth: z.string().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    registerLocationId: z.string().optional(),
    status: z.enum(['active', 'suspended', 'on_hold', 'inactive']),
    address1: z.string().max(200).optional(),
    address2: z.string().max(200).optional(),
    subdistrict: z.string().max(100).optional(),
    district: z.string().max(100).optional(),
    province: z.string().max(100).optional(),
    postalCode: z.string().max(10).optional(),
    emergencyFirstName: z.string().max(100).optional(),
    emergencyLastName: z.string().max(100).optional(),
    emergencyPhone: z.string().max(20).optional(),
    emergencyRelationship: z.string().max(100).optional(),
    hasMedicalConditions: z.boolean().optional(),
    medicalNotes: z.string().max(2000).optional(),
    allowPhysicalContact: z.boolean().optional(),
    physicalContactNotes: z.string().max(2000).optional(),
    source: z.string().optional(),
    packageInterestId: z.string().optional(),
    notes: z.string().max(2000).optional(),
  }), [t]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditMemberFormData>({
    resolver: zodResolver(memberSchema),
  });

  const hasMedical = watch('hasMedicalConditions');
  const allowPhysical = watch('allowPhysicalContact');

  useEffect(() => {
    if (member && open) {
      const m = member as any;
      reset({
        firstName: member.first_name,
        lastName: member.last_name,
        nickname: member.nickname || '',
        email: member.email || '',
        phone: member.phone || '',
        lineId: m.line_id || '',
        dateOfBirth: member.date_of_birth || '',
        gender: member.gender || undefined,
        registerLocationId: member.register_location_id || '',
        status: member.status || 'active',
        address1: member.address_1 || '',
        address2: member.address_2 || '',
        subdistrict: member.subdistrict || '',
        district: member.district || '',
        province: member.province || '',
        postalCode: member.postal_code || '',
        emergencyFirstName: m.emergency_first_name || member.emergency_contact_name || '',
        emergencyLastName: m.emergency_last_name || '',
        emergencyPhone: m.emergency_phone || member.emergency_contact_phone || '',
        emergencyRelationship: member.emergency_relationship || '',
        hasMedicalConditions: m.has_medical_conditions ?? false,
        medicalNotes: m.medical_notes || '',
        allowPhysicalContact: m.allow_physical_contact ?? false,
        physicalContactNotes: m.physical_contact_notes || '',
        source: member.source || '',
        packageInterestId: member.package_interest_id || '',
        notes: member.notes || '',
      });
    }
  }, [member, open, reset]);

  const onSubmit = async (data: EditMemberFormData) => {
    if (!member) return;

    try {
      await updateMember.mutateAsync({
        id: member.id,
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          nickname: data.nickname || null,
          email: data.email || null,
          phone: data.phone || null,
          date_of_birth: data.dateOfBirth || null,
          gender: data.gender || null,
          register_location_id: data.registerLocationId || null,
          status: data.status,
          address_1: data.address1 || null,
          address_2: data.address2 || null,
          subdistrict: data.subdistrict || null,
          district: data.district || null,
          province: data.province || null,
          postal_code: data.postalCode || null,
          // Flat emergency columns
          emergency_first_name: data.emergencyFirstName || null,
          emergency_last_name: data.emergencyLastName || null,
          emergency_phone: data.emergencyPhone || null,
          emergency_relationship: data.emergencyRelationship || null,
          // Keep legacy for backward compat
          emergency_contact_name: [data.emergencyFirstName, data.emergencyLastName].filter(Boolean).join(' ') || null,
          emergency_contact_phone: data.emergencyPhone || null,
          // Flat medical/consent columns
          has_medical_conditions: data.hasMedicalConditions ?? false,
          medical_notes: data.medicalNotes || null,
          allow_physical_contact: data.allowPhysicalContact ?? false,
          physical_contact_notes: data.physicalContactNotes || null,
          // Other
          source: data.source || null,
          package_interest_id: data.packageInterestId || null,
          notes: data.notes || null,
          line_id: (data as any).lineId || null,
        } as any,
      });

      toast({
        title: t('common.success'),
        description: t('members.memberUpdated'),
      });
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: error.message,
      });
    }
  };

  const SectionHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
      {children}
      <ChevronDown className="h-4 w-4" />
    </CollapsibleTrigger>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('members.editMember')}</DialogTitle>
          <DialogDescription>
            {member?.member_id}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Profile */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t('auth.firstName')} *</Label>
              <Input id="firstName" {...register('firstName')} className={errors.firstName ? 'border-destructive' : ''} />
              {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{t('auth.lastName')} *</Label>
              <Input id="lastName" {...register('lastName')} className={errors.lastName ? 'border-destructive' : ''} />
              {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nickname">{t('form.nickname')}</Label>
            <Input id="nickname" {...register('nickname')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">{t('form.dateOfBirth')}</Label>
              <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
            </div>
            <div className="space-y-2">
              <Label>{t('form.gender')}</Label>
              <Select defaultValue={member?.gender || undefined} onValueChange={(v) => setValue('gender', v as any)}>
                <SelectTrigger><SelectValue placeholder={t('form.selectGender')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t('form.male')}</SelectItem>
                  <SelectItem value="female">{t('form.female')}</SelectItem>
                  <SelectItem value="other">{t('form.other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('common.status')}</Label>
              <Select defaultValue={member?.status || 'active'} onValueChange={(v) => setValue('status', v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('common.active')}</SelectItem>
                  <SelectItem value="suspended">{t('members.suspended')}</SelectItem>
                  <SelectItem value="on_hold">{t('members.onHold')}</SelectItem>
                  <SelectItem value="inactive">{t('common.inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('lobby.location')}</Label>
              <Select defaultValue={member?.register_location_id || undefined} onValueChange={(v) => setValue('registerLocationId', v)}>
                <SelectTrigger><SelectValue placeholder={t('form.selectLocation')} /></SelectTrigger>
                <SelectContent>
                  {locations?.map(loc => (
                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contact */}
          <Collapsible defaultOpen>
            <SectionHeader>{t('memberWizard.stepContact')}</SectionHeader>
            <CollapsibleContent className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label htmlFor="phone">{t('leads.contactNumber')}</Label>
                <Input id="phone" {...register('phone')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input id="email" type="email" {...register('email')} className={errors.email ? 'border-destructive' : ''} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lineId">LINE ID</Label>
                <Input id="lineId" {...register('lineId')} placeholder="@line_username" />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Address */}
          <Collapsible>
            <SectionHeader>{t('memberWizard.stepAddress')}</SectionHeader>
            <CollapsibleContent className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label>{t('form.address1')}</Label>
                <Input {...register('address1')} />
              </div>
              <div className="space-y-2">
                <Label>{t('form.address2')}</Label>
                <Input {...register('address2')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t('form.subdistrict')}</Label>
                  <Input {...register('subdistrict')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('form.district')}</Label>
                  <Input {...register('district')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t('form.province')}</Label>
                  <Input {...register('province')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('form.postalCode')}</Label>
                  <Input {...register('postalCode')} />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Emergency */}
          <Collapsible>
            <SectionHeader>{t('memberWizard.stepEmergency')}</SectionHeader>
            <CollapsibleContent className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t('form.firstName')}</Label>
                  <Input {...register('emergencyFirstName')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('form.lastName')}</Label>
                  <Input {...register('emergencyLastName')} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('memberWizard.emergencyPhone')}</Label>
                <Input {...register('emergencyPhone')} />
              </div>
              <div className="space-y-2">
                <Label>{t('memberWizard.emergencyRelationship')}</Label>
                <Input {...register('emergencyRelationship')} />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Medical & Consent */}
          <Collapsible>
            <SectionHeader>{t('memberWizard.stepMedical')}</SectionHeader>
            <CollapsibleContent className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <Label>{t('memberWizard.hasMedicalConditions')}</Label>
                <Switch checked={hasMedical || false} onCheckedChange={(v) => setValue('hasMedicalConditions', v)} />
              </div>
              {hasMedical && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">{t('memberWizard.medicalNotes')}</Label>
                  <Textarea {...register('medicalNotes')} rows={2} />
                </div>
              )}
              <div className="flex items-center justify-between">
                <Label>{t('memberWizard.allowPhysicalContact')}</Label>
                <Switch checked={allowPhysical || false} onCheckedChange={(v) => setValue('allowPhysicalContact', v)} />
              </div>
              {allowPhysical === false && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">{t('memberWizard.physicalContactNotes')}</Label>
                  <Textarea {...register('physicalContactNotes')} rows={2} />
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Other */}
          <Collapsible>
            <SectionHeader>{t('memberWizard.stepOther')}</SectionHeader>
            <CollapsibleContent className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label>{t('leads.source')}</Label>
                <Input {...register('source')} />
              </div>
              <div className="space-y-2">
                <Label>{t('memberWizard.packageInterest')}</Label>
                <Select defaultValue={member?.package_interest_id || undefined} onValueChange={(v) => setValue('packageInterestId', v)}>
                  <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
                  <SelectContent>
                    {packages?.map(pkg => (
                      <SelectItem key={pkg.id} value={pkg.id}>{pkg.name_en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('form.notes')}</Label>
                <Textarea {...register('notes')} rows={2} />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={updateMember.isPending}>
              {updateMember.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
