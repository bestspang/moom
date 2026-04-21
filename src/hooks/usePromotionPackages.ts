import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import i18n from '@/i18n';
import { logActivity } from '@/lib/activityLogger';
import type { Tables } from '@/integrations/supabase/types';

type Package = Tables<'packages'>;

interface PromotionPackageRow {
  id: string;
  promotion_id: string;
  package_id: string;
  discount_override: number | null;
  max_sale_amount: number | null;
  created_at: string;
  packages: Package;
}

/** Fetch packages linked to a promotion via the join table, with fallback to legacy applicable_packages array */
export const usePromotionPackages = (
  promotionId: string | null,
  legacyPackageIds?: string[] | null,
) => {
  return useQuery({
    queryKey: ['promotion-packages', promotionId],
    queryFn: async () => {
      if (!promotionId) return [] as (Package & { discount_override?: number | null; max_sale_amount?: number | null })[];

      // Try join table first
      const { data: joinRows, error: joinError } = await supabase
        .from('promotion_packages')
        .select('*, packages(*)')
        .eq('promotion_id', promotionId);

      if (joinError) throw joinError;

      if (joinRows && joinRows.length > 0) {
        return (joinRows as unknown as PromotionPackageRow[]).map((row) => ({
          ...row.packages,
          discount_override: row.discount_override,
          max_sale_amount: row.max_sale_amount,
        }));
      }

      // Fallback: legacy applicable_packages array
      if (legacyPackageIds && legacyPackageIds.length > 0) {
        const { data, error } = await supabase
          .from('packages')
          .select('*')
          .in('id', legacyPackageIds);
        if (error) throw error;
        return (data || []) as Package[];
      }

      return [] as Package[];
    },
    enabled: !!promotionId,
  });
};

/** Add a package to a promotion via join table */
export const useAddPromotionPackage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ promotionId, packageId }: { promotionId: string; packageId: string }) => {
      const { error } = await supabase
        .from('promotion_packages')
        .upsert({ promotion_id: promotionId, package_id: packageId }, { onConflict: 'promotion_id,package_id' });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['promotion-packages', vars.promotionId] });
      toast.success(i18n.t('toast.packageAdded'));
      logActivity({ event_type: 'promotion_package_added', metadata: { promotion_id: vars.promotionId, package_id: vars.packageId } });
    },
    onError: (error: Error) => {
      console.error('[useAddPromotionPackage] add failed', error);
      toast.error(error.message);
    },
  });
};

/** Remove a package from a promotion */
export const useRemovePromotionPackage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ promotionId, packageId }: { promotionId: string; packageId: string }) => {
      const { error } = await supabase
        .from('promotion_packages')
        .delete()
        .eq('promotion_id', promotionId)
        .eq('package_id', packageId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['promotion-packages', vars.promotionId] });
      toast.success(i18n.t('toast.packageRemoved'));
      logActivity({ event_type: 'promotion_package_removed', metadata: { promotion_id: vars.promotionId, package_id: vars.packageId } });
    },
    onError: (error: Error) => {
      console.error('[useRemovePromotionPackage] remove failed', error);
      toast.error(error.message);
    },
  });
};

/** Update per-package discount or max_sale_amount */
export const useUpdatePromotionPackage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      promotionId,
      packageId,
      discountOverride,
      maxSaleAmount,
    }: {
      promotionId: string;
      packageId: string;
      discountOverride?: number | null;
      maxSaleAmount?: number | null;
    }) => {
      const update: Record<string, unknown> = {};
      if (discountOverride !== undefined) update.discount_override = discountOverride;
      if (maxSaleAmount !== undefined) update.max_sale_amount = maxSaleAmount;

      const { error } = await supabase
        .from('promotion_packages')
        .update(update)
        .eq('promotion_id', promotionId)
        .eq('package_id', packageId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['promotion-packages', vars.promotionId] });
      toast.success(i18n.t('toast.packageUpdated'));
      logActivity({ event_type: 'promotion_package_updated', metadata: { promotion_id: vars.promotionId, package_id: vars.packageId } });
    },
    onError: (error: Error) => {
      console.error('[useUpdatePromotionPackage] update failed', error);
      toast.error(error.message);
    },
  });
};
