import { useQuery } from '@tanstack/react-query';
import { fetchMyCoupons, type CouponWalletItem } from '../features/momentum/api';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { EmptyState } from '@/apps/shared/components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useMemberSession } from '../hooks/useMemberSession';
import { Ticket, Clock, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { useDateLocale } from '@/hooks/useDateLocale';

function CouponCard({ coupon }: { coupon: CouponWalletItem }) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const tpl = coupon.template;
  if (!tpl) return null;

  const isActive = coupon.status === 'active';
  const isUsed = coupon.status === 'used';
  const isExpired = coupon.status === 'expired' || (!isUsed && new Date(coupon.expiresAt) < new Date());

  const discountLabel = tpl.discountType === 'percent'
    ? t('member.percentOff', { value: tpl.discountValue })
    : t('member.amountOff', { value: tpl.discountValue });

  const APPLIES_MAP: Record<string, string> = {
    all: t('member.appliesAll'),
    merch: t('member.appliesMerch'),
    package: t('member.appliesPackage'),
  };
  const appliesLabel = APPLIES_MAP[tpl.appliesTo] ?? tpl.appliesTo;

  return (
    <div className={`relative rounded-xl border bg-card overflow-hidden ${isActive ? '' : 'opacity-60'}`}>
      <div className={`h-1 ${isActive ? 'bg-primary' : isUsed ? 'bg-green-500' : 'bg-muted'}`} />
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-foreground">{discountLabel}</p>
              <p className="text-xs text-muted-foreground">{tpl.nameEn}</p>
            </div>
          </div>
          {isActive && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-600">
              {t('member.couponActive')}
            </span>
          )}
          {isUsed && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
              <Check className="h-2.5 w-2.5" /> {t('member.couponUsed')}
            </span>
          )}
          {isExpired && !isUsed && (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
              <X className="h-2.5 w-2.5" /> {t('member.couponExpired')}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{t('member.appliesTo', { target: appliesLabel })}</span>
          {tpl.minSpend > 0 && <span>{t('member.minSpend', { amount: tpl.minSpend.toLocaleString() })}</span>}
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {isUsed && coupon.usedAt ? (
            <span>{t('member.usedOn', { date: format(new Date(coupon.usedAt), 'MMM d, yyyy', { locale: dateLocale }) })}</span>
          ) : (
            <span>{t('member.expiresDate', { date: format(new Date(coupon.expiresAt), 'MMM d, yyyy', { locale: dateLocale }) })}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MemberCouponsPage() {
  const { t } = useTranslation();
  const { memberId } = useMemberSession();

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['my-coupons', memberId],
    queryFn: () => fetchMyCoupons(memberId!),
    enabled: !!memberId,
  });

  const activeCoupons = (coupons ?? []).filter(c => c.status === 'active' && new Date(c.expiresAt) > new Date());
  const usedCoupons = (coupons ?? []).filter(c => c.status === 'used');
  const expiredCoupons = (coupons ?? []).filter(c => c.status === 'expired' || (c.status === 'active' && new Date(c.expiresAt) <= new Date()));

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title={t('member.myCoupons')} />

      <Tabs defaultValue="active" className="px-4">
        <TabsList className="w-full grid grid-cols-3 bg-card border border-border shadow-sm rounded-xl mb-4">
          <TabsTrigger value="active" className="rounded-lg text-xs font-bold">
            {t('member.couponActive')} ({activeCoupons.length})
          </TabsTrigger>
          <TabsTrigger value="used" className="rounded-lg text-xs font-bold">
            {t('member.couponUsed')} ({usedCoupons.length})
          </TabsTrigger>
          <TabsTrigger value="expired" className="rounded-lg text-xs font-bold">
            {t('member.couponExpired')} ({expiredCoupons.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
          ) : activeCoupons.length === 0 ? (
            <EmptyState
              title={t('member.noActiveCoupons')}
              description={t('member.noActiveCouponsHint')}
            />
          ) : (
            activeCoupons.map(c => <CouponCard key={c.id} coupon={c} />)
          )}
        </TabsContent>

        <TabsContent value="used" className="space-y-3">
          {usedCoupons.length === 0 ? (
            <EmptyState title={t('member.noUsedCoupons')} description={t('member.noUsedCouponsHint')} />
          ) : (
            usedCoupons.map(c => <CouponCard key={c.id} coupon={c} />)
          )}
        </TabsContent>

        <TabsContent value="expired" className="space-y-3">
          {expiredCoupons.length === 0 ? (
            <EmptyState title={t('member.noExpiredCoupons')} description={t('member.noExpiredCouponsHint')} />
          ) : (
            expiredCoupons.map(c => <CouponCard key={c.id} coupon={c} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
