import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import i18n from '@/i18n';
import { logActivity } from '@/lib/activityLogger';
import { useAuth } from '@/contexts/AuthContext';

type Promotion = Tables<'promotions'>;
type PromotionInsert = TablesInsert<'promotions'>;
type PromotionUpdate = TablesUpdate<'promotions'>;

export const usePromotions = (status?: string, search?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['promotions', status, search],
    enabled: !!user,
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
  const { user } = useAuth();
  return useQuery({
    queryKey: ['promotion-stats'],
    enabled: !!user,
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
  const { user } = useAuth();
  return useQuery({
    queryKey: ['promotions', id],
    enabled: !!user && !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Promotion;
    },
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
      toast.success(i18n.t('toast.promotionCreated'));
    },
    onError: (error) => {
      toast.error(i18n.t('toast.promotionCreateFailed'));
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
      toast.success(i18n.t('toast.promotionUpdated'));
    },
    onError: (error) => {
      toast.error(i18n.t('toast.promotionUpdateFailed'));
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
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['promotion-stats'] });
      logActivity({
        event_type: 'promotion_deleted',
        activity: `Promotion deleted`,
        entity_type: 'promotion',
        entity_id: id,
      });
      toast.success(i18n.t('toast.promotionDeleted'));
    },
    onError: (error) => {
      toast.error(i18n.t('toast.promotionDeleteFailed'));
    },
  });
};

// ── Bulk mutations ──

export const useBulkUpdatePromotionStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const { error } = await supabase
        .from('promotions')
        .update({ status: status as Promotion['status'] })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_, { ids, status }) => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['promotion-stats'] });
      logActivity({
        event_type: 'promotions_bulk_status',
        activity: `${ids.length} promotions status changed to ${status}`,
        entity_type: 'promotion',
      });
      toast.success(i18n.t('toast.bulkUpdated', { count: ids.length }));
    },
    onError: () => toast.error(i18n.t('toast.bulkFailed')),
  });
};

export const useBulkDeletePromotions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('promotions').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['promotion-stats'] });
      logActivity({
        event_type: 'promotions_bulk_deleted',
        activity: `${ids.length} promotions deleted`,
        entity_type: 'promotion',
      });
      toast.success(`${ids.length} promotions deleted`);
    },
    onError: (e) => toast.error(`Failed: ${(e as Error).message}`),
  });
};

export const useBulkDuplicatePromotions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (promotions: Promotion[]) => {
      const copies = promotions.map(({ id, created_at, updated_at, usage_count, ...rest }) => ({
        ...rest,
        name: `Copy of ${rest.name}`,
        name_en: rest.name_en ? `Copy of ${rest.name_en}` : null,
        name_th: rest.name_th ? `Copy of ${rest.name_th}` : null,
        promo_code: null,
        status: 'drafts' as Promotion['status'],
      }));
      const { error } = await supabase.from('promotions').insert(copies);
      if (error) throw error;
    },
    onSuccess: (_, promos) => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['promotion-stats'] });
      logActivity({
        event_type: 'promotions_bulk_duplicated',
        activity: `${promos.length} promotions duplicated`,
        entity_type: 'promotion',
      });
      toast.success(`${promos.length} promotions duplicated`);
    },
    onError: (e) => toast.error(`Failed: ${(e as Error).message}`),
  });
};
