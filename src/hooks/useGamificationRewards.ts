import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import i18n from '@/i18n';
import { logActivity } from '@/lib/activityLogger';
import { queryKeys } from '@/lib/queryKeys';

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

export type CreateGamificationReward = Omit<GamificationReward, 'id' | 'created_at' | 'updated_at' | 'redeemed_count' | 'available_from' | 'available_until' | 'linked_package_id'> & {
  redeemed_count?: number;
  available_from?: string | null;
  available_until?: string | null;
  linked_package_id?: string | null;
};

export const useGamificationRewards = () => {
  return useQuery({
    queryKey: queryKeys.gamificationRewards(),
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
    mutationFn: async (reward: CreateGamificationReward) => {
      const { data, error } = await supabase.from('gamification_rewards').insert([reward]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.gamificationRewards() });
      toast.success(i18n.t('toast.rewardCreated'));
      logActivity({ event_type: 'gamification_reward_created', entity_type: 'gamification_reward', entity_id: data?.id, metadata: { name_en: data?.name_en } });
    },
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
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.gamificationRewards() });
      toast.success(i18n.t('toast.rewardUpdated'));
      logActivity({ event_type: 'gamification_reward_updated', entity_type: 'gamification_reward', entity_id: data?.id, metadata: { name_en: data?.name_en } });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteGamificationReward = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gamification_rewards').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.gamificationRewards() });
      toast.success(i18n.t('toast.rewardDeleted'));
      logActivity({ event_type: 'gamification_reward_deleted', entity_type: 'gamification_reward', entity_id: id });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
