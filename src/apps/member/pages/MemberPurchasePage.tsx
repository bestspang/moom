import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { QueryError } from '@/apps/shared/components/QueryError';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, CreditCard, Smartphone, Building2, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchAvailablePackages } from '../api/services';
import { useMemberSession } from '../hooks/useMemberSession';
import { useTranslation } from 'react-i18next';
import { useMemberStripeCheckout } from '@/hooks/useMemberStripeCheckout';
import { toast } from 'sonner';

type Step = 'review' | 'payment' | 'success';
type PaymentMethodId = 'transfer' | 'promptpay' | 'card';

export default function MemberPurchasePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const { memberId } = useMemberSession();
  const queryClient = useQueryClient();
  const { start: startStripeCheckout, isLoading: stripeLoading } = useMemberStripeCheckout();

  const paymentReturn = searchParams.get('payment');
  const [step, setStep] = useState<Step>(paymentReturn === 'success' ? 'success' : 'review');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('transfer');

  const PAYMENT_METHODS = [
    { id: 'transfer', label: t('member.bankTransfer'), icon: Building2, enabled: true },
    { id: 'promptpay', label: t('member.promptPay'), icon: Smartphone, enabled: true },
    { id: 'card', label: t('member.creditDebitCard'), icon: CreditCard, enabled: true },
  ] as const;

  const { data: packages, isLoading, isError, refetch } = useQuery({
    queryKey: ['available-packages'],
    queryFn: fetchAvailablePackages,
  });

  const pkg = useMemo(() => packages?.find(p => p.id === id), [packages, id]);

  // Handle Stripe redirect return
  useEffect(() => {
    if (paymentReturn === 'success') {
      queryClient.invalidateQueries({ queryKey: ['available-packages'] });
      if (memberId) {
        queryClient.invalidateQueries({ queryKey: ['member-packages', memberId] });
      }
      toast.success(t('member.paymentSuccessTitle'));
      // Strip the query param so a refresh doesn't re-trigger.
      setSearchParams({}, { replace: true });
    } else if (paymentReturn === 'cancelled') {
      toast.error(t('member.paymentCancelled'));
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentReturn, memberId]);

  const handlePurchase = async () => {
    if (!memberId || !id) return;

    if (paymentMethod === 'transfer') {
      navigate(`/member/upload-slip?packageId=${id}&amount=${pkg?.price ?? ''}`);
      return;
    }
    // card | promptpay → Stripe hosted checkout
    await startStripeCheckout(id, paymentMethod);
  };

  const backAction = (
    <button
      onClick={() => step === 'payment' ? setStep('review') : navigate(-1)}
      className="flex items-center gap-1 text-sm text-muted-foreground"
    >
      <ArrowLeft className="h-4 w-4" /> {t('common.back')}
    </button>
  );

  if (isLoading) return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title={t('member.packages')} action={backAction} />
      <Section><Skeleton className="h-64 rounded-lg" /></Section>
    </div>
  );

  if (isError) return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title={t('member.packages')} action={backAction} />
      <QueryError onRetry={() => refetch()} />
    </div>
  );

  if (!pkg && step !== 'success') return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title={t('member.packages')} action={backAction} />
      <Section><p className="text-sm text-muted-foreground text-center py-8">{t('member.packageNotFound')}</p></Section>
    </div>
  );

  if (step === 'success') {
    return (
      <div className="animate-in fade-in-0 duration-200 flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-1">{t('member.paymentSuccessTitle')}</h1>
        <p className="text-sm text-muted-foreground mb-6">{t('member.paymentSuccessDesc')}</p>
        <div className="space-y-2 w-full max-w-xs">
          <Button className="w-full" onClick={() => navigate('/member/packages')}>{t('member.viewMyPackages')}</Button>
          <Button variant="outline" className="w-full" onClick={() => navigate('/member/schedule')}>{t('member.bookAClass')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title={t('member.packages')} action={backAction} />

      {/* Step indicator */}
      <div className="px-4 mb-4 flex items-center gap-2">
        {[t('member.reviewStep'), t('member.paymentStep')].map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
              (i === 0 && step === 'review') || (i === 1 && step === 'payment')
                ? 'bg-primary text-primary-foreground'
                : i === 0 && step === 'payment'
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
            )}>
              {i === 0 && step === 'payment' ? <Check className="h-3 w-3" /> : i + 1}
            </div>
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            {i === 0 && <div className="flex-1 h-px bg-border" />}
          </div>
        ))}
      </div>

      {step === 'review' && pkg && (
        <>
          <Section className="mb-4">
            <div className="rounded-lg bg-card p-4 shadow-sm border border-border">
              <h2 className="text-lg font-bold text-foreground">{pkg.nameEn}</h2>
              {pkg.descriptionEn && <p className="text-sm text-muted-foreground mt-1">{pkg.descriptionEn}</p>}
              <ul className="mt-3 space-y-1.5">
                {pkg.sessions && (
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />{t('member.sessionsCount', { n: pkg.sessions })}
                  </li>
                )}
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />{t('member.dayTermCount', { n: pkg.termDays })}
                </li>
              </ul>
              <div className="mt-4 pt-3 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('member.price')}</span>
                  <span className="font-semibold text-foreground">{pkg.price.toLocaleString()}฿</span>
                </div>
              </div>
            </div>
          </Section>

          <div className="px-4 pb-8">
            <Button className="w-full" onClick={() => setStep('payment')}>{t('member.continueToPayment')}</Button>
          </div>
        </>
      )}

      {step === 'payment' && pkg && (
        <>
          <Section className="mb-4">
            <div className="rounded-lg bg-card p-4 shadow-sm border border-border">
              <h2 className="text-base font-semibold text-foreground mb-3">{t('member.paymentMethod')}</h2>
              <div className="space-y-2">
                {PAYMENT_METHODS.map(method => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => method.enabled && setPaymentMethod(method.id)}
                      disabled={!method.enabled}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all',
                        paymentMethod === method.id
                          ? 'border-primary bg-accent'
                          : method.enabled
                            ? 'border-border hover:bg-muted'
                            : 'border-border bg-muted/40 opacity-70'
                      )}
                    >
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{method.label}</span>
                      {!method.enabled && (
                        <Badge variant="secondary" className="ml-auto text-[10px]">
                          {t('member.unavailable')}
                        </Badge>
                      )}
                      {paymentMethod === method.id && <Check className="h-4 w-4 text-primary ml-auto" />}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {paymentMethod === 'transfer'
                  ? t('member.transferReviewDescription')
                  : t('member.redirectingToStripe')}
              </p>
            </div>
          </Section>

          <Section className="mb-6">
            <div className="rounded-lg bg-card p-4 shadow-sm border border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{pkg.nameEn}</span>
                <span className="font-semibold text-foreground">{pkg.price.toLocaleString()}฿</span>
              </div>
            </div>
          </Section>

          <div className="px-4 pb-8">
            <Button className="w-full" onClick={handlePurchase} disabled={!memberId || stripeLoading}>
              {(!memberId || stripeLoading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {paymentMethod === 'transfer'
                ? t('member.uploadSlipForAmount', { amount: pkg.price.toLocaleString() })
                : paymentMethod === 'promptpay'
                  ? t('member.payWithPromptPay')
                  : t('member.payWithCard')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
