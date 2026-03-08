import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GamificationAuditEntry {
  id: string;
  member_id: string | null;
  staff_id: string | null;
  event_type: string;
  action_key: string | null;
  xp_delta: number;
  points_delta: number;
  metadata: Record<string, any>;
  flagged: boolean;
  flag_reason: string | null;
  created_at: string;
}

export const useGamificationAudit = (opts?: { flaggedOnly?: boolean; limit?: number }) => {
  return useQuery({
    queryKey: ['gamification-audit', opts?.flaggedOnly],
    queryFn: async () => {
      let query = supabase
        .from('gamification_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(opts?.limit ?? 100);
      if (opts?.flaggedOnly) query = query.eq('flagged', true);
      const { data, error } = await query;
      if (error) throw error;
      return data as GamificationAuditEntry[];
    },
  });
};

export const useGamificationTrainerTiers = () => {
  return useQuery({
    queryKey: ['gamification-trainer-tiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gamification_trainer_tiers')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
};

export const useGamificationSeasons = () => {
  return useQuery({
    queryKey: ['gamification-seasons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gamification_seasons')
        .select('*')
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};
