import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useSupportTicket,
  useSupportTicketEvents,
  useSupportTicketNotes,
  useUpdateSupportTicket,
  useAddSupportTicketNote,
  useAssignableStaff,
  type SupportTicketPriority,
  type SupportTicketStatus,
} from '@/hooks/useSupportTickets';
import { PageHeader } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Mail, Phone, User, UserX, MessageSquare, AlertCircle, CheckCircle2, RefreshCw, UserCog, Flag, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDateLocale } from '@/lib/formatters';

const STATUSES: SupportTicketStatus[] = ['new', 'in_progress', 'resolved', 'closed'];
const PRIORITIES: SupportTicketPriority[] = ['low', 'normal', 'high', 'urgent'];

const statusColor: Record<SupportTicketStatus, string> = {
  new: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  in_progress: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  closed: 'bg-muted text-muted-foreground border-border',
};

const priorityColor: Record<SupportTicketPriority, string> = {
  low: 'bg-muted text-muted-foreground border-border',
  normal: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  high: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  urgent: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20',
};

const eventIcon: Record<string, React.ReactNode> = {
  status_changed: <RefreshCw className="h-4 w-4" />,
  priority_changed: <Flag className="h-4 w-4" />,
  assigned: <UserCog className="h-4 w-4" />,
  note_added: <MessageSquare className="h-4 w-4" />,
  reopened: <AlertCircle className="h-4 w-4" />,
  created: <CheckCircle2 className="h-4 w-4" />,
};

interface TimelineItem {
  id: string;
  kind: 'event' | 'note';
  created_at: string;
  actor_name: string | null;
  event_type?: string;
  from_value?: string | null;
  to_value?: string | null;
  body?: string;
}

const SupportTicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const locale = getDateLocale(language);

  const { data: ticket, isLoading } = useSupportTicket(id);
  const { data: events } = useSupportTicketEvents(id);
  const { data: notes } = useSupportTicketNotes(id);
  const { data: staff } = useAssignableStaff();
  const update = useUpdateSupportTicket();
  const addNote = useAddSupportTicketNote();

  const [note, setNote] = useState('');

  const staffNameById = useMemo(() => {
    const map = new Map<string, string>();
    (staff ?? []).forEach((s: any) => {
      map.set(s.id, [s.first_name, s.last_name].filter(Boolean).join(' ').trim() || '—');
    });
    return map;
  }, [staff]);

  const notesById = useMemo(() => {
    const map = new Map<string, string>();
    (notes ?? []).forEach((n) => map.set(n.id, n.body));
    return map;
  }, [notes]);

  const timeline: TimelineItem[] = useMemo(() => {
    const items: TimelineItem[] = [];
    if (ticket) {
      items.push({
        id: `ticket-${ticket.id}`,
        kind: 'event',
        created_at: ticket.created_at,
        actor_name: ticket.is_anonymous || !ticket.name ? null : ticket.name,
        event_type: 'created',
      });
    }
    (events ?? []).forEach((e) => {
      if (e.event_type === 'note_added') {
        const noteId = (e.metadata as any)?.note_id;
        const body = noteId ? notesById.get(noteId) : undefined;
        items.push({
          id: e.id,
          kind: 'note',
          created_at: e.created_at,
          actor_name: e.actor_name,
          event_type: 'note_added',
          body,
        });
      } else {
        items.push({
          id: e.id,
          kind: 'event',
          created_at: e.created_at,
          actor_name: e.actor_name,
          event_type: e.event_type,
          from_value: e.from_value,
          to_value: e.to_value,
        });
      }
    });
    return items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [ticket, events, notesById]);

  const renderEventLabel = (item: TimelineItem): string => {
    const label = (v?: string | null) => v ?? '—';
    switch (item.event_type) {
      case 'created': return t('support.timeline.created');
      case 'status_changed': return t('support.timeline.status_changed', {
        from: t(`support.status.${item.from_value || 'new'}`),
        to: t(`support.status.${item.to_value || 'new'}`),
      });
      case 'priority_changed': return t('support.timeline.priority_changed', {
        from: t(`support.priority.${item.from_value || 'normal'}`),
        to: t(`support.priority.${item.to_value || 'normal'}`),
      });
      case 'assigned': {
        const to = item.to_value ? (staffNameById.get(item.to_value) ?? label(item.to_value)) : t('support.admin.assignee.unassigned');
        return t('support.timeline.assigned', { to });
      }
      case 'reopened': return t('support.timeline.reopened');
      case 'note_added': return t('support.timeline.note_added');
      default: return item.event_type ?? '';
    }
  };

  const submitNote = async () => {
    if (!id || !note.trim()) return;
    await addNote.mutateAsync({ ticket_id: id, body: note });
    setNote('');
  };

  if (isLoading || !ticket) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/support-ticket')} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> {t('support.admin.detail.back')}
        </Button>
      </div>

      <PageHeader
        title={ticket.ticket_no}
        subtitle={ticket.subject}
      />

      <div className="flex flex-wrap items-center gap-2 -mt-2">
        <Badge variant="outline" className={statusColor[ticket.status]}>{t(`support.status.${ticket.status}`)}</Badge>
        <Badge variant="outline" className={priorityColor[ticket.priority]}>{t(`support.priority.${ticket.priority}`)}</Badge>
        <Badge variant="outline">{t(`support.category.${ticket.category}`)}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('support.admin.detail.requester')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                {ticket.is_anonymous || !ticket.name ? (
                  <UserX className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <User className="h-4 w-4 text-muted-foreground" />
                )}
                <span>{ticket.is_anonymous || !ticket.name ? t('support.public.anonymousShort') : ticket.name}</span>
                <Badge variant="outline">{t(`support.category.${ticket.category}`)}</Badge>
              </div>
              {ticket.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${ticket.phone}`} className="hover:underline">{ticket.phone}</a>
                </div>
              )}
              {ticket.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${ticket.email}`} className="hover:underline">{ticket.email}</a>
                </div>
              )}
              {!ticket.phone && !ticket.email && (
                <div className="text-xs text-muted-foreground">{t('support.admin.noContact')}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('support.public.message')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-sm">{ticket.message}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('support.admin.detail.timeline')}</CardTitle>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('support.admin.detail.timelineEmpty')}</p>
              ) : (
                <ol className="relative space-y-4 border-l border-border pl-5">
                  {timeline.map((item) => (
                    <li key={item.id} className="relative">
                      <span className="absolute -left-[26px] flex h-6 w-6 items-center justify-center rounded-full border bg-background text-muted-foreground">
                        {eventIcon[item.event_type ?? 'created'] ?? <MessageSquare className="h-4 w-4" />}
                      </span>
                      <div className="text-sm">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <span className="font-medium">{item.actor_name || t('support.admin.detail.system')}</span>
                          <span className="text-muted-foreground">{renderEventLabel(item)}</span>
                          <span
                            className="text-xs text-muted-foreground"
                            title={format(new Date(item.created_at), 'dd MMM yyyy HH:mm', { locale })}
                          >
                            · {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale })}
                          </span>
                        </div>
                        {item.kind === 'note' && item.body && (
                          <div className="mt-1.5 whitespace-pre-wrap rounded-md border bg-muted/40 p-2 text-sm">
                            {item.body}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('support.admin.detail.internalNotes')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('support.admin.detail.notePlaceholder')}
              />
              <div className="flex justify-end">
                <Button onClick={submitNote} disabled={!note.trim() || addNote.isPending} className="gap-2">
                  <Send className="h-4 w-4" />
                  {t('support.admin.detail.postNote')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('support.admin.detail.workflow')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>{t('support.admin.setStatus')}</Label>
                <Select
                  value={ticket.status}
                  onValueChange={(v) => update.mutate({ id: ticket.id, status: v as SupportTicketStatus })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{t(`support.status.${s}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>{t('support.admin.setPriority')}</Label>
                <Select
                  value={ticket.priority}
                  onValueChange={(v) => update.mutate({ id: ticket.id, priority: v as SupportTicketPriority })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>{t(`support.priority.${p}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>{t('support.admin.setAssignee')}</Label>
                <Select
                  value={ticket.assigned_to ?? 'unassigned'}
                  onValueChange={(v) => update.mutate({ id: ticket.id, assigned_to: v === 'unassigned' ? null : v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">{t('support.admin.assignee.unassigned')}</SelectItem>
                    {(staff ?? []).map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {[s.first_name, s.last_name].filter(Boolean).join(' ').trim() || '—'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => update.mutate({ id: ticket.id, assignToMe: true })}
                >
                  {t('support.admin.assignToMe')}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('support.admin.detail.metadata')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <MetaRow label={t('support.admin.detail.submittedAt')} value={format(new Date(ticket.created_at), 'dd MMM yyyy HH:mm', { locale })} />
              <MetaRow label={t('support.admin.detail.updatedAt')} value={format(new Date(ticket.updated_at), 'dd MMM yyyy HH:mm', { locale })} />
              {ticket.resolved_at && (
                <MetaRow label={t('support.admin.detail.resolvedAt')} value={format(new Date(ticket.resolved_at), 'dd MMM yyyy HH:mm', { locale })} />
              )}
              {ticket.closed_at && (
                <MetaRow label={t('support.admin.detail.closedAt')} value={format(new Date(ticket.closed_at), 'dd MMM yyyy HH:mm', { locale })} />
              )}
              <MetaRow label={t('support.admin.detail.source')} value={ticket.source} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const MetaRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-baseline justify-between gap-2">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className={cn('text-right')}>{value}</span>
  </div>
);

export default SupportTicketDetail;
