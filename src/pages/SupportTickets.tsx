import React, { useState } from 'react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useSupportTickets,
  useSupportTicketStats,
  useUpdateSupportTicket,
  type SupportTicket,
  type SupportTicketCategory,
  type SupportTicketStatus,
} from '@/hooks/useSupportTickets';
import { PageHeader, SearchBar, StatusTabs, EmptyState, type StatusTab } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import { LifeBuoy, Mail, Phone, User, UserX } from 'lucide-react';
import { getDateLocale } from '@/lib/formatters';

const STATUSES: SupportTicketStatus[] = ['new', 'in_progress', 'resolved', 'closed'];
const CATEGORIES: SupportTicketCategory[] = [
  'complaint',
  'facility',
  'trainer',
  'class',
  'billing',
  'membership',
  'cleanliness',
  'suggestion',
  'other',
];

const statusColor: Record<SupportTicketStatus, string> = {
  new: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  in_progress: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  closed: 'bg-muted text-muted-foreground border-border',
};

const SupportTickets: React.FC = () => {
  const { t, language } = useLanguage();
  const locale = getDateLocale(language);
  const [activeStatus, setActiveStatus] = useState<string>('new');
  const [category, setCategory] = useState<SupportTicketCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [draftStatus, setDraftStatus] = useState<SupportTicketStatus>('new');
  const [draftNote, setDraftNote] = useState('');

  const { data: tickets, isLoading } = useSupportTickets({
    status: activeStatus as SupportTicketStatus | 'all',
    category,
    search,
  });
  const { data: stats } = useSupportTicketStats();
  const updateMutation = useUpdateSupportTicket();

  const tabs: StatusTab[] = [
    { key: 'all', label: t('common.all'), count: stats?.total || 0 },
    { key: 'new', label: t('support.status.new'), count: stats?.new || 0, color: 'teal' },
    { key: 'in_progress', label: t('support.status.in_progress'), count: stats?.in_progress || 0 },
    { key: 'resolved', label: t('support.status.resolved'), count: stats?.resolved || 0 },
    { key: 'closed', label: t('support.status.closed'), count: stats?.closed || 0 },
  ];

  const openDetail = (row: SupportTicket) => {
    setSelected(row);
    setDraftStatus(row.status);
    setDraftNote(row.admin_note ?? '');
  };

  const saveChanges = async (opts?: { assignToMe?: boolean }) => {
    if (!selected) return;
    await updateMutation.mutateAsync({
      id: selected.id,
      status: draftStatus,
      admin_note: draftNote.trim() || null,
      assignToMe: opts?.assignToMe,
    });
    setSelected(null);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('support.admin.title')}
        subtitle={t('support.admin.description')}
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <StatusTabs tabs={tabs} activeTab={activeStatus} onChange={setActiveStatus} />
        <div className="flex items-center gap-2">
          <Select value={category} onValueChange={(v) => setCategory(v as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('support.admin.allCategories')}</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {t(`support.category.${c}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <SearchBar value={search} onChange={setSearch} placeholder={t('support.admin.searchPlaceholder')} />
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !tickets || tickets.length === 0 ? (
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
                <TableHead>{t('support.admin.col.category')}</TableHead>
                <TableHead>{t('support.admin.col.subject')}</TableHead>
                <TableHead>{t('support.admin.col.from')}</TableHead>
                <TableHead>{t('support.admin.col.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => openDetail(row)}
                >
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {format(new Date(row.created_at), 'dd MMM yyyy HH:mm', { locale })}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{row.ticket_no}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{t(`support.category.${row.category}`)}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[320px] truncate">{row.subject}</TableCell>
                  <TableCell>
                    {row.is_anonymous || !row.name ? (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <UserX className="h-3.5 w-3.5" />
                        {t('support.public.anonymousShort')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {row.name}
                      </span>
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
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span className="font-mono text-sm text-muted-foreground">{selected.ticket_no}</span>
                  <Badge variant="outline" className={statusColor[selected.status]}>
                    {t(`support.status.${selected.status}`)}
                  </Badge>
                </SheetTitle>
                <SheetDescription>{selected.subject}</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {t('support.admin.col.category')}
                    </div>
                    <div>{t(`support.category.${selected.category}`)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {t('support.admin.col.date')}
                    </div>
                    <div>{format(new Date(selected.created_at), 'dd MMM yyyy HH:mm', { locale })}</div>
                  </div>
                </div>

                <div className="rounded-lg border p-3 text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    {selected.is_anonymous || !selected.name ? (
                      <UserX className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span>
                      {selected.is_anonymous || !selected.name
                        ? t('support.public.anonymousShort')
                        : selected.name}
                    </span>
                  </div>
                  {selected.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${selected.phone}`} className="hover:underline">
                        {selected.phone}
                      </a>
                    </div>
                  )}
                  {selected.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${selected.email}`} className="hover:underline">
                        {selected.email}
                      </a>
                    </div>
                  )}
                  {!selected.phone && !selected.email && (
                    <div className="text-xs text-muted-foreground">
                      {t('support.admin.noContact')}
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-1 text-xs font-medium text-muted-foreground">
                    {t('support.public.message')}
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                    {selected.message}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>{t('support.admin.setStatus')}</Label>
                  <Select value={draftStatus} onValueChange={(v) => setDraftStatus(v as SupportTicketStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {t(`support.status.${s}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="admin-note">{t('support.admin.internalNote')}</Label>
                  <Textarea
                    id="admin-note"
                    rows={4}
                    value={draftNote}
                    onChange={(e) => setDraftNote(e.target.value)}
                    placeholder={t('support.admin.internalNotePlaceholder')}
                  />
                </div>

                <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => saveChanges({ assignToMe: true })}
                    disabled={updateMutation.isPending}
                  >
                    {t('support.admin.assignToMe')}
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => saveChanges()}
                    disabled={updateMutation.isPending}
                  >
                    {t('support.admin.save')}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default SupportTickets;
