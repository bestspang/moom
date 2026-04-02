import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { ListCard } from '@/apps/shared/components/ListCard';
import { QueryError } from '@/apps/shared/components/QueryError';
import { EmptyState } from '@/apps/shared/components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Users, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function StaffMembersPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['staff-members', search],
    queryFn: async () => {
      let q = supabase.from('members').select('id, first_name, last_name, nickname, phone, status').order('first_name').limit(50);
      if (search.trim()) {
        q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,nickname.ilike.%${search}%,phone.ilike.%${search}%`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title={t('staff.nav.members')} subtitle={t('staff.searchAndManage')} />
      <Section className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t('staff.searchMembersPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </Section>
      {isError ? (
        <QueryError onRetry={() => refetch()} />
      ) : isLoading ? (
        <Section><div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div></Section>
      ) : !data?.length ? (
        <EmptyState icon={<Users className="h-10 w-10" />} title={t('staff.noMembersFound')} description={search ? t('staff.tryDifferentSearch') : t('staff.membersWillAppear')} />
      ) : (
        <Section>
          <div className="space-y-2">
            {data.map(m => (
              <ListCard
                key={m.id}
                title={`${m.first_name} ${m.last_name ?? ''}`.trim()}
                subtitle={m.nickname ?? undefined}
                meta={m.phone ?? undefined}
                trailing={<span className={`text-xs font-medium ${m.status === 'active' ? 'text-primary' : 'text-muted-foreground'}`}>{t(`staff.${m.status}`, m.status)}</span>}
              />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
