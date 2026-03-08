import { useLanguage } from '@/contexts/LanguageContext';
import { DataTable, EmptyState, type Column } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/formatters';
import type { MemberAttendance } from '@/hooks/useMemberDetails';

interface MemberAttendanceTabProps {
  attendance: MemberAttendance[];
  isLoading: boolean;
}

export const MemberAttendanceTab = ({ attendance, isLoading }: MemberAttendanceTabProps) => {
  const { t } = useLanguage();

  const columns: Column<MemberAttendance>[] = [
    { key: 'check_in_time', header: t('members.checkInTime'), cell: (row) => formatDateTime(row.check_in_time) },
    { key: 'check_in_type', header: t('members.type'), cell: (row) => (
      <Badge variant="outline">{row.check_in_type || 'class'}</Badge>
    )},
    { key: 'schedule', header: t('members.class'), cell: (row) => row.schedule?.classes?.name || '-' },
    { key: 'location', header: t('members.location'), cell: (row) => row.location?.name || '-' },
  ];

  if (isLoading) return <Skeleton className="h-48" />;
  if (attendance.length === 0) return <EmptyState message={t('common.noData')} />;
  return <DataTable columns={columns} data={attendance} rowKey={(row) => row.id} />;
};
