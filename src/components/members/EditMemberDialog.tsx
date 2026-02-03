import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUpdateMember } from '@/hooks/useMembers';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Member = Database['public']['Tables']['members']['Row'];

type MemberFormData = {
  firstName: string;
  lastName: string;
  nickname?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  status: 'active' | 'suspended' | 'on_hold' | 'inactive';
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

  // Memoize schema for i18n support
  const memberSchema = useMemo(() => z.object({
    firstName: z.string().min(1, t('validation.firstNameRequired')).max(100),
    lastName: z.string().min(1, t('validation.lastNameRequired')).max(100),
    nickname: z.string().max(50).optional(),
    email: z.string().email(t('validation.invalidEmail')).optional().or(z.literal('')),
    phone: z.string().max(20).optional(),
    dateOfBirth: z.string().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    address: z.string().max(500).optional(),
    status: z.enum(['active', 'suspended', 'on_hold', 'inactive']),
  }), [t]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
  });

  useEffect(() => {
    if (member && open) {
      reset({
        firstName: member.first_name,
        lastName: member.last_name,
        nickname: member.nickname || '',
        email: member.email || '',
        phone: member.phone || '',
        dateOfBirth: member.date_of_birth || '',
        gender: member.gender || undefined,
        address: member.address || '',
        status: member.status || 'active',
      });
    }
  }, [member, open, reset]);

  const onSubmit = async (data: MemberFormData) => {
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
          address: data.address || null,
          status: data.status,
        },
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('members.editMember')}</DialogTitle>
          <DialogDescription>
            {member?.member_id}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                defaultValue={member?.gender || undefined}
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
            <Label htmlFor="status">{t('common.status')}</Label>
            <Select
              defaultValue={member?.status || 'active'}
              onValueChange={(value) => setValue('status', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t('common.active')}</SelectItem>
                <SelectItem value="suspended">{t('members.suspended')}</SelectItem>
                <SelectItem value="on_hold">{t('members.onHold')}</SelectItem>
                <SelectItem value="inactive">{t('common.inactive')}</SelectItem>
              </SelectContent>
            </Select>
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
            <Button type="submit" disabled={updateMember.isPending}>
              {updateMember.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
