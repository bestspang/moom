import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import i18n from '@/i18n';
import { logActivity } from '@/lib/activityLogger';
import { useAuth } from '@/contexts/AuthContext';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface TransferSlipFilters {
  startDate?: Date;
  endDate?: Date;
  search?: string;
  status?: string;
}

export interface ApproveSlipPayload {
  slipId: string;
  packageId?: string;
  note?: string;
}

/* ------------------------------------------------------------------ */
/*  List + Stats                                                       */
/* ------------------------------------------------------------------ */

export const useTransferSlipsList = (filters: TransferSlipFilters) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['transfer-slips', filters],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from('transfer_slips')
        .select(`
          *,
          member:members(id, first_name, last_name, phone),
          package:packages(id, name_en, name_th, type),
          location:locations(id, name),
          reviewer:staff!transfer_slips_reviewer_staff_id_fkey(id, first_name, last_name),
          linked_transaction:transactions!transfer_slips_linked_transaction_id_fkey(id, transaction_id, order_name, amount, status)
        `);

      if (filters.startDate) {
        query = query.gte('slip_datetime', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte('slip_datetime', filters.endDate.toISOString());
      }
      if (filters.search) {
        const s = `%${filters.search}%`;
        query = query.or(`member_name_text.ilike.${s},member_phone_text.ilike.${s},bank_reference.ilike.${s}`);
      }
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status as any);
      }

      const { data, error } = await query.order('slip_datetime', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useTransferSlipStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['transfer-slip-stats'],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transfer_slips')
        .select('status');

      if (error) throw error;

      const stats = { needs_review: 0, approved: 0, rejected: 0, voided: 0 };
      data?.forEach((row) => {
        const s = row.status as keyof typeof stats;
        if (s in stats) stats[s]++;
      });
      return stats;
    },
  });
};

export const useTransferSlipDetail = (id: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['transfer-slip-detail', id],
    enabled: !!user && !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transfer_slips')
        .select(`
          *,
          member:members(id, first_name, last_name, phone, email),
          package:packages(id, name_en, name_th, type, price, sessions, term_days, expiration_days),
          location:locations(id, name),
          reviewer:staff!transfer_slips_reviewer_staff_id_fkey(id, first_name, last_name),
          linked_transaction:transactions!transfer_slips_linked_transaction_id_fkey(id, transaction_id, order_name, amount, status, payment_method)
        `)
        .eq('id', id!)
        .single();

      if (error) throw error;
      return data;
    },
  });
};

/* ------------------------------------------------------------------ */
/*  Activity log for a slip                                            */
/* ------------------------------------------------------------------ */

export const useSlipActivityLog = (slipId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['slip-activity-log', slipId],
    enabled: !!user && !!slipId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('entity_type', 'transfer_slip')
        .eq('entity_id', slipId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

/* ------------------------------------------------------------------ */
/*  Approve                                                            */
/* ------------------------------------------------------------------ */

export const useApproveSlip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slipId, packageId, note }: ApproveSlipPayload) => {
      const { data, error } = await supabase.functions.invoke('approve-slip', {
        body: { slipId, packageId, note },
      });

      if (error) throw new Error(error.message || 'Failed to approve slip');

      // Edge function returns { data, message } or { error }
      const result = typeof data === 'string' ? JSON.parse(data) : data;
      if (result.error) throw new Error(result.error);

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer-slips'] });
      queryClient.invalidateQueries({ queryKey: ['transfer-slip-stats'] });
      queryClient.invalidateQueries({ queryKey: ['transfer-slip-detail'] });
      queryClient.invalidateQueries({ queryKey: ['slip-activity-log'] });
      queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });
      toast.success(i18n.t('toast.slipApproved'));
    },
    onError: (error) => {
      toast.error(i18n.t('toast.slipApproveFailed'));
    },
  });
};

/* ------------------------------------------------------------------ */
/*  Reject                                                             */
/* ------------------------------------------------------------------ */

export const useRejectSlip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slipId, reviewNote }: { slipId: string; reviewNote: string }) => {
      if (!reviewNote.trim()) throw new Error('Review note is required for rejection');

      // Look up staff record for current user
      const { data: { user } } = await supabase.auth.getUser();
      let reviewerStaffId: string | null = null;
      if (user) {
        const { data: staffRow } = await supabase
          .from('staff')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        reviewerStaffId = staffRow?.id || null;
      }

      const { data, error } = await supabase
        .from('transfer_slips')
        .update({
          status: 'rejected' as any,
          reviewed_at: new Date().toISOString(),
          review_note: reviewNote,
          ...(reviewerStaffId && { reviewer_staff_id: reviewerStaffId }),
        })
        .eq('id', slipId)
        .select()
        .single();

      if (error) throw error;

      logActivity({
        event_type: 'transfer_slip.rejected',
        activity: `Transfer slip rejected. Reason: ${reviewNote}`,
        entity_type: 'transfer_slip',
        entity_id: slipId,
        new_value: { status: 'rejected', review_note: reviewNote },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer-slips'] });
      queryClient.invalidateQueries({ queryKey: ['transfer-slip-stats'] });
      queryClient.invalidateQueries({ queryKey: ['transfer-slip-detail'] });
      queryClient.invalidateQueries({ queryKey: ['slip-activity-log'] });
      toast.success('Slip rejected');
    },
    onError: (error) => {
      toast.error(`Failed to reject slip: ${error.message}`);
    },
  });
};

/* ------------------------------------------------------------------ */
/*  Void                                                               */
/* ------------------------------------------------------------------ */

export const useVoidSlip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slipId, reviewNote }: { slipId: string; reviewNote?: string }) => {
      // Look up staff record for current user
      const { data: { user } } = await supabase.auth.getUser();
      let reviewerStaffId: string | null = null;
      if (user) {
        const { data: staffRow } = await supabase
          .from('staff')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        reviewerStaffId = staffRow?.id || null;
      }

      // Fetch slip to get linked transaction
      const { data: slip, error: slipErr } = await supabase
        .from('transfer_slips')
        .select('*, linked_transaction:transactions!transfer_slips_linked_transaction_id_fkey(id, transaction_id)')
        .eq('id', slipId)
        .single();

      if (slipErr) throw slipErr;
      if (slip.status !== 'approved') throw new Error('Only approved slips can be voided');

      // Void the linked transaction
      if (slip.linked_transaction_id) {
        await supabase
          .from('transactions')
          .update({ status: 'voided' })
          .eq('id', slip.linked_transaction_id);
      }

      // Void the slip
      const { data, error } = await supabase
        .from('transfer_slips')
        .update({
          status: 'voided' as any,
          reviewed_at: new Date().toISOString(),
          review_note: reviewNote || null,
          ...(reviewerStaffId && { reviewer_staff_id: reviewerStaffId }),
        })
        .eq('id', slipId)
        .select()
        .single();

      if (error) throw error;

      logActivity({
        event_type: 'transfer_slip.voided',
        activity: `Transfer slip voided.${slip.linked_transaction?.transaction_id ? ` Transaction ${slip.linked_transaction.transaction_id} also voided.` : ''}`,
        entity_type: 'transfer_slip',
        entity_id: slipId,
        new_value: { status: 'voided', review_note: reviewNote },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer-slips'] });
      queryClient.invalidateQueries({ queryKey: ['transfer-slip-stats'] });
      queryClient.invalidateQueries({ queryKey: ['transfer-slip-detail'] });
      queryClient.invalidateQueries({ queryKey: ['slip-activity-log'] });
      queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });
      toast.success('Slip voided');
    },
    onError: (error) => {
      toast.error(`Failed to void slip: ${error.message}`);
    },
  });
};
