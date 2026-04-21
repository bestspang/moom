import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import i18n from '@/i18n';
import { logActivity } from '@/lib/activityLogger';

export interface CouponTemplate {
  id: string;
  name_en: string;
  name_th: string | null;
  discount_type: string;
  discount_value: number;
  max_discount: number | null;
  min_spend: number | null;
  valid_days: number;
  applies_to: string;
  stackable: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type CreateCouponTemplate = Omit<CouponTemplate, 'id' | 'created_at' | 'updated_at'>;

export const useGamificationCoupons = () =>
  useQuery({
    queryKey: ['gamification-coupon-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupon_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as CouponTemplate[];
    },
  });

export const useCreateCouponTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: CreateCouponTemplate) => {
      const { data, error } = await supabase.from('coupon_templates').insert([t]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['gamification-coupon-templates'] });
      toast.success(i18n.t('toast.couponTemplateCreated'));
      logActivity({ event_type: 'coupon_template_created', entity_type: 'coupon_template', entity_id: data?.id, metadata: { name_en: data?.name_en } });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateCouponTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CouponTemplate> & { id: string }) => {
      const { data, error } = await supabase.from('coupon_templates').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['gamification-coupon-templates'] });
      toast.success(i18n.t('toast.couponTemplateUpdated'));
      logActivity({ event_type: 'coupon_template_updated', entity_type: 'coupon_template', entity_id: data?.id, metadata: { name_en: data?.name_en } });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteCouponTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('coupon_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['gamification-coupon-templates'] });
      toast.success(i18n.t('toast.couponTemplateDeleted'));
      logActivity({ event_type: 'coupon_template_deleted', entity_type: 'coupon_template', entity_id: variables, metadata: {} });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
