import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Section } from '@/apps/shared/components/Section';
import { QueryError } from '@/apps/shared/components/QueryError';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Check, CreditCard, Smartphone, Building2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { fetchAvailablePackages } from '../api/services';
import { useMemberSession } from '../hooks/useMemberSession';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
import { fireGamificationEvent } from '@/lib/gamificationEvents';
import { useTranslation } from 'react-i18next';

type Step = 'review' | 'payment' | 'success';

export default function MemberPurchasePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { memberId } = useMemberSession();
  const { createCheckout, isLoading: checkoutLoading } = useStripeCheckout();
  const [step, setStep] = useState<Step>('review');
  const [paymentMethod, setPaymentMethod] = useState<string>('card');

  const PAYMENT_METHODS = [
    { id: 'card', label: t('member.creditDebitCard'), icon: CreditCard },
    { id: 'promptpay', label: t('member.promptPay'), icon: Smartphone },
    { id: 'transfer', label: t('member.bankTransfer'), icon: Building2 },
  ] as const;

  const { data: packages, isLoading, isError, refetch } = useQuery({
    queryKey: ['available-packages'],
    queryFn: fetchAvailablePackages,
  });

  const pkg = useMemo(() => packages?.find(p => p.id === id), [packages, id]);

  const handlePurchase = async () => {
    if (!memberId || !id) return;
    try {
      await createCheckout({ member_id: memberId, package_id: id });
      fireGamificationEvent({
        event_type: 'package_purchased',
        member_id: memberId,
        idempotency_key: `purchase:${id}:${Date.now()}`,
        metadata: { package_id: id },
      });
      setStep('success');
    } catch {
      // error already toasted by hook
    }
  };

  const BackButton = () => (
    <button onClick={() => step === 'payment' ? setStep('review') : navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
      <ArrowLeft className="h-4 w-4" /> {t('common.back')}
    </button>
  );

  if (isLoading) return (
    <div className="animate-in fade-in-0 duration-200">
      <div className="px-4 pt-12 pb-2"><BackButton /></div>
      <Section><Skeleton className="h-64 rounded-lg" /></Section>
    </div>
  );

  if (isError) return (
    <div className="animate-in fade-in-0 duration-200">
      <div className="px-4 pt-12 pb-2"><BackButton /></div>
      <QueryError onRetry={() => refetch()} />
    </div>
  );

  if (!pkg) return (
    <div className="animate-in fade-in-0 duration-200">
      <div className="px-4 pt-12 pb-2"><BackButton /></div>
      <Section><p className="text-sm text-muted-foreground text-center py-8">{t('member.packageNotFound')}</p></Section>
    </div>
  );

  if (step === 'success') {
    return (
      <div className="animate-in fade-in-0 duration-200 flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-1">{t('member.purchaseInitiated')}</h1>
        <p className="text-sm text-muted-foreground mb-6">{t('member.checkPaymentWindow')}</p>
        <div className="space-y-2 w-full max-w-xs">
          <Button className="w-full" onClick={() => navigate('/member/packages')}>{t('member.viewMyPackages')}</Button>
          <Button variant="outline" className="w-full" onClick={() => navigate('/member/schedule')}>{t('member.bookAClass')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in-0 duration-200">
      <div className="px-4 pt-12 pb-2"><BackButton /></div>

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

      {step === 'review' && (
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

      {step === 'payment' && (
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
                      onClick={() => setPaymentMethod(method.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg border p-3 transition-all',
                        paymentMethod === method.id
                          ? 'border-primary bg-accent'
                          : 'border-border hover:bg-muted'
                      )}
                    >
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{method.label}</span>
                      {paymentMethod === method.id && <Check className="h-4 w-4 text-primary ml-auto" />}
                    </button>
                  );
                })}
              </div>
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
            <Button className="w-full" onClick={handlePurchase} disabled={checkoutLoading || !memberId}>
              {checkoutLoading ? t('member.processing') : t('member.payAmount', { amount: pkg.price.toLocaleString() })}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
