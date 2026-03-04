import React, { useState } from 'react';
import { format } from 'date-fns';
import { Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActivityLogs, formatValueChange, ALL_EVENT_TYPES } from '@/hooks/useActivityLog';
import { PageHeader, DateRangePicker, EmptyState } from '@/components/common';
import { SearchBar } from '@/components/common/SearchBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getDateLocale } from '@/lib/formatters';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const PER_PAGE = 50;

const ActivityLog = () => {
  const { t, language } = useLanguage();
  const locale = getDateLocale(language);
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({
    start: new Date(),
    end: new Date(),
  });
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: result, isLoading } = useActivityLogs({
    startDate: dateRange.start,
    endDate: dateRange.end,
    eventTypes: selectedEventTypes,
    search,
    page,
    perPage: PER_PAGE,
  });

  const logs = result?.data;
  const total = result?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const toggleEventType = (eventType: string) => {
    setSelectedEventTypes((prev) =>
      prev.includes(eventType) ? prev.filter((e) => e !== eventType) : [...prev, eventType]
    );
    setPage(1);
  };

  const clearFilters = () => {
    setSelectedEventTypes([]);
    setPage(1);
  };

  const getEventTypeBadgeColor = (eventType: string) => {
    const colors: Record<string, string> = {
      member_created: 'bg-green-500/10 text-green-500',
      member_updated: 'bg-blue-500/10 text-blue-500',
      member_deleted: 'bg-destructive/10 text-destructive',
      package_purchased: 'bg-primary/10 text-primary',
      package_created: 'bg-primary/10 text-primary',
      package_updated: 'bg-blue-500/10 text-blue-500',
      class_scheduled: 'bg-accent-teal/10 text-accent-teal',
      schedule_created: 'bg-accent-teal/10 text-accent-teal',
      schedule_updated: 'bg-blue-500/10 text-blue-500',
      schedule_deleted: 'bg-destructive/10 text-destructive',
      check_in: 'bg-purple-500/10 text-purple-500',
      staff_created: 'bg-green-500/10 text-green-500',
      staff_invited: 'bg-blue-500/10 text-blue-500',
      promotion_created: 'bg-green-500/10 text-green-500',
      promotion_updated: 'bg-blue-500/10 text-blue-500',
      location_created: 'bg-green-500/10 text-green-500',
      location_updated: 'bg-blue-500/10 text-blue-500',
      role_updated: 'bg-orange-500/10 text-orange-500',
      announcement_created: 'bg-green-500/10 text-green-500',
    };
    return colors[eventType] || 'bg-muted text-muted-foreground';
  };

  const getEventTypeLabel = (eventType: string): string => {
    const key = `activityLog.eventTypes.${eventType}`;
    const translated = t(key);
    return translated !== key ? translated : eventType.replace(/_/g, ' ');
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

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <DateRangePicker
          startDate={dateRange.start}
          endDate={dateRange.end}
          onChange={(range) => {
            setDateRange(range);
            setPage(1);
          }}
        />

        <SearchBar
          placeholder={t('common.search')}
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          className="w-64"
        />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              {t('activityLog.filterByEvent')}
              {selectedEventTypes.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {selectedEventTypes.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">{t('activityLog.filterByEvent')}</span>
              {selectedEventTypes.length > 0 && (
                <Button variant="ghost" size="sm" className="h-auto p-0 text-xs" onClick={clearFilters}>
                  {t('activityLog.clearFilters')}
                </Button>
              )}
            </div>
            <div className="max-h-60 space-y-1.5 overflow-y-auto">
              {ALL_EVENT_TYPES.map((et) => (
                <label key={et} className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-muted">
                  <Checkbox
                    checked={selectedEventTypes.includes(et)}
                    onCheckedChange={() => toggleEventType(et)}
                  />
                  <span className="text-sm">{getEventTypeLabel(et)}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>
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
        <>
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('activityLog.dateTime')}</TableHead>
                  <TableHead>{t('activityLog.event')}</TableHead>
                  <TableHead>{t('activityLog.activity')}</TableHead>
                  <TableHead>{t('activityLog.staffMember')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {log.created_at
                        ? format(new Date(log.created_at), 'd MMM yyyy, HH:mm', { locale })
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={getEventTypeBadgeColor(log.event_type)}
                      >
                        {getEventTypeLabel(log.event_type)}
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

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t('activityLog.page')} {page} {t('activityLog.of')} {totalPages}
              {' '}({total} {t('activityLog.totalRecords')})
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                {t('common.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t('common.next')}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ActivityLog;
