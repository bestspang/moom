import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Section } from '@/apps/shared/components/Section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMemberSession } from '../hooks/useMemberSession';
import { updateMyProfile } from '../api/services';
import { fireGamificationEvent } from '@/lib/gamificationEvents';
import { useTranslation } from 'react-i18next';

const createEditProfileSchema = (t: (key: string) => string) => z.object({
  first_name: z.string().min(1, t('validation.required')),
  last_name: z.string().min(1, t('validation.required')),
  phone: z.string().optional(),
  preferred_language: z.enum(['en', 'th', 'ja']).default('en'),
});

type EditProfileForm = z.infer<ReturnType<typeof createEditProfileSchema>>;

export default function MemberEditProfilePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { firstName, lastName, email, user, memberId } = useMemberSession();

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<EditProfileForm>({
    resolver: zodResolver(createEditProfileSchema(t)),
    defaultValues: {
      first_name: firstName,
      last_name: lastName,
      phone: user?.user_metadata?.phone ?? '',
      preferred_language: 'en',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: EditProfileForm) => updateMyProfile({ first_name: data.first_name, last_name: data.last_name, phone: data.phone, preferred_language: data.preferred_language }),
    onSuccess: () => {
      if (memberId) {
        fireGamificationEvent({
          event_type: 'profile_completed',
          member_id: memberId,
          idempotency_key: `profile_completed:${memberId}`,
        });
      }
      toast.success(t('member.profileUpdated'));
      navigate('/member/profile');
    },
    onError: () => toast.error(t('member.profileUpdateFailed')),
  });

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="animate-in fade-in-0 duration-200">
      <MobilePageHeader
        title={t('member.editProfileTitle')}
        action={
          <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> {t('common.back')}
          </button>
        }
      />

      <Section className="mb-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="firstName">{t('member.firstName')}</Label>
            <Input id="firstName" {...register('first_name')} className="mt-1" />
            {errors.first_name && <p className="text-xs text-destructive mt-1">{errors.first_name.message}</p>}
          </div>
          <div>
            <Label htmlFor="lastName">{t('member.lastName')}</Label>
            <Input id="lastName" {...register('last_name')} className="mt-1" />
            {errors.last_name && <p className="text-xs text-destructive mt-1">{errors.last_name.message}</p>}
          </div>
          <div>
            <Label htmlFor="email">{t('member.emailLabel')}</Label>
            <Input id="email" value={email} readOnly className="mt-1 bg-muted" />
          </div>
          <div>
            <Label htmlFor="phone">{t('member.phoneLabel')}</Label>
            <Input id="phone" {...register('phone')} className="mt-1" />
          </div>
          <div>
            <Label>{t('member.preferredLanguage')}</Label>
            <Controller name="preferred_language" control={control} render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="th">ภาษาไทย</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </div>
        </div>
      </Section>

      <div className="px-4 pb-8">
        <Button type="submit" className="w-full" disabled={isSubmitting || mutation.isPending}>
          {mutation.isPending ? t('common.saving') : t('member.saveChanges')}
        </Button>
      </div>
    </form>
  );
}
