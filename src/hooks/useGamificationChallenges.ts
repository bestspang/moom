import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logActivity } from '@/lib/activityLogger';

export interface GamificationChallenge {
  id: string;
  name_en: string;
  name_th: string | null;
  description_en: string | null;
  description_th: string | null;
  type: string;
  goal_type: string;
  goal_value: number;
  goal_action_key: string | null;
  reward_xp: number;
  reward_points: number;
  reward_badge_id: string | null;
  eligibility: Record<string, any>;
  target_location_ids: string[];
  start_date: string;
  end_date: string;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useGamificationChallenges = (statusFilter?: string) => {
  return useQuery({
    queryKey: ['gamification-challenges', statusFilter],
    queryFn: async () => {
      let query = supabase.from('gamification_challenges').select('*').order('created_at', { ascending: false });
      if (statusFilter && statusFilter !== 'all') query = query.eq('status', statusFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data as GamificationChallenge[];
    },
  });
};

export const useCreateGamificationChallenge = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (challenge: Partial<GamificationChallenge>) => {
      const { data, error } = await supabase.from('gamification_challenges').insert([challenge as any]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['gamification-challenges'] });
      toast.success('Challenge created');
      logActivity({ event_type: 'gamification_challenge_created', entity_type: 'gamification_challenge', entity_id: data?.id, metadata: { name_en: data?.name_en } });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateGamificationChallenge = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GamificationChallenge> & { id: string }) => {
      const { data, error } = await supabase.from('gamification_challenges').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['gamification-challenges'] });
      toast.success('Challenge updated');
      logActivity({ event_type: 'gamification_challenge_updated', entity_type: 'gamification_challenge', entity_id: data?.id, metadata: { name_en: data?.name_en } });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteGamificationChallenge = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gamification_challenges').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['gamification-challenges'] });
      toast.success('Challenge deleted');
      logActivity({ event_type: 'gamification_challenge_deleted', entity_type: 'gamification_challenge', entity_id: id });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

