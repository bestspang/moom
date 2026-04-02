import { useQuery } from '@tanstack/react-query';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { ListCard } from '@/apps/shared/components/ListCard';
import { QueryError } from '@/apps/shared/components/QueryError';
import { EmptyState } from '@/apps/shared/components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export default function StaffPaymentsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['staff-transfer-slips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transfer_slips')
        .select('id, amount, status, slip_date, member_id, members(first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title={t('staff.nav.payments')} subtitle={t('staff.transferSlips')} />
      {isError ? (
        <QueryError onRetry={() => refetch()} />
      ) : isLoading ? (
        <Section><div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div></Section>
      ) : !data?.length ? (
        <EmptyState icon={<CreditCard className="h-10 w-10" />} title={t('staff.noSlips')} description={t('staff.slipsWillAppear')} />
      ) : (
        <Section>
          <div className="space-y-2">
            {data.map((s: any) => (
              <ListCard
                key={s.id}
                title={s.members ? `${s.members.first_name} ${s.members.last_name ?? ''}`.trim() : t('staff.unknown')}
                subtitle={s.slip_date ? format(new Date(s.slip_date), 'd MMM yyyy') : undefined}
                meta={`฿${Number(s.amount ?? 0).toLocaleString()}`}
                trailing={
                  <span className={`text-xs font-medium ${s.status === 'approved' ? 'text-primary' : s.status === 'pending' ? 'text-amber-500' : 'text-muted-foreground'}`}>
                    {t(`staff.${s.status}`, s.status)}
                  </span>
                }
              />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
