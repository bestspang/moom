import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { logActivity } from '@/lib/activityLogger';
import { useAuth } from '@/contexts/AuthContext';

type Transaction = Tables<'transactions'>;

export interface FinanceFilters {
  startDate?: Date;
  endDate?: Date;
  search?: string;
  status?: string;
  paymentMethod?: string;
}

export const useFinanceTransactions = (filters: FinanceFilters) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['finance-transactions', filters],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          member:members(id, first_name, last_name, phone),
          package:packages(id, name_en, name_th, type),
          location:locations(id, name),
          staff:staff(id, first_name, last_name)
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

      if (filters.paymentMethod && filters.paymentMethod !== 'all') {
        query = query.eq('payment_method', filters.paymentMethod as Transaction['payment_method']);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

/** Compute KPI stats from the already-fetched transaction list — guarantees consistency with table */
export function computeFinanceStats(transactions: any[] | undefined) {
  const stats = {
    transactions: 0,
    totalSales: 0,
    netIncome: 0,
    refunds: 0,
  };

  if (!transactions) return stats;

  stats.transactions = transactions.length;

  transactions.forEach((tx) => {
    const amount = Number(tx.amount) || 0;
    if (tx.status === 'paid') {
      stats.totalSales += amount;
      stats.netIncome += amount;
    } else if (tx.status === 'voided' || tx.status === 'refunded') {
      stats.refunds += amount;
    }
  });

  return stats;
}

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
