import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { ListCard } from '@/apps/shared/components/ListCard';
import { QueryError } from '@/apps/shared/components/QueryError';
import { EmptyState } from '@/apps/shared/components/EmptyState';
import { MobileStatusBadge } from '@/apps/shared/components/MobileStatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Package, Check, Zap, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemberSession } from '../hooks/useMemberSession';
import { fetchMyPackages, fetchAvailablePackages } from '../api/services';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, differenceInDays } from 'date-fns';
import { useDateLocale } from '@/hooks/useDateLocale';

export default function MemberPackagesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const { memberId, isAuthenticated } = useMemberSession();
  const [tab, setTab] = useState<'my' | 'browse'>('my');

  const { data: myPackages, isLoading: loadingMy, isError: errorMy, refetch: refetchMy } = useQuery({
    queryKey: ['member-packages', memberId],
    queryFn: () => fetchMyPackages(memberId!),
    enabled: !!memberId,
  });

  const { data: available, isLoading: loadingAvailable, isError: errorAvailable, refetch: refetchAvailable } = useQuery({
    queryKey: ['available-packages'],
    queryFn: fetchAvailablePackages,
    enabled: isAuthenticated,
  });

  const { data: pkgRule } = useQuery({
    queryKey: ['gamification-rule-package'],
    queryFn: async () => {
      const { data } = await supabase
        .from('gamification_rules')
        .select('xp_value, points_value')
        .eq('action_key', 'package_purchase')
        .eq('is_active', true)
        .maybeSingle();
      return data;
    },
    staleTime: 1000 * 60 * 30,
  });

  const getExpiryUrgency = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const days = differenceInDays(parseISO(expiryDate), new Date());
    if (days <= 3) return 'text-destructive';
    if (days <= 7) return 'text-orange-500';
    return null;
  };

  const getSessionPercent = (remaining: number | null, total: number | null) => {
    if (remaining == null || total == null || total === 0) return null;
    const used = total - remaining;
    return Math.min(Math.round((used / total) * 100), 100);
  };

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title={t('member.packages')} subtitle={t('member.packagesSubtitle')} />

      {/* Gamification nudge */}
      {pkgRule && (
        <div className="px-4 mb-3">
          <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/10 px-3 py-2">
            <Zap className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              {t('member.earnXpOnRenewal')
                .replace('{{xp}}', String(pkgRule.xp_value))
                .replace('{{coins}}', String(pkgRule.points_value))}
            </p>
          </div>
        </div>
      )}

      {/* Tab toggle */}
      <div className="px-4 mb-4">
        <div className="flex rounded-lg bg-muted p-1">
          {(['my', 'browse'] as const).map(tabKey => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-all',
                tab === tabKey ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tabKey === 'my' ? <Package className="h-3.5 w-3.5" /> : <ShoppingBag className="h-3.5 w-3.5" />}
              {tabKey === 'my' ? t('member.myPackages') : t('member.browse')}
            </button>
          ))}
        </div>
      </div>

      {tab === 'my' ? (
        <Section>
          {errorMy ? (
            <QueryError onRetry={() => refetchMy()} />
          ) : loadingMy ? (
            <div className="space-y-3"><Skeleton className="h-20 rounded-lg" /><Skeleton className="h-20 rounded-lg" /></div>
          ) : !myPackages || myPackages.length === 0 ? (
            <EmptyState
              icon={<Package className="h-10 w-10" />}
              title={t('member.noPackages')}
              description={t('member.noPackagesHint')}
              action={<Button size="sm" onClick={() => setTab('browse')}>{t('member.browsePackages')}</Button>}
            />
          ) : (
            <div className="space-y-2">
              {myPackages.map(pkg => {
                const sessionPercent = getSessionPercent(pkg.sessionsRemaining, pkg.sessionsTotal);
                const urgencyClass = getExpiryUrgency(pkg.expiryDate);
                const sessionsUsed = pkg.sessionsTotal != null && pkg.sessionsRemaining != null
                  ? pkg.sessionsTotal - pkg.sessionsRemaining
                  : null;

                return (
                  <div key={pkg.id} className="rounded-lg bg-card p-4 shadow-sm border border-border">
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="text-sm font-semibold text-foreground truncate">{pkg.packageName}</h3>
                      <MobileStatusBadge status={pkg.status} />
                    </div>

                    {/* Session progress bar */}
                    {sessionPercent != null && sessionsUsed != null && pkg.sessionsTotal != null && (
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>{t('member.sessionsUsed').replace('{{used}}', String(sessionsUsed)).replace('{{total}}', String(pkg.sessionsTotal))}</span>
                          <span>{pkg.sessionsRemaining} {t('member.remaining')}</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              sessionPercent >= 90 ? 'bg-destructive' : sessionPercent >= 70 ? 'bg-orange-500' : 'bg-primary'
                            )}
                            style={{ width: `${sessionPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Expiry info */}
                    {pkg.expiryDate && (
                      <p className={cn('text-xs text-muted-foreground', urgencyClass)}>
                        {t('member.expiresOn').replace('{{date}}', format(parseISO(pkg.expiryDate), 'd MMM yyyy', { locale: dateLocale }))}
                      </p>
                    )}

                    {/* Sessions remaining (no total) */}
                    {pkg.sessionsRemaining != null && pkg.sessionsTotal == null && (
                      <p className="text-xs text-muted-foreground">
                        {t('member.sessionsRemaining').replace('{{n}}', String(pkg.sessionsRemaining))}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      ) : (
        <Section>
          {errorAvailable ? (
            <QueryError onRetry={() => refetchAvailable()} />
          ) : loadingAvailable ? (
            <div className="space-y-3"><Skeleton className="h-32 rounded-lg" /><Skeleton className="h-32 rounded-lg" /></div>
          ) : (
            <div className="space-y-3">
              {available?.map(pkg => (
                <div key={pkg.id} className="rounded-lg bg-card p-4 shadow-sm border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-foreground">{pkg.nameEn}</h3>
                        {pkg.isPopular && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{t('member.popular')}</span>
                        )}
                      </div>
                      {pkg.descriptionEn && <p className="text-xs text-muted-foreground mt-0.5">{pkg.descriptionEn}</p>}
                    </div>
                    <p className="text-lg font-bold text-primary">{pkg.price.toLocaleString()}฿</p>
                  </div>

                  <ul className="space-y-1 mb-3">
                    {pkg.sessions && (
                      <li className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className="h-3 w-3 text-primary flex-shrink-0" />{t('member.sessions').replace('{{n}}', String(pkg.sessions))}
                      </li>
                    )}
                    <li className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="h-3 w-3 text-primary flex-shrink-0" />{t('member.dayTerm').replace('{{n}}', String(pkg.termDays))}
                    </li>
                  </ul>
                  <Button size="sm" className="w-full" onClick={() => navigate(`/member/packages/${pkg.id}/purchase`)}>{t('member.purchase')}</Button>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}
    </div>
  );
}
