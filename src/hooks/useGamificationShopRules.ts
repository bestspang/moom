import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logActivity } from '@/lib/activityLogger';
import { queryKeys } from '@/lib/queryKeys';

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
    queryKey: queryKeys.gamificationShopRules(),
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
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.gamificationShopRules() });
      toast.success('Shop rule created');
      logActivity({ event_type: 'shop_reward_rule_created', entity_type: 'shop_reward_rule', entity_id: data?.id, metadata: { order_type: data?.order_type } });
    },
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
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.gamificationShopRules() });
      toast.success('Shop rule updated');
      logActivity({ event_type: 'shop_reward_rule_updated', entity_type: 'shop_reward_rule', entity_id: data?.id, metadata: { order_type: data?.order_type } });
    },
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
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.gamificationShopRules() });
      toast.success('Shop rule deleted');
      logActivity({ event_type: 'shop_reward_rule_deleted', entity_type: 'shop_reward_rule', entity_id: variables, metadata: {} });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
