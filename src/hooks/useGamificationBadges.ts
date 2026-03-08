import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GamificationBadge {
  id: string;
  name_en: string;
  name_th: string | null;
  description_en: string | null;
  description_th: string | null;
  tier: string;
  icon_url: string | null;
  unlock_condition: Record<string, any>;
  display_priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useGamificationBadges = () => {
  return useQuery({
    queryKey: ['gamification-badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gamification_badges')
        .select('*')
        .order('display_priority', { ascending: true });
      if (error) throw error;
      return data as GamificationBadge[];
    },
  });
};

export const useCreateGamificationBadge = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (badge: Partial<GamificationBadge>) => {
      const { data, error } = await supabase.from('gamification_badges').insert([badge as any]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gamification-badges'] }); toast.success('Badge created'); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateGamificationBadge = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GamificationBadge> & { id: string }) => {
      const { data, error } = await supabase.from('gamification_badges').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gamification-badges'] }); toast.success('Badge updated'); },
    onError: (e: Error) => toast.error(e.message),
  });
};
