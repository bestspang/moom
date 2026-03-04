import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queryKeys';
import { logActivity } from '@/lib/activityLogger';

type Location = Tables<'locations'>;
type LocationInsert = TablesInsert<'locations'>;
type LocationUpdate = TablesUpdate<'locations'>;

export const useLocations = (status?: string, search?: string) => {
  return useQuery({
    queryKey: queryKeys.locations(status, search),
    queryFn: async () => {
      let query = supabase.from('locations').select('*');
      
      if (status && status !== 'all') {
        query = query.eq('status', status as Location['status']);
      }
      
      if (search) {
        query = query.or(`name.ilike.%${search}%,location_id.ilike.%${search}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Location[];
    },
  });
};

export const useLocationStats = () => {
  return useQuery({
    queryKey: queryKeys.locationStats(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('status');
      
      if (error) throw error;
      
      const stats = {
        open: 0,
        closed: 0,
      };
      
      data?.forEach((loc) => {
        if (loc.status && stats.hasOwnProperty(loc.status)) {
          stats[loc.status as keyof typeof stats]++;
        }
      });
      
      return stats;
    },
  });
};

export const useLocation = (id: string) => {
  return useQuery({
    queryKey: queryKeys.locations(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Location;
    },
    enabled: !!id,
  });
};

export const useCreateLocation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: LocationInsert) => {
      const { data: newLocation, error } = await supabase
        .from('locations')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return newLocation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['location-stats'] });
      logActivity({
        event_type: 'location_created',
        activity: `Location "${data.name}" created`,
        entity_type: 'location',
        entity_id: data.id,
      });
      toast.success('Location created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create location: ${error.message}`);
    },
  });
};

export const useUpdateLocation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: LocationUpdate }) => {
      const { data: updated, error } = await supabase
        .from('locations')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updated;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['location-stats'] });
      logActivity({
        event_type: 'location_updated',
        activity: `Location "${data.name}" updated`,
        entity_type: 'location',
        entity_id: variables.id,
        new_value: variables.data as Record<string, unknown>,
      });
      toast.success('Location updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update location: ${error.message}`);
    },
  });
};

export const useDeleteLocation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['location-stats'] });
      toast.success('Location deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete location: ${error.message}`);
    },
  });
};
