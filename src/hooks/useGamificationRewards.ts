import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GamificationReward {
  id: string;
  name_en: string;
  name_th: string | null;
  description_en: string | null;
  description_th: string | null;
  category: string;
  points_cost: number;
  level_required: number;
  stock: number | null;
  redeemed_count: number;
  is_unlimited: boolean;
  available_from: string | null;
  available_until: string | null;
  linked_package_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useGamificationRewards = () => {
  return useQuery({
    queryKey: ['gamification-rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gamification_rewards')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as GamificationReward[];
    },
  });
};

export const useCreateGamificationReward = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reward: Partial<GamificationReward>) => {
      const { data, error } = await supabase.from('gamification_rewards').insert([reward as any]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gamification-rewards'] }); toast.success('Reward created'); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateGamificationReward = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GamificationReward> & { id: string }) => {
      const { data, error } = await supabase.from('gamification_rewards').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gamification-rewards'] }); toast.success('Reward updated'); },
    onError: (e: Error) => toast.error(e.message),
  });
};
