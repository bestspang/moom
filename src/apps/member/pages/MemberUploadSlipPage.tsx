import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Section } from '@/apps/shared/components/Section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, X, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { uploadTransferSlip } from '../api/services';
import { useTranslation } from 'react-i18next';

export default function MemberUploadSlipPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const uploadSlipSchema = z.object({
    amount: z.number({ required_error: t('validation.required') }).positive(t('validation.mustBePositive')),
    bank_name: z.string().min(1, t('validation.required')),
    transfer_date: z.string().min(1, t('validation.required')),
  });

  type UploadSlipForm = z.infer<typeof uploadSlipSchema>;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<UploadSlipForm>({
    resolver: zodResolver(uploadSlipSchema),
    defaultValues: {
      amount: undefined as unknown as number,
      bank_name: '',
      transfer_date: new Date().toISOString().split('T')[0],
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('validation.fileTooLarge'));
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // B4 fix: Now passes the file to uploadTransferSlip for actual storage upload
  const mutation = useMutation({
    mutationFn: (data: UploadSlipForm) => uploadTransferSlip({
      amount: data.amount,
      bank_name: data.bank_name,
      transfer_date: data.transfer_date,
      file: selectedFile ?? undefined,
    }),
    onSuccess: () => {
      toast.success(t('member.slipUploaded'));
      navigate('/member/packages');
    },
    onError: () => toast.error(t('member.slipUploadFailed')),
  });

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="animate-in fade-in-0 duration-200">
      <MobilePageHeader
        title={t('member.uploadTransferSlip')}
        action={
          <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> {t('common.back')}
          </button>
        }
      />

      <Section className="mb-6">
        <div className="space-y-4">
          {/* File upload area */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelect}
          />

          {preview ? (
            <div className="relative rounded-lg border border-border overflow-hidden bg-muted/30">
              <img src={preview} alt="Slip preview" className="w-full max-h-48 object-contain" />
              <button
                type="button"
                onClick={clearFile}
                className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm shadow-sm hover:bg-background transition-colors"
              >
                <X className="h-4 w-4 text-foreground" />
              </button>
              <div className="px-3 py-2 border-t border-border bg-card/50">
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                  <ImageIcon className="h-3 w-3 flex-shrink-0" />
                  {selectedFile?.name}
                </p>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 bg-muted/50 hover:bg-muted/70 hover:border-primary/30 transition-colors active:scale-[0.99]"
            >
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground">{t('member.tapToUploadSlip')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('member.uploadSizeHint')}</p>
            </button>
          )}

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
