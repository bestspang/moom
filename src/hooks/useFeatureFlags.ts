import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
import { queryKeys } from '@/lib/queryKeys';

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
    queryKey: ['feature-enabled', key, locationId],
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      queryClient.invalidateQueries({ queryKey: ['feature-flag'] });
      queryClient.invalidateQueries({ queryKey: ['feature-enabled'] });
      toast.success('Feature flag updated');
    },
    onError: (error) => {
      toast.error('Failed to update feature flag');
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      toast.success('Feature flag created');
    },
    onError: (error) => {
      toast.error('Failed to create feature flag');
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      queryClient.invalidateQueries({ queryKey: ['feature-flag'] });
      toast.success('Feature flag updated');
    },
    onError: (error) => {
      toast.error('Failed to update feature flag');
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      toast.success('Feature flag deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete feature flag');
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-enabled'] });
      toast.success('Flag assignment updated');
    },
    onError: (error) => {
      toast.error('Failed to update flag assignment');
      console.error('Set flag assignment error:', error);
    },
  });
};

// Get flag assignments for a specific flag
export const useFlagAssignments = (flagId: string) => {
  return useQuery({
    queryKey: ['flag-assignments', flagId],
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
