import React, { useState } from 'react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActivityLogs, formatValueChange } from '@/hooks/useActivityLog';
import { PageHeader, DateRangePicker, EmptyState } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const ActivityLog = () => {
  const { t } = useLanguage();
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({
    start: new Date(),
    end: new Date(),
  });

  const { data: logs, isLoading } = useActivityLogs(dateRange.start, dateRange.end);

  const getEventTypeBadgeColor = (eventType: string) => {
    const colors: Record<string, string> = {
      member_created: 'bg-green-500/10 text-green-500',
      member_updated: 'bg-blue-500/10 text-blue-500',
      member_deleted: 'bg-destructive/10 text-destructive',
      package_purchased: 'bg-primary/10 text-primary',
      class_scheduled: 'bg-accent-teal/10 text-accent-teal',
      check_in: 'bg-purple-500/10 text-purple-500',
    };
    return colors[eventType] || 'bg-muted text-muted-foreground';
  };

  return (
    <div>
      <PageHeader
        title={t('activityLog.title')}
        breadcrumbs={[
          { label: t('nav.yourGym') },
          { label: t('activityLog.title') },
        ]}
      />

      <div className="mb-6">
        <DateRangePicker
          startDate={dateRange.start}
          endDate={dateRange.end}
          onChange={setDateRange}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !logs || logs.length === 0 ? (
        <EmptyState message={t('common.noData')} />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('activityLog.dateTime')}</TableHead>
                <TableHead>{t('activityLog.event')}</TableHead>
                <TableHead>{t('activityLog.activity')}</TableHead>
                <TableHead>{t('activityLog.staff')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {log.created_at
                      ? format(new Date(log.created_at), 'd MMM yyyy, HH:mm')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={getEventTypeBadgeColor(log.event_type)}
                    >
                      {log.event_type.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div>
                      <p className="font-medium">{log.activity}</p>
                      {(log.old_value || log.new_value) && (
                        <p className="text-sm text-muted-foreground truncate">
                          {formatValueChange(log.old_value, log.new_value)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.staff
                      ? `${log.staff.first_name} ${log.staff.last_name}`
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
