import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { QueryError } from '@/apps/shared/components/QueryError';
import { EmptyState } from '@/apps/shared/components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { User, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';

export default function StaffMemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: member, isLoading: memberLoading, isError: memberError, refetch: refetchMember } = useQuery({
    queryKey: ['staff-member-detail', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name, nickname, phone, email, status, created_at')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: packages, isLoading: packagesLoading } = useQuery({
    queryKey: ['staff-member-packages', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_packages')
        .select('id, package_name_snapshot, status, sessions_remaining, sessions_total, expiry_date')
        .eq('member_id', id!)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (memberError) return <QueryError onRetry={refetchMember} />;

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader
        title={memberLoading ? '' : `${member?.first_name ?? ''} ${member?.last_name ?? ''}`.trim()}
        subtitle={member?.nickname ?? member?.phone ?? ''}
      />

      {/* Member Info */}
      <Section title={t('staff.memberInfo')} className="mb-4">
        {memberLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {[
              { label: t('staff.phone'), value: member?.phone },
              { label: t('staff.email'), value: member?.email },
              { label: t('staff.memberSince'), value: member?.created_at ? format(parseISO(member.created_at), 'dd MMM yyyy') : null },
            ].map(row => row.value && (
              <div key={row.label} className="flex justify-between items-center rounded-lg bg-card px-4 py-3">
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <span className="text-sm font-medium">{row.value}</span>
              </div>
            ))}
            <div className="flex justify-between items-center rounded-lg bg-card px-4 py-3">
              <span className="text-sm text-muted-foreground">{t('staff.status')}</span>
              <Badge variant={member?.status === 'active' ? 'default' : 'secondary'}>
                {member?.status ?? '—'}
              </Badge>
            </div>
          </div>
        )}
      </Section>

      {/* Packages */}
      <Section title={t('staff.packages')} className="mb-4">
        {packagesLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : !packages?.length ? (
          <EmptyState icon={<Package className="h-8 w-8" />} title={t('staff.noPackages')} description={t('staff.noPackagesDesc')} />
        ) : (
          <div className="space-y-2">
            {packages.map(pkg => (
              <div key={pkg.id} className="rounded-lg bg-card px-4 py-3">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium">{pkg.package_name_snapshot ?? t('staff.unknownPackage')}</span>
                  <Badge variant={pkg.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                    {pkg.status}
                  </Badge>
                </div>
                {pkg.sessions_total != null && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('staff.sessionsRemaining', { remaining: pkg.sessions_remaining ?? 0, total: pkg.sessions_total })}
                  </p>
                )}
                {pkg.expiry_date && (
                  <p className="text-xs text-muted-foreground">
                    {t('staff.expiresOn', { date: format(parseISO(pkg.expiry_date), 'dd MMM yyyy') })}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
