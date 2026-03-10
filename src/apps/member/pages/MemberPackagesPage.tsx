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
import { Package, Check, Zap, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemberSession } from '../hooks/useMemberSession';
import { fetchMyPackages, fetchAvailablePackages } from '../api/services';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';

export default function MemberPackagesPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
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

  // Gamification nudge — fetch package_purchase rule
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

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title="Packages" subtitle="Active & available packages" />

      {/* Gamification nudge */}
      {pkgRule && (
        <div className="px-4 mb-3">
          <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/10 px-3 py-2">
            <Zap className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              {t('auth.earnXpOnRenewal')
                .replace('{{xp}}', String(pkgRule.xp_value))
                .replace('{{coins}}', String(pkgRule.points_value))}
            </p>
          </div>
        </div>
      )}

      {/* Tab toggle */}
      <div className="px-4 mb-4">
        <div className="flex rounded-lg bg-muted p-1">
          {(['my', 'browse'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 rounded-md py-2 text-sm font-medium transition-all',
                tab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t === 'my' ? 'My Packages' : 'Browse'}
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
              title="No packages"
              description="Purchase a package to start booking classes"
              action={<Button size="sm" onClick={() => setTab('browse')}>Browse Packages</Button>}
            />
          ) : (
            <div className="space-y-2">
              {myPackages.map(pkg => (
                <ListCard
                  key={pkg.id}
                  title={pkg.packageName}
                  subtitle={
                    pkg.sessionsRemaining != null
                      ? `${pkg.sessionsRemaining}/${pkg.sessionsTotal ?? '∞'} sessions remaining`
                      : pkg.expiryDate
                        ? `Expires ${format(parseISO(pkg.expiryDate), 'd MMM yyyy')}`
                        : undefined
                  }
                  trailing={<MobileStatusBadge status={pkg.status} />}
                />
              ))}
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
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">Popular</span>
                        )}
                      </div>
                      {pkg.descriptionEn && <p className="text-xs text-muted-foreground mt-0.5">{pkg.descriptionEn}</p>}
                    </div>
                    <p className="text-lg font-bold text-primary">{pkg.price.toLocaleString()}฿</p>
                  </div>

                  <ul className="space-y-1 mb-3">
                    {pkg.sessions && (
                      <li className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className="h-3 w-3 text-primary flex-shrink-0" />{pkg.sessions} sessions
                      </li>
                    )}
                    <li className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="h-3 w-3 text-primary flex-shrink-0" />{pkg.termDays} day term
                    </li>
                  </ul>
                  <Button size="sm" className="w-full" onClick={() => navigate(`/member/packages/${pkg.id}/purchase`)}>Purchase</Button>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}
    </div>
  );
}
