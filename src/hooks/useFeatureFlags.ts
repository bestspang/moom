import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import i18n from '@/i18n';
import type { Json } from '@/integrations/supabase/types';
import { queryKeys } from '@/lib/queryKeys';
import { logActivity } from '@/lib/activityLogger';

// Types based on database schema
type FlagScope = 'global' | 'location' | 'user';

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  scope: FlagScope;
  enabled: boolean;
  config: Json;
  created_at: string;
  updated_at: string;
}

interface FeatureFlagAssignment {
  id: string;
  flag_id: string;
  location_id: string | null;
  user_id: string | null;
  enabled: boolean;
  created_at: string;
}

// Fetch all feature flags
export const useFeatureFlags = () => {
  return useQuery({
    queryKey: queryKeys.featureFlags(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as FeatureFlag[];
    },
  });
};

// Fetch a single feature flag by key
export const useFeatureFlag = (key: string) => {
  return useQuery({
    queryKey: queryKeys.featureFlag(key),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('key', key)
        .single();

      if (error) throw error;
      return data as FeatureFlag;
    },
    enabled: !!key,
  });
};

// Check if a feature is enabled (considering location/user overrides)
export const useIsFeatureEnabled = (key: string, locationId?: string) => {
  return useQuery({
    queryKey: queryKeys.featureEnabled(key, locationId),
    queryFn: async () => {
      const { data: flag, error: flagError } = await supabase
        .from('feature_flags')
        .select('id, enabled, scope')
        .eq('key', key)
        .single();

      if (flagError) throw flagError;
      if (!flag) return false;

      if (flag.scope === 'global' || !locationId) {
        return flag.enabled;
      }

      const { data: assignment, error: assignError } = await supabase
        .from('feature_flag_assignments')
        .select('enabled')
        .eq('flag_id', flag.id)
        .eq('location_id', locationId)
        .maybeSingle();

      if (assignError) throw assignError;

      return assignment ? assignment.enabled : flag.enabled;
    },
    enabled: !!key,
  });
};

// Toggle a feature flag
export const useToggleFeatureFlag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { data, error } = await supabase
        .from('feature_flags')
        .update({ enabled })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.featureFlags() });
      queryClient.invalidateQueries({ queryKey: queryKeys.featureFlag('') });
      queryClient.invalidateQueries({ queryKey: queryKeys.featureEnabled('') });
      logActivity({
        event_type: 'feature_flag_toggled',
        activity: `Feature flag ${variables.id} set to ${variables.enabled}`,
        entity_type: 'feature_flag',
        entity_id: variables.id,
        new_value: { enabled: variables.enabled },
      });
      toast.success(i18n.t('toast.flagUpdated'));
    },
    onError: (error) => {
      toast.error(i18n.t('toast.flagUpdateFailed'));
      console.error('Toggle feature flag error:', error);
    },
  });
};

// Create a new feature flag
export const useCreateFeatureFlag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (flag: {
      key: string;
      name: string;
      description?: string;
      scope?: FlagScope;
      enabled?: boolean;
      config?: Json;
    }) => {
      const { data, error } = await supabase
        .from('feature_flags')
        .insert({
          key: flag.key,
          name: flag.name,
          description: flag.description || null,
          scope: flag.scope || 'global',
          enabled: flag.enabled || false,
          config: (flag.config || {}) as Json,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.featureFlags() });
      logActivity({
        event_type: 'feature_flag_created',
        activity: `Feature flag "${data.name}" created`,
        entity_type: 'feature_flag',
        entity_id: data.id,
      });
      toast.success(i18n.t('toast.flagCreated'));
    },
    onError: (error) => {
      toast.error(i18n.t('toast.flagCreateFailed'));
      console.error('Create feature flag error:', error);
    },
  });
};

// Update a feature flag
export const useUpdateFeatureFlag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: {
        key?: string;
        name?: string;
        description?: string | null;
        scope?: FlagScope;
        enabled?: boolean;
        config?: Json;
      };
    }) => {
      const { data, error } = await supabase
        .from('feature_flags')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.featureFlags() });
      queryClient.invalidateQueries({ queryKey: queryKeys.featureFlag('') });
      logActivity({
        event_type: 'feature_flag_updated',
        activity: `Feature flag "${data.name}" updated`,
        entity_type: 'feature_flag',
        entity_id: variables.id,
        new_value: variables.updates as Record<string, unknown>,
      });
      toast.success(i18n.t('toast.flagUpdated'));
    },
    onError: (error) => {
      toast.error(i18n.t('toast.flagUpdateFailed'));
      console.error('Update feature flag error:', error);
    },
  });
};

// Delete a feature flag
export const useDeleteFeatureFlag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('feature_flags')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.featureFlags() });
      logActivity({
        event_type: 'feature_flag_deleted',
        activity: 'Feature flag deleted',
        entity_type: 'feature_flag',
        entity_id: id,
      });
      toast.success(i18n.t('toast.flagDeleted'));
    },
    onError: (error) => {
      toast.error(i18n.t('toast.flagDeleteFailed'));
      console.error('Delete feature flag error:', error);
    },
  });
};

// Create/update location-specific flag assignment
export const useSetFlagAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      flagId,
      locationId,
      userId,
      enabled,
    }: {
      flagId: string;
      locationId?: string;
      userId?: string;
      enabled: boolean;
    }) => {
      if (!locationId && !userId) {
        throw new Error('Either locationId or userId must be provided');
      }

      const { data, error } = await supabase
        .from('feature_flag_assignments')
        .upsert(
          {
            flag_id: flagId,
            location_id: locationId || null,
            user_id: userId || null,
            enabled,
          },
          {
            onConflict: 'flag_id,location_id,user_id',
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.featureEnabled('') });
      logActivity({
        event_type: 'feature_flag_assignment_updated',
        activity: `Feature flag assignment updated`,
        entity_type: 'feature_flag_assignment',
        entity_id: data.id,
        new_value: { flag_id: variables.flagId, enabled: variables.enabled },
      });
      toast.success(i18n.t('toast.flagAssignmentUpdated'));
    },
    onError: (error) => {
      toast.error(i18n.t('toast.flagAssignmentFailed'));
      console.error('Set flag assignment error:', error);
    },
  });
};

// Get flag assignments for a specific flag
export const useFlagAssignments = (flagId: string) => {
  return useQuery({
    queryKey: queryKeys.flagAssignments(flagId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flag_assignments')
        .select('*, locations(name), auth_users:user_id(email)')
        .eq('flag_id', flagId);

      if (error) throw error;
      return data as FeatureFlagAssignment[];
    },
    enabled: !!flagId,
  });
};
