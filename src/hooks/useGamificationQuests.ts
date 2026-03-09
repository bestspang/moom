import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface QuestTemplate {
  id: string;
  audience_type: string;
  quest_period: string;
  name_en: string;
  name_th: string | null;
  description_en: string | null;
  description_th: string | null;
  goal_type: string;
  goal_action_key: string | null;
  goal_value: number;
  xp_reward: number;
  coin_reward: number;
  badge_reward_id: string | null;
  coupon_reward_template_id: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const useGamificationQuests = () =>
  useQuery({
    queryKey: ['gamification-quest-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quest_templates')
        .select('*')
        .order('quest_period')
        .order('sort_order');
      if (error) throw error;
      return data as QuestTemplate[];
    },
  });

export const useCreateQuestTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: Partial<QuestTemplate>) => {
      const { data, error } = await supabase.from('quest_templates').insert([t as any]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gamification-quest-templates'] }); toast.success('Quest template created'); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateQuestTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<QuestTemplate> & { id: string }) => {
      const { data, error } = await supabase.from('quest_templates').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gamification-quest-templates'] }); toast.success('Quest template updated'); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteQuestTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('quest_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gamification-quest-templates'] }); toast.success('Quest template deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });
};
