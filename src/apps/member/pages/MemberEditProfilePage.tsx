import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Section } from '@/apps/shared/components/Section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMemberSession } from '../hooks/useMemberSession';
import { updateMyProfile } from '../api/services';

const editProfileSchema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  phone: z.string().optional(),
  preferred_language: z.enum(['en', 'th', 'ja']).default('en'),
});

type EditProfileForm = z.infer<typeof editProfileSchema>;

export default function MemberEditProfilePage() {
  const navigate = useNavigate();
  const { firstName, lastName, email, user } = useMemberSession();

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<EditProfileForm>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      first_name: firstName,
      last_name: lastName,
      phone: user?.user_metadata?.phone ?? '',
      preferred_language: 'en',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: EditProfileForm) => updateMyProfile({ first_name: data.first_name, last_name: data.last_name, phone: data.phone, preferred_language: data.preferred_language }),
    onSuccess: () => { toast.success('Profile updated'); navigate('/member/profile'); },
    onError: () => toast.error('Failed to update profile'),
  });

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="animate-in fade-in-0 duration-200">
      <div className="px-4 pt-12 pb-2">
        <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>

      <Section className="mb-6">
        <h1 className="text-xl font-bold text-foreground mb-4">Edit Profile</h1>
        <div className="space-y-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" {...register('first_name')} className="mt-1" />
            {errors.first_name && <p className="text-xs text-destructive mt-1">{errors.first_name.message}</p>}
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" {...register('last_name')} className="mt-1" />
            {errors.last_name && <p className="text-xs text-destructive mt-1">{errors.last_name.message}</p>}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} readOnly className="mt-1 bg-muted" />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register('phone')} className="mt-1" />
          </div>
          <div>
            <Label>Preferred Language</Label>
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
          {mutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
