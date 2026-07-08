import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import i18n from '@/i18n';
import { queryKeys } from '@/lib/queryKeys';
import { logActivity } from '@/lib/activityLogger';

export type SupportTicketStatus = 'new' | 'in_progress' | 'resolved' | 'closed';
export type SupportTicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type SupportTicketCategory =
  | 'complaint'
  | 'facility'
  | 'trainer'
  | 'class'
  | 'billing'
  | 'membership'
  | 'cleanliness'
  | 'suggestion'
  | 'other';

export interface SupportTicket {
  id: string;
  ticket_no: string;
  name: string | null;
  is_anonymous: boolean;
  phone: string | null;
  email: string | null;
  category: SupportTicketCategory;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  assigned_to: string | null;
  admin_note: string | null;
  handled_by: string | null;
  handled_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface SupportTicketEvent {
  id: string;
  ticket_id: string;
  actor_user_id: string | null;
  actor_name: string | null;
  event_type: 'created' | 'status_changed' | 'priority_changed' | 'assigned' | 'note_added' | 'reopened';
  from_value: string | null;
  to_value: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface SupportTicketNote {
  id: string;
  ticket_id: string;
  author_user_id: string | null;
  author_name: string | null;
  body: string;
  created_at: string;
}

export interface SupportTicketFilters {
  status?: SupportTicketStatus | 'all';
  category?: SupportTicketCategory | 'all';
  priority?: SupportTicketPriority | 'all';
  assigned_to?: string | 'me' | 'unassigned' | 'all';
  date_from?: string | null;
  date_to?: string | null;
  search?: string;
  page?: number;
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 25;

export const useSupportTickets = (filters: SupportTicketFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.supportTickets(filters),
    queryFn: async (): Promise<{ rows: SupportTicket[]; total: number }> => {
      const page = filters.page ?? 1;
      const size = filters.pageSize ?? DEFAULT_PAGE_SIZE;
      const from = (page - 1) * size;
      const to = from + size - 1;

      let q = supabase
        .from('support_tickets' as any)
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (filters.status && filters.status !== 'all') q = q.eq('status', filters.status);
      if (filters.category && filters.category !== 'all') q = q.eq('category', filters.category);
      if (filters.priority && filters.priority !== 'all') q = q.eq('priority', filters.priority);

      if (filters.assigned_to && filters.assigned_to !== 'all') {
        if (filters.assigned_to === 'unassigned') q = q.is('assigned_to', null);
        else if (filters.assigned_to === 'me') {
          const { data: { user } } = await supabase.auth.getUser();
          // assigned_to references staff.id → resolve staff for this user
          if (user?.id) {
            const { data: staffRow } = await supabase
              .from('staff')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle();
            if (staffRow?.id) q = q.eq('assigned_to', staffRow.id);
            else q = q.eq('assigned_to', '00000000-0000-0000-0000-000000000000');
          }
        } else q = q.eq('assigned_to', filters.assigned_to);
      }

      if (filters.date_from) q = q.gte('created_at', filters.date_from);
      if (filters.date_to) q = q.lte('created_at', filters.date_to);

      if (filters.search && filters.search.trim()) {
        const s = filters.search.trim().replace(/[%,]/g, '');
        q = q.or(
          `ticket_no.ilike.%${s}%,subject.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%,name.ilike.%${s}%`,
        );
      }
      const { data, error, count } = await q;
      if (error) throw error;
      return { rows: (data ?? []) as unknown as SupportTicket[], total: count ?? 0 };
    },
    staleTime: 15_000,
  });
};

export const useSupportTicketStats = () => {
  return useQuery({
    queryKey: [...queryKeys.supportTickets(), 'stats'] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets' as any)
        .select('status');
      if (error) throw error;
      const rows = (data ?? []) as unknown as { status: SupportTicketStatus }[];
      return {
        total: rows.length,
        new: rows.filter((r) => r.status === 'new').length,
        in_progress: rows.filter((r) => r.status === 'in_progress').length,
        resolved: rows.filter((r) => r.status === 'resolved').length,
        closed: rows.filter((r) => r.status === 'closed').length,
      };
    },
    staleTime: 15_000,
  });
};

export const useSupportTicket = (id: string | null | undefined) => {
  return useQuery({
    queryKey: queryKeys.supportTicket(id ?? ''),
    enabled: !!id,
    queryFn: async (): Promise<SupportTicket> => {
      const { data, error } = await supabase
        .from('support_tickets' as any)
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as unknown as SupportTicket;
    },
  });
};

