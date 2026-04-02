import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/contexts/AuthContext';

export interface GamificationRule {
  id: string;
  action_key: string;
  label_en: string;
  label_th: string | null;
  xp_value: number;
  points_value: number;
  cooldown_minutes: number | null;
  max_per_day: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const useGamificationRules = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.gamificationRules(),
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gamification_rules')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as GamificationRule[];
    },
  });
};

export const useCreateGamificationRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rule: Omit<GamificationRule, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('gamification_rules').insert(rule).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gamification-rules'] }); toast.success('Rule created'); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateGamificationRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GamificationRule> & { id: string }) => {
      const { data, error } = await supabase.from('gamification_rules').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gamification-rules'] }); toast.success('Rule updated'); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteGamificationRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gamification_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gamification-rules'] }); toast.success('Rule deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });
};
