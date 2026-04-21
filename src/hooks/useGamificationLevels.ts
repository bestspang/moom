import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logActivity } from '@/lib/activityLogger';

export interface GamificationLevel {
  id: string;
  level_number: number;
  name_en: string;
  name_th: string | null;
  xp_required: number;
  badge_color: string | null;
  perks: any[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useGamificationLevels = () => {
  return useQuery({
    queryKey: ['gamification-levels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gamification_levels')
        .select('*')
        .order('level_number', { ascending: true });
      if (error) throw error;
      return data as GamificationLevel[];
    },
  });
};

export const useCreateGamificationLevel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (level: Omit<GamificationLevel, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('gamification_levels').insert(level).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['gamification-levels'] });
      toast.success('Level created');
      logActivity({ event_type: 'gamification_level_created', entity_type: 'gamification_level', entity_id: data?.id, metadata: { level_number: data?.level_number, name_en: data?.name_en } });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateGamificationLevel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GamificationLevel> & { id: string }) => {
      const { data, error } = await supabase.from('gamification_levels').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['gamification-levels'] });
      toast.success('Level updated');
      logActivity({ event_type: 'gamification_level_updated', entity_type: 'gamification_level', entity_id: data?.id, metadata: { level_number: data?.level_number, name_en: data?.name_en } });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteGamificationLevel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gamification_levels').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['gamification-levels'] });
      toast.success('Level deleted');
      logActivity({ event_type: 'gamification_level_deleted', entity_type: 'gamification_level', entity_id: variables, metadata: {} });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
