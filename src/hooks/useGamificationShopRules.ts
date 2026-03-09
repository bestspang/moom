import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ShopRewardRule {
  id: string;
  order_type: string;
  min_spend: number;
  xp_per_order: number;
  xp_per_spend_unit: number;
  spend_unit: number;
  xp_cap: number | null;
  coin_per_spend_unit: number;
  coin_spend_unit: number;
  coin_cap: number | null;
  required_level: number;
  required_badge_id: string | null;
  is_active: boolean;
  created_at: string;
}

export const useGamificationShopRules = () =>
  useQuery({
    queryKey: ['gamification-shop-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_reward_rules')
        .select('*')
        .order('order_type');
      if (error) throw error;
      return data as ShopRewardRule[];
    },
  });

export const useCreateShopRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (r: Partial<ShopRewardRule>) => {
      const { data, error } = await supabase.from('shop_reward_rules').insert([r as any]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gamification-shop-rules'] }); toast.success('Shop rule created'); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateShopRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ShopRewardRule> & { id: string }) => {
      const { data, error } = await supabase.from('shop_reward_rules').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gamification-shop-rules'] }); toast.success('Shop rule updated'); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteShopRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shop_reward_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gamification-shop-rules'] }); toast.success('Shop rule deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });
};
