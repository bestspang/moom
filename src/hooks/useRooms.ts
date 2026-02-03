import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Room = Tables<'rooms'>;
type RoomInsert = TablesInsert<'rooms'>;
type RoomUpdate = TablesUpdate<'rooms'>;

export const useRooms = (status?: string, search?: string) => {
  return useQuery({
    queryKey: ['rooms', status, search],
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
        query = query.ilike('name', `%${search}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

export const useRoomStats = () => {
  return useQuery({
    queryKey: ['room-stats'],
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
    queryKey: ['rooms', id],
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
    mutationFn: async (data: RoomInsert) => {
      const { data: newRoom, error } = await supabase
        .from('rooms')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return newRoom;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room-stats'] });
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['rooms', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['room-stats'] });
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room-stats'] });
      toast.success('Room deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete room: ${error.message}`);
    },
  });
};
