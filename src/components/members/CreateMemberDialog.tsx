import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateMember, useNextMemberId } from '@/hooks/useMembers';
import { useToast } from '@/hooks/use-toast';
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

interface CreateMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateMemberDialog: React.FC<CreateMemberDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const createMember = useCreateMember();
  const { data: nextMemberId, refetch: refetchMemberId } = useNextMemberId();
  const isMobile = useIsMobile();

  // Create schema with translations
  const memberSchema = useMemo(() => z.object({
    firstName: z.string().min(1, t('validation.firstNameRequired')).max(100),
    lastName: z.string().min(1, t('validation.lastNameRequired')).max(100),
    nickname: z.string().max(50).optional(),
    email: z.string().email(t('validation.invalidEmail')).optional().or(z.literal('')),
    phone: z.string().max(20).optional(),
    dateOfBirth: z.string().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    address: z.string().max(500).optional(),
  }), [t]);

  type MemberFormData = z.infer<typeof memberSchema>;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
  });

  useEffect(() => {
    if (open) {
      refetchMemberId();
      reset();
    }
  }, [open, refetchMemberId, reset]);

  const onSubmit = async (data: MemberFormData) => {
    try {
      await createMember.mutateAsync({
        member_id: nextMemberId || 'M-0000001',
        first_name: data.firstName,
        last_name: data.lastName,
        nickname: data.nickname || null,
        email: data.email || null,
        phone: data.phone || null,
        date_of_birth: data.dateOfBirth || null,
        gender: data.gender || null,
        address: data.address || null,
        status: 'active',
        is_new: true,
      });

      toast({
        title: t('common.success'),
        description: t('members.memberCreated'),
      });
      
      onOpenChange(false);
      reset();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: error.message,
      });
    }
  };

  const FormContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <p className="text-xs text-muted-foreground mb-4">{t('form.requiredFieldsNote')}</p>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">{t('auth.firstName')} *</Label>
          <Input
            id="firstName"
            {...register('firstName')}
            className={errors.firstName ? 'border-destructive' : ''}
          />
          {errors.firstName && (
            <p className="text-sm text-destructive">{errors.firstName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">{t('auth.lastName')} *</Label>
          <Input
            id="lastName"
            {...register('lastName')}
            className={errors.lastName ? 'border-destructive' : ''}
          />
          {errors.lastName && (
            <p className="text-sm text-destructive">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nickname">{t('form.nickname')}</Label>
        <Input id="nickname" {...register('nickname')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t('auth.email')}</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          className={errors.email ? 'border-destructive' : ''}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">{t('leads.contactNumber')}</Label>
        <Input id="phone" {...register('phone')} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">{t('form.dateOfBirth')}</Label>
          <Input
            id="dateOfBirth"
            type="date"
            {...register('dateOfBirth')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">{t('form.gender')}</Label>
          <Select
            onValueChange={(value) => setValue('gender', value as any)}
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
        <Label htmlFor="address">{t('form.address')}</Label>
        <Input id="address" {...register('address')} />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={createMember.isPending}>
          {createMember.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {t('common.create')}
        </Button>
      </div>
    </form>
  );

  // Use Drawer on mobile for better UX
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
          <div className="max-h-[70vh] overflow-y-auto px-1">
            {FormContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