export const useSupportTicketEvents = (id: string | null | undefined) => {
  return useQuery({
    queryKey: queryKeys.supportTicketEvents(id ?? ''),
    enabled: !!id,
    queryFn: async (): Promise<SupportTicketEvent[]> => {
      const { data, error } = await supabase
        .from('support_ticket_events' as any)
        .select('*')
        .eq('ticket_id', id!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as SupportTicketEvent[];
    },
  });
};

export const useSupportTicketNotes = (id: string | null | undefined) => {
  return useQuery({
    queryKey: queryKeys.supportTicketNotes(id ?? ''),
    enabled: !!id,
    queryFn: async (): Promise<SupportTicketNote[]> => {
      const { data, error } = await supabase
        .from('support_ticket_notes' as any)
        .select('*')
        .eq('ticket_id', id!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as SupportTicketNote[];
    },
  });
};

export const useAssignableStaff = () => {
  return useQuery({
    queryKey: queryKeys.supportTicketStaff(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('id, first_name, last_name, user_id, status')
        .eq('status', 'active')
        .order('first_name');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });
};

const invalidateTicket = (qc: ReturnType<typeof useQueryClient>, id: string) => {
  qc.invalidateQueries({ queryKey: ['support-tickets'] });
  qc.invalidateQueries({ queryKey: queryKeys.supportTicket(id) });
  qc.invalidateQueries({ queryKey: queryKeys.supportTicketEvents(id) });
};

export const useUpdateSupportTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      priority,
      assigned_to,
      admin_note,
      assignToMe,
    }: {
      id: string;
      status?: SupportTicketStatus;
      priority?: SupportTicketPriority;
      assigned_to?: string | null;
      admin_note?: string | null;
      assignToMe?: boolean;
    }) => {
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (status !== undefined) patch.status = status;
      if (priority !== undefined) patch.priority = priority;
      if (assigned_to !== undefined) patch.assigned_to = assigned_to;
      if (admin_note !== undefined) patch.admin_note = admin_note;
      if (assignToMe) {
        const { data: { user } } = await supabase.auth.getUser();
        patch.handled_by = user?.id ?? null;
        patch.handled_at = new Date().toISOString();
        if (user?.id) {
          const { data: staffRow } = await supabase
            .from('staff')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          if (staffRow?.id) patch.assigned_to = staffRow.id;
        }
      }
      const { data, error } = await supabase
        .from('support_tickets' as any)
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data as unknown as SupportTicket;
    },
    onSuccess: (t) => {
      invalidateTicket(qc, t.id);
      logActivity({
        event_type: 'support_ticket.updated',
        activity: `Support ticket ${t.ticket_no} updated`,
        entity_type: 'support_ticket',
        entity_id: t.id,
        new_value: { status: t.status, priority: t.priority, assigned_to: t.assigned_to },
      });
      toast.success(i18n.t('support.admin.updated'));
    },
    onError: (err) => {
      console.error('[useUpdateSupportTicket] update failed', err);
      toast.error(i18n.t('support.admin.updateFailed'));
    },
  });
};

export const useAddSupportTicketNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticket_id, body }: { ticket_id: string; body: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      let author_name: string | null = null;
      if (user?.id) {
        const { data: staffRow } = await supabase
          .from('staff')
          .select('first_name, last_name')
          .eq('user_id', user.id)
          .maybeSingle();
        if (staffRow) {
          author_name = [staffRow.first_name, staffRow.last_name].filter(Boolean).join(' ').trim() || null;
        }
      }
      const { data, error } = await supabase
        .from('support_ticket_notes' as any)
        .insert({
          ticket_id,
          author_user_id: user?.id ?? null,
          author_name,
          body: body.trim(),
        })
        .select('*')
        .single();
      if (error) throw error;
      return data as unknown as SupportTicketNote;
    },
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: queryKeys.supportTicketNotes(n.ticket_id) });
      qc.invalidateQueries({ queryKey: queryKeys.supportTicketEvents(n.ticket_id) });
      logActivity({
        event_type: 'support_ticket.note_added',
        activity: 'Internal note added to support ticket',
        entity_type: 'support_ticket',
        entity_id: n.ticket_id,
      });
      toast.success(i18n.t('support.admin.noteAdded'));
    },
    onError: (err) => {
      console.error('[useAddSupportTicketNote] insert failed', err);
      toast.error(i18n.t('support.admin.noteFailed'));
    },
  });
};
