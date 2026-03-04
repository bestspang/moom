import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { logActivity } from '@/lib/activityLogger';

type Promotion = Tables<'promotions'>;
type PromotionInsert = TablesInsert<'promotions'>;
type PromotionUpdate = TablesUpdate<'promotions'>;

export const usePromotions = (status?: string, search?: string) => {
  return useQuery({
    queryKey: ['promotions', status, search],
    queryFn: async () => {
      let query = supabase.from('promotions').select('*');
      
      if (status && status !== 'all') {
        query = query.eq('status', status as Promotion['status']);
      }
      
      if (search) {
        query = query.or(`name.ilike.%${search}%,name_en.ilike.%${search}%,name_th.ilike.%${search}%,promo_code.ilike.%${search}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Promotion[];
    },
  });
};

export const usePromotionStats = () => {
  return useQuery({
    queryKey: ['promotion-stats'],
    queryFn: async () => {
      const statuses = ['active', 'scheduled', 'drafts', 'archive'] as const;
      const results = await Promise.all(
        statuses.map((status) =>
          supabase
            .from('promotions')
            .select('id', { count: 'exact', head: true })
            .eq('status', status)
        ),
      );

      const stats: Record<string, number> = {};
      statuses.forEach((s, i) => {
        if (results[i].error) throw results[i].error;
        stats[s] = results[i].count ?? 0;
      });
      return stats as { active: number; scheduled: number; drafts: number; archive: number };
    },
  });
};

export const usePromotion = (id: string) => {
  return useQuery({
    queryKey: ['promotions', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Promotion;
    },
    enabled: !!id,
  });
};

export const useCreatePromotion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: PromotionInsert) => {
      const { data: newPromo, error } = await supabase
        .from('promotions')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return newPromo;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['promotion-stats'] });
      logActivity({
        event_type: 'promotion_created',
        activity: `Promotion "${data.name}" created`,
        entity_type: 'promotion',
        entity_id: data.id,
      });
      toast.success('Promotion created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create promotion: ${error.message}`);
    },
  });
};

export const useUpdatePromotion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PromotionUpdate }) => {
      const { data: updated, error } = await supabase
        .from('promotions')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updated;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['promotions', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['promotion-stats'] });
      logActivity({
        event_type: 'promotion_updated',
        activity: `Promotion "${data.name}" updated`,
        entity_type: 'promotion',
        entity_id: variables.id,
        new_value: variables.data as Record<string, unknown>,
      });
      toast.success('Promotion updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update promotion: ${error.message}`);
    },
  });
};

export const useDeletePromotion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['promotion-stats'] });
      toast.success('Promotion deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete promotion: ${error.message}`);
    },
  });
};
