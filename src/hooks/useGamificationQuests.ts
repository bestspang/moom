import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import i18n from '@/i18n';
import { logActivity } from '@/lib/activityLogger';

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

export type CreateQuestTemplate = Omit<QuestTemplate, 'id' | 'created_at' | 'updated_at'>;

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
    mutationFn: async (t: CreateQuestTemplate) => {
      const { data, error } = await supabase.from('quest_templates').insert([t]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['gamification-quest-templates'] });
      toast.success(i18n.t('toast.questTemplateCreated'));
      logActivity({ event_type: 'quest_template_created', entity_type: 'quest_template', entity_id: data?.id, metadata: { name_en: data?.name_en } });
    },
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
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['gamification-quest-templates'] });
      toast.success(i18n.t('toast.questTemplateUpdated'));
      logActivity({ event_type: 'quest_template_updated', entity_type: 'quest_template', entity_id: data?.id, metadata: { name_en: data?.name_en } });
    },
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
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['gamification-quest-templates'] });
      toast.success(i18n.t('toast.questTemplateDeleted'));
      logActivity({ event_type: 'quest_template_deleted', entity_type: 'quest_template', entity_id: variables, metadata: {} });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
