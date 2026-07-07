import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import i18n from '@/i18n';
import { logActivity } from '@/lib/activityLogger';
import { queryKeys } from '@/lib/queryKeys';

export interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ExpenseFilters {
  startDate?: Date;
  endDate?: Date;
}

export function useExpenses(filters: ExpenseFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.expenses(filters.startDate?.toISOString(), filters.endDate?.toISOString()),
    enabled: !!user,
    queryFn: async () => {
      let query = supabase.from('expenses').select('*');

      if (filters.startDate) {
        query = query.gte('date', filters.startDate.toISOString().split('T')[0]);
      }
      if (filters.endDate) {
        query = query.lte('date', filters.endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query.order('date', { ascending: false });
      if (error) throw error;
      return (data || []) as Expense[];
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expense: { date: string; category: string; amount: number; description?: string }) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert(expense as any)
        .select()
        .single();
      if (error) throw error;
      return data as Expense;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses() });
      logActivity({
        event_type: 'expense_created',
        activity: `Expense "${data?.category}" recorded (${data?.amount} THB)`,
        entity_type: 'expense',
        entity_id: data?.id,
        new_value: {
          category: data?.category,
          amount: data?.amount,
          date: data?.date,
          description: data?.description,
        },
      });
      toast.success(i18n.t('toast.expenseCreated'));
    },
    onError: () => {
      toast.error(i18n.t('toast.expenseCreateFailed'));
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Capture the row before deletion so the audit log has meaningful old_value.
      const { data: existing } = await supabase.from('expenses').select('*').eq('id', id).maybeSingle();
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      return existing as Expense | null;
    },
    onSuccess: (existing, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses() });
      logActivity({
        event_type: 'expense_deleted',
        activity: `Expense${existing ? ` "${existing.category}" (${existing.amount} THB)` : ''} deleted`,
        entity_type: 'expense',
        entity_id: id,
        old_value: existing
          ? { category: existing.category, amount: existing.amount, date: existing.date }
          : { id },
      });
      toast.success(i18n.t('toast.expenseDeleted'));
    },
    onError: () => {
      toast.error(i18n.t('toast.expenseDeleteFailed'));
    },
  });
}

export function computePnL(
  transactions: any[] | undefined,
  expenses: Expense[] | undefined
) {
  const revenue = {
    packages: 0,
    pt: 0,
    other: 0,
    total: 0,
  };

  (transactions || []).forEach((tx) => {
    if (tx.status !== 'paid') return;
    const amount = Number(tx.amount) || 0;
    const pkgType = tx.package?.type;
    if (pkgType === 'pt') {
      revenue.pt += amount;
    } else if (pkgType === 'unlimited' || pkgType === 'session') {
      revenue.packages += amount;
    } else {
      revenue.other += amount;
    }
    revenue.total += amount;
  });

  const expenseTotal = (expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const expensesByCategory = new Map<string, number>();
  (expenses || []).forEach((e) => {
    const cat = e.category || 'general';
    expensesByCategory.set(cat, (expensesByCategory.get(cat) || 0) + (Number(e.amount) || 0));
  });

  return {
    revenue,
    expenseTotal,
    expensesByCategory: Array.from(expensesByCategory.entries()).map(([category, amount]) => ({ category, amount })),
    netProfit: revenue.total - expenseTotal,
  };
}
