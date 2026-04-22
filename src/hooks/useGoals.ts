import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logActivity } from '@/lib/activityLogger';
import { queryKeys } from '@/lib/queryKeys';

export type GoalType = 'revenue' | 'new_members' | 'retention' | 'checkins';

export interface Goal {
  id: string;
  type: GoalType;
  target_value: number;
  period_start: string;
  period_end: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoalWithProgress extends Goal {
  current_value: number;
  progress: number; // 0-100
}

export function useGoals() {
  return useQuery({
    queryKey: queryKeys.goals(),
    queryFn: async () => {
      const now = new Date().toISOString().slice(0, 10);

      // Fetch active goals (current period)
      const { data: goals, error } = await supabase
        .from('goals')
        .select('*')
        .lte('period_start', now)
        .gte('period_end', now)
        .order('type');

      if (error) throw error;

      // Compute current values for each goal
      const results: GoalWithProgress[] = [];
      for (const g of (goals || []) as Goal[]) {
        let current_value = 0;

        if (g.type === 'revenue') {
          const { data } = await supabase
            .from('transactions')
            .select('amount')
            .gte('created_at', g.period_start)
            .lte('created_at', g.period_end + 'T23:59:59')
            .eq('status', 'paid');
          current_value = (data || []).reduce((sum, t) => sum + Number(t.amount), 0);
        } else if (g.type === 'new_members') {
          const { count } = await supabase
            .from('members')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', g.period_start)
            .lte('created_at', g.period_end + 'T23:59:59');
          current_value = count || 0;
        } else if (g.type === 'checkins') {
          const { count } = await supabase
            .from('member_attendance')
            .select('id', { count: 'exact', head: true })
            .gte('check_in_time', g.period_start)
            .lte('check_in_time', g.period_end + 'T23:59:59');
          current_value = count || 0;
        } else if (g.type === 'retention') {
          // Retention = % of members with active packages
          const { count: activeWithPkg } = await supabase
            .from('member_packages')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'active');
          const { count: totalActive } = await supabase
            .from('members')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'active');
          current_value = totalActive ? Math.round(((activeWithPkg || 0) / totalActive) * 100) : 0;
        }

        const progress = g.target_value > 0
          ? Math.min(100, Math.round((current_value / Number(g.target_value)) * 100))
          : 0;

        results.push({ ...g, current_value, progress });
      }

      return results;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (goal: Omit<Goal, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('goals')
        .insert({ ...goal, created_by: user?.id } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.goals() });
      logActivity({
        event_type: 'goal_created',
        activity: 'Goal created',
        entity_type: 'goal',
      });
    },
    onError: () => {
      toast.error('Failed to create goal');
    },
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.goals() });
      logActivity({
        event_type: 'goal_deleted',
        activity: 'Goal deleted',
        entity_type: 'goal',
      });
    },
  });
}
