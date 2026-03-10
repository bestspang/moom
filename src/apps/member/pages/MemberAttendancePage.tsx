import { useQuery } from '@tanstack/react-query';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { EmptyState } from '@/apps/shared/components/EmptyState';
import { QueryError } from '@/apps/shared/components/QueryError';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useMemberSession } from '../hooks/useMemberSession';
import { fetchMyAttendance } from '../api/services';
import { useTranslation } from 'react-i18next';

export default function MemberAttendancePage() {
  const { memberId } = useMemberSession();
  const { t } = useTranslation();

  const { data: records, isLoading, isError, refetch } = useQuery({
    queryKey: ['member-attendance', memberId],
    queryFn: () => fetchMyAttendance(memberId!),
    enabled: !!memberId,
  });

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title={t('member.attendance')} subtitle={t('member.attendanceSubtitle')} />

      <Section>
        {isError ? (
          <QueryError onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
        ) : !records || records.length === 0 ? (
          <EmptyState icon={<ClipboardCheck className="h-10 w-10" />} title={t('member.noCheckIns')} description={t('member.noCheckInsHint')} />
        ) : (
          <div className="space-y-2">
            {records.map(r => (
              <div key={r.id} className="flex items-center justify-between rounded-lg bg-card p-3 shadow-sm border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">{format(parseISO(r.checkInTime), 'PPp')}</p>
                  {r.className && <p className="text-xs text-muted-foreground">{r.className}</p>}
                </div>
                <span className="text-xs font-medium text-muted-foreground capitalize rounded-full bg-muted px-2 py-0.5">
                  {r.checkInType}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
