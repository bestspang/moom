import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useSupportTickets,
  useSupportTicketStats,
  useAssignableStaff,
  type SupportTicketCategory,
  type SupportTicketPriority,
  type SupportTicketStatus,
} from '@/hooks/useSupportTickets';
import { PageHeader, SearchBar, StatusTabs, EmptyState, type StatusTab } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, ChevronLeft, ChevronRight, LifeBuoy, User, UserX, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDateLocale } from '@/lib/formatters';

const CATEGORIES: SupportTicketCategory[] = [
  'complaint', 'facility', 'trainer', 'class', 'billing',
  'membership', 'cleanliness', 'suggestion', 'other',
];
const PRIORITIES: SupportTicketPriority[] = ['low', 'normal', 'high', 'urgent'];
const PAGE_SIZE = 25;

const statusColor: Record<SupportTicketStatus, string> = {
  new: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  in_progress: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  closed: 'bg-muted text-muted-foreground border-border',
};

const priorityDot: Record<SupportTicketPriority, string> = {
  low: 'bg-muted-foreground/40',
  normal: 'bg-blue-500',
  high: 'bg-amber-500',
  urgent: 'bg-red-500',
};

const SupportTickets: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const locale = getDateLocale(language);
  const [params, setParams] = useSearchParams();

  const activeStatus = params.get('status') || 'new';
  const category = (params.get('category') as SupportTicketCategory | 'all') || 'all';
  const priority = (params.get('priority') as SupportTicketPriority | 'all') || 'all';
  const assignedTo = params.get('assigned') || 'all';
  const search = params.get('q') || '';
  const dateFrom = params.get('from') || '';
  const dateTo = params.get('to') || '';
  const page = Math.max(1, parseInt(params.get('page') || '1', 10));

  const setParam = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === '' || v === 'all') next.delete(k);
      else next.set(k, v);
    });
    // reset page when filters change
    if (!('page' in patch)) next.delete('page');
    setParams(next, { replace: true });
  };

  const { data: staff } = useAssignableStaff();
  const { data: stats } = useSupportTicketStats();
  const { data, isLoading } = useSupportTickets({
    status: activeStatus as SupportTicketStatus | 'all',
    category,
    priority,
    assigned_to: assignedTo as any,
    date_from: dateFrom ? new Date(dateFrom + 'T00:00:00').toISOString() : null,
    date_to: dateTo ? new Date(dateTo + 'T23:59:59').toISOString() : null,
    search,
    page,
    pageSize: PAGE_SIZE,
  });

  const tickets = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const staffNameById = useMemo(() => {
    const map = new Map<string, string>();
    (staff ?? []).forEach((s: any) => {
      map.set(s.id, [s.first_name, s.last_name].filter(Boolean).join(' ').trim() || '—');
    });
    return map;
  }, [staff]);

  const tabs: StatusTab[] = [
    { key: 'all', label: t('common.all'), count: stats?.total || 0 },
    { key: 'new', label: t('support.status.new'), count: stats?.new || 0, color: 'teal' },
    { key: 'in_progress', label: t('support.status.in_progress'), count: stats?.in_progress || 0 },
    { key: 'resolved', label: t('support.status.resolved'), count: stats?.resolved || 0 },
    { key: 'closed', label: t('support.status.closed'), count: stats?.closed || 0 },
  ];

  const hasFilters = category !== 'all' || priority !== 'all' || assignedTo !== 'all' || dateFrom || dateTo || search;

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('support.admin.title')}
        subtitle={t('support.admin.description')}
      />

      <div className="flex flex-col gap-3">
        <StatusTabs tabs={tabs} activeTab={activeStatus} onChange={(s) => setParam({ status: s })} />

        <div className="flex flex-wrap items-center gap-2">
          <Select value={category} onValueChange={(v) => setParam({ category: v })}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder={t('support.admin.allCategories')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('support.admin.allCategories')}</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{t(`support.category.${c}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priority} onValueChange={(v) => setParam({ priority: v })}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('support.admin.allPriorities')}</SelectItem>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>{t(`support.priority.${p}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={assignedTo} onValueChange={(v) => setParam({ assigned: v })}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('support.admin.assignee.all')}</SelectItem>
              <SelectItem value="me">{t('support.admin.assignee.me')}</SelectItem>
              <SelectItem value="unassigned">{t('support.admin.assignee.unassigned')}</SelectItem>
              {(staff ?? []).map((s: any) => (
                <SelectItem key={s.id} value={s.id}>
                  {[s.first_name, s.last_name].filter(Boolean).join(' ').trim() || '—'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('gap-2', !dateFrom && 'text-muted-foreground')}>
                <CalendarIcon className="h-4 w-4" />
                {dateFrom ? format(new Date(dateFrom), 'dd MMM', { locale }) : t('support.admin.dateFrom')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom ? new Date(dateFrom) : undefined}
                onSelect={(d) => setParam({ from: d ? format(d, 'yyyy-MM-dd') : null })}
                initialFocus
                className={cn('p-3 pointer-events-auto')}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('gap-2', !dateTo && 'text-muted-foreground')}>
                <CalendarIcon className="h-4 w-4" />
                {dateTo ? format(new Date(dateTo), 'dd MMM', { locale }) : t('support.admin.dateTo')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo ? new Date(dateTo) : undefined}
                onSelect={(d) => setParam({ to: d ? format(d, 'yyyy-MM-dd') : null })}
                initialFocus
                className={cn('p-3 pointer-events-auto')}
              />
            </PopoverContent>
          </Popover>

          <SearchBar value={search} onChange={(v) => setParam({ q: v })} placeholder={t('support.admin.searchPlaceholder')} />

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={() => setParams(new URLSearchParams({ status: activeStatus }), { replace: true })} className="gap-1">
              <X className="h-3.5 w-3.5" /> {t('support.admin.clearFilters')}
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={<LifeBuoy className="h-12 w-12" />}
            message={t('support.admin.emptyTitle')}
            description={t('support.admin.emptyDesc')}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('support.admin.col.date')}</TableHead>
                <TableHead>{t('support.admin.col.ticketNo')}</TableHead>
                <TableHead>{t('support.admin.col.priority')}</TableHead>
                <TableHead>{t('support.admin.col.category')}</TableHead>
                <TableHead>{t('support.admin.col.subject')}</TableHead>
                <TableHead>{t('support.admin.col.from')}</TableHead>
                <TableHead>{t('support.admin.col.assignee')}</TableHead>
                <TableHead>{t('support.admin.col.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/support-ticket/${row.id}`)}
                >
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {format(new Date(row.created_at), 'dd MMM yyyy HH:mm', { locale })}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{row.ticket_no}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-2 text-xs">
                      <span className={cn('h-2 w-2 rounded-full', priorityDot[row.priority])} />
                      {t(`support.priority.${row.priority}`)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{t(`support.category.${row.category}`)}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[280px] truncate">{row.subject}</TableCell>
                  <TableCell>
                    {row.is_anonymous || !row.name ? (
                      <span className="inline-flex items-center gap-1 text-muted-foreground text-sm">
                        <UserX className="h-3.5 w-3.5" />{t('support.public.anonymousShort')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm">
                        <User className="h-3.5 w-3.5" />{row.name}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {row.assigned_to ? (staffNameById.get(row.assigned_to) ?? '—') : (
                      <span className="text-muted-foreground">{t('support.admin.assignee.unassigned')}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColor[row.status]}>
                      {t(`support.status.${row.status}`)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {tickets.length > 0 && (
          <div className="flex items-center justify-between border-t p-3 text-sm text-muted-foreground">
            <div>
              {t('support.admin.showing', {
                from: (page - 1) * PAGE_SIZE + 1,
                to: Math.min(page * PAGE_SIZE, total),
                total,
              })}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setParam({ page: String(page - 1) })} disabled={page <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span>{page} / {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setParam({ page: String(page + 1) })} disabled={page >= totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportTickets;
