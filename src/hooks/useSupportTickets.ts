import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import i18n from '@/i18n';
import { queryKeys } from '@/lib/queryKeys';
import { logActivity } from '@/lib/activityLogger';

export type SupportTicketStatus = 'new' | 'in_progress' | 'resolved' | 'closed';
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
  admin_note: string | null;
  handled_by: string | null;
  handled_at: string | null;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface SupportTicketFilters {
  status?: SupportTicketStatus | 'all';
  category?: SupportTicketCategory | 'all';
  search?: string;
}

export const useSupportTickets = (filters: SupportTicketFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.supportTickets(filters),
    queryFn: async (): Promise<SupportTicket[]> => {
      let q = supabase
        .from('support_tickets' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (filters.status && filters.status !== 'all') q = q.eq('status', filters.status);
      if (filters.category && filters.category !== 'all') q = q.eq('category', filters.category);
      if (filters.search && filters.search.trim()) {
        const s = filters.search.trim().replace(/[%,]/g, '');
        q = q.or(
          `ticket_no.ilike.%${s}%,subject.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%,name.ilike.%${s}%`,
        );
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as SupportTicket[];
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

export const useUpdateSupportTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      admin_note,
      assignToMe,
    }: {
      id: string;
      status?: SupportTicketStatus;
      admin_note?: string | null;
      assignToMe?: boolean;
    }) => {
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (status !== undefined) patch.status = status;
      if (admin_note !== undefined) patch.admin_note = admin_note;
      if (assignToMe) {
        const { data: { user } } = await supabase.auth.getUser();
        patch.handled_by = user?.id ?? null;
        patch.handled_at = new Date().toISOString();
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
      qc.invalidateQueries({ queryKey: ['support-tickets'] });
      logActivity({
        event_type: 'support_ticket.updated',
        activity: `Support ticket ${t.ticket_no} updated`,
        entity_type: 'support_ticket',
        entity_id: t.id,
        new_value: { status: t.status, admin_note: t.admin_note, handled_by: t.handled_by },
      });
      toast.success(i18n.t('support.admin.updated'));
    },
    onError: (err) => {
      console.error('[useUpdateSupportTicket] update failed', err);
      toast.error(i18n.t('support.admin.updateFailed'));
    },
  });
};
