import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { EmptyState } from '@/apps/shared/components/EmptyState';
import { QueryError } from '@/apps/shared/components/QueryError';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardCheck, CalendarDays, TrendingUp, Flame } from 'lucide-react';
import { format, parseISO, startOfMonth, startOfWeek } from 'date-fns';
import { useMemberSession } from '../hooks/useMemberSession';
import { useDateLocale } from '@/hooks/useDateLocale';
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

  const stats = useMemo(() => {
    if (!records || records.length === 0) return null;
    const now = new Date();
    const monthStart = startOfMonth(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    const thisMonth = records.filter(r => parseISO(r.checkInTime) >= monthStart).length;
    const thisWeek = records.filter(r => parseISO(r.checkInTime) >= weekStart).length;

    return { total: records.length, thisMonth, thisWeek };
  }, [records]);

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title={t('member.attendance')} subtitle={t('member.attendanceSubtitle')} />

      {/* Stats summary */}
      {stats && (
        <Section className="mb-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-card border border-border p-3 text-center shadow-sm">
              <CalendarDays className="h-4 w-4 mx-auto text-primary mb-1" />
              <p className="text-lg font-bold text-foreground">{stats.total}</p>
              <p className="text-[10px] text-muted-foreground font-medium">{t('member.totalCheckIns')}</p>
            </div>
            <div className="rounded-xl bg-card border border-border p-3 text-center shadow-sm">
              <TrendingUp className="h-4 w-4 mx-auto text-primary mb-1" />
              <p className="text-lg font-bold text-foreground">{stats.thisMonth}</p>
              <p className="text-[10px] text-muted-foreground font-medium">{t('member.thisMonth')}</p>
            </div>
            <div className="rounded-xl bg-card border border-border p-3 text-center shadow-sm">
              <Flame className="h-4 w-4 mx-auto text-primary mb-1" />
              <p className="text-lg font-bold text-foreground">{stats.thisWeek}</p>
              <p className="text-[10px] text-muted-foreground font-medium">{t('member.thisWeek')}</p>
            </div>
          </div>
        </Section>
      )}

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
                  <p className="text-sm font-medium text-foreground">{format(parseISO(r.checkInTime), 'PPp', { locale: dateLocale })}</p>
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
