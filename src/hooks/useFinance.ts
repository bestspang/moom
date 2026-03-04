import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { logActivity } from '@/lib/activityLogger';

type Transaction = Tables<'transactions'>;
type TransactionUpdate = TablesUpdate<'transactions'>;

interface FinanceFilters {
  startDate?: Date;
  endDate?: Date;
  search?: string;
  status?: string;
}

export const useFinanceTransactions = (filters: FinanceFilters) => {
  return useQuery({
    queryKey: ['finance-transactions', filters],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          member:members(id, first_name, last_name),
          package:packages(id, name_en, name_th)
        `);
      
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }
      
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }
      
      if (filters.search) {
        query = query.or(`transaction_id.ilike.%${filters.search}%,order_name.ilike.%${filters.search}%`);
      }
      
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status as Transaction['status']);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

export const useFinanceStats = (startDate?: Date, endDate?: Date) => {
  return useQuery({
    queryKey: ['finance-stats', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select('amount, status');
      
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const stats = {
        transactions: data?.length || 0,
        totalSales: 0,
        netIncome: 0,
        refunds: 0,
      };
      
      data?.forEach((tx) => {
        if (tx.status === 'paid') {
          stats.totalSales += Number(tx.amount);
          stats.netIncome += Number(tx.amount);
        } else if (tx.status === 'voided') {
          stats.refunds += Number(tx.amount);
        }
      });
      
      return stats;
    },
  });
};

export const useTransferSlips = (filters: FinanceFilters & { slipStatus?: string }) => {
  return useQuery({
    queryKey: ['transfer-slips', filters],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          member:members(id, first_name, last_name),
          package:packages(id, name_en, name_th, type)
        `)
        .eq('payment_method', 'bank_transfer');
      
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }
      
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }
      
      if (filters.search) {
        query = query.or(`transaction_id.ilike.%${filters.search}%,order_name.ilike.%${filters.search}%`);
      }
      
      if (filters.slipStatus && filters.slipStatus !== 'all') {
        query = query.eq('status', filters.slipStatus as Transaction['status']);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

export const useTransferSlipStats = () => {
  return useQuery({
    queryKey: ['transfer-slip-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('status')
        .eq('payment_method', 'bank_transfer');
      
      if (error) throw error;
      
      const stats = {
        needs_review: 0,
        paid: 0,
        voided: 0,
      };
      
      data?.forEach((tx) => {
        if (tx.status === 'needs_review') stats.needs_review++;
        else if (tx.status === 'paid') stats.paid++;
        else if (tx.status === 'voided') stats.voided++;
      });
      
      return stats;
    },
  });
};

export const useUpdateTransactionStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Transaction['status'] }) => {
      const { data, error } = await supabase
        .from('transactions')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['finance-stats'] });
      queryClient.invalidateQueries({ queryKey: ['transfer-slips'] });
      queryClient.invalidateQueries({ queryKey: ['transfer-slip-stats'] });
      logActivity({
        event_type: 'transaction_status_updated',
        activity: `Transaction ${data.transaction_id} status changed to ${variables.status}`,
        entity_type: 'transaction',
        entity_id: variables.id,
        new_value: { status: variables.status },
      });
      toast.success('Transaction status updated');
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });
};
