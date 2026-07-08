import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import i18n from '@/i18n';
import { queryKeys } from '@/lib/queryKeys';
import { logActivity } from '@/lib/activityLogger';

const FLAG_KEY = 'maintenance_mode';

interface MaintenanceFlag {
  id: string;
  enabled: boolean;
}

/**
 * Public read hook for the global maintenance_mode feature flag.
 * Uses the "All can read feature flags" policy so anon visitors can also fetch it.
 */
export const useMaintenanceMode = () => {
  return useQuery({
    queryKey: queryKeys.maintenanceMode(),
    queryFn: async (): Promise<MaintenanceFlag> => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('id, enabled')
        .eq('key', FLAG_KEY)
        .maybeSingle();

      if (error) throw error;
      // Fail-safe: if the row is missing, treat maintenance as OFF
      return data ?? { id: '', enabled: false };
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

/**
 * Toggle the maintenance_mode flag. Manager-only via existing RLS on feature_flags.
 */
export const useToggleMaintenanceMode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { data, error } = await supabase
        .from('feature_flags')
        .update({ enabled })
        .eq('id', id)
        .select('id, enabled')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceMode() });
      queryClient.invalidateQueries({ queryKey: queryKeys.featureFlags() });
      logActivity({
        event_type: 'maintenance_mode_toggled',
        activity: `Maintenance mode set to ${data.enabled}`,
        entity_type: 'feature_flag',
        entity_id: data.id,
        new_value: { enabled: data.enabled },
      });
      toast.success(
        data.enabled
          ? i18n.t('settings.maintenance.enabledToast')
          : i18n.t('settings.maintenance.disabledToast'),
      );
    },
    onError: (err) => {
      console.error('[useToggleMaintenanceMode] toggle failed', err);
      toast.error(i18n.t('settings.maintenance.toggleFailed'));
    },
  });
};
