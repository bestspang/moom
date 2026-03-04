import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queryKeys';
import { logActivity } from '@/lib/activityLogger';

type Room = Tables<'rooms'>;
type RoomInsert = TablesInsert<'rooms'>;
type RoomUpdate = TablesUpdate<'rooms'>;

// Extended type for room insert with new fields (until types are regenerated)
interface RoomInsertExtended extends Omit<RoomInsert, 'layout_type'> {
  name_th?: string | null;
  layout_type?: 'open' | 'fixed';
}

export const useRooms = (status?: string, search?: string, categoryFilter?: string) => {
  return useQuery({
    queryKey: queryKeys.rooms(status, search, categoryFilter),
    queryFn: async () => {
      let query = supabase
        .from('rooms')
        .select(`
          *,
          location:locations(id, name)
        `);
      
      if (status && status !== 'all') {
        query = query.eq('status', status as Room['status']);
      }
      
      if (search) {
        query = query.or(`name.ilike.%${search}%,name_th.ilike.%${search}%`);
      }

      if (categoryFilter) {
        query = query.or(`categories.cs.{${categoryFilter}},categories.eq.{}`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

export const useRoomStats = () => {
  return useQuery({
    queryKey: queryKeys.roomStats(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('status');
      
      if (error) throw error;
      
      const stats = {
        open: 0,
        closed: 0,
      };
      
      data?.forEach((room) => {
        if (room.status && stats.hasOwnProperty(room.status)) {
          stats[room.status as keyof typeof stats]++;
        }
      });
      
      return stats;
    },
  });
};

export const useRoom = (id: string) => {
  return useQuery({
    queryKey: queryKeys.rooms(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          *,
          location:locations(id, name)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateRoom = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: RoomInsertExtended) => {
      const { data: newRoom, error } = await supabase
        .from('rooms')
        .insert(data as any)
        .select()
        .single();
      
      if (error) throw error;
      return newRoom;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room-stats'] });
      logActivity({
        event_type: 'room_created',
        activity: `Room "${data.name}" created`,
        entity_type: 'room',
        entity_id: data.id,
        new_value: {
          name: data.name,
          name_th: data.name_th,
          location_id: data.location_id,
          layout_type: data.layout_type,
          max_capacity: data.max_capacity,
          categories: data.categories,
        } as Record<string, unknown>,
      });
      toast.success('Room created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create room: ${error.message}`);
    },
  });
};

export const useUpdateRoom = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RoomUpdate }) => {
      const { data: updated, error } = await supabase
        .from('rooms')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updated;
    },
    onSuccess: (updated, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room-stats'] });
      logActivity({
        event_type: 'room_updated',
        activity: `Room "${updated.name}" updated`,
        entity_type: 'room',
        entity_id: variables.id,
        new_value: variables.data as Record<string, unknown>,
      });
      toast.success('Room updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update room: ${error.message}`);
    },
  });
};

export const useDeleteRoom = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room-stats'] });
      logActivity({
        event_type: 'room_deleted',
        activity: `Room deleted`,
        entity_type: 'room',
        entity_id: id,
      });
      toast.success('Room deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete room: ${error.message}`);
    },
  });
};
