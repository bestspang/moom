import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Section } from '@/apps/shared/components/Section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { uploadTransferSlip } from '../api/services';
import { useTranslation } from 'react-i18next';

const uploadSlipSchema = z.object({
  amount: z.number({ required_error: 'Required' }).positive('Must be positive'),
  bank_name: z.string().min(1, 'Required'),
  transfer_date: z.string().min(1, 'Required'),
});

type UploadSlipForm = z.infer<typeof uploadSlipSchema>;

export default function MemberUploadSlipPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<UploadSlipForm>({
    resolver: zodResolver(uploadSlipSchema),
    defaultValues: {
      amount: undefined as unknown as number,
      bank_name: '',
      transfer_date: new Date().toISOString().split('T')[0],
    },
  });

  const mutation = useMutation({
    mutationFn: (data: UploadSlipForm) => uploadTransferSlip({ amount: data.amount, bank_name: data.bank_name, transfer_date: data.transfer_date }),
    onSuccess: () => {
      toast.success(t('member.slipUploaded'));
      navigate('/member/packages');
    },
    onError: () => toast.error(t('member.slipUploadFailed')),
  });

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="animate-in fade-in-0 duration-200">
      <div className="px-4 pt-12 pb-2">
        <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <ArrowLeft className="h-4 w-4" /> {t('common.back')}
        </button>
      </div>

      <Section className="mb-6">
        <h1 className="text-xl font-bold text-foreground mb-4">{t('member.uploadTransferSlip')}</h1>
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 bg-muted/50">
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{t('member.tapToUploadSlip')}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('member.uploadSizeHint')}</p>
          </div>
          <div>
            <Label htmlFor="amount">{t('member.amountThb')}</Label>
            <Input id="amount" type="number" step="0.01" {...register('amount', { valueAsNumber: true })} placeholder="0.00" className="mt-1" />
            {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>}
          </div>
          <div>
            <Label htmlFor="bankName">{t('member.bankName')}</Label>
            <Input id="bankName" {...register('bank_name')} placeholder="e.g. Kasikorn" className="mt-1" />
            {errors.bank_name && <p className="text-xs text-destructive mt-1">{errors.bank_name.message}</p>}
          </div>
          <div>
            <Label htmlFor="transferDate">{t('member.transferDate')}</Label>
            <Input id="transferDate" type="date" {...register('transfer_date')} className="mt-1" />
            {errors.transfer_date && <p className="text-xs text-destructive mt-1">{errors.transfer_date.message}</p>}
          </div>
        </div>
      </Section>

      <div className="px-4 pb-8">
        <Button type="submit" className="w-full" disabled={isSubmitting || mutation.isPending}>
          {mutation.isPending ? t('member.uploadingSlip') : t('member.submitTransferSlip')}
        </Button>
      </div>
    </form>
  );
}
