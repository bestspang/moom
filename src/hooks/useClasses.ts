import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queryKeys';
import { logActivity } from '@/lib/activityLogger';

type Class = Tables<'classes'>;
type ClassInsert = TablesInsert<'classes'>;
type ClassUpdate = TablesUpdate<'classes'>;

export const useClasses = (status?: string, search?: string) => {
  return useQuery({
    queryKey: queryKeys.classes(status, search),
    queryFn: async () => {
      let query = supabase
        .from('classes')
        .select(`
          *,
          category:class_categories(id, name)
        `);
      
      if (status && status !== 'all') {
        query = query.eq('status', status);
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

export const useClassStats = () => {
  return useQuery({
    queryKey: queryKeys.classStats(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('status');
      
      if (error) throw error;
      
      const stats = {
        all: data?.length || 0,
        active: 0,
        drafts: 0,
        archive: 0,
      };
      
      data?.forEach((cls) => {
        if (cls.status === 'active') stats.active++;
        else if (cls.status === 'drafts') stats.drafts++;
        else if (cls.status === 'archive') stats.archive++;
      });
      
      return stats;
    },
  });
};

export const useClass = (id: string) => {
  return useQuery({
    queryKey: queryKeys.classes(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          category:class_categories(id, name)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateClass = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ClassInsert) => {
      const { data: newClass, error } = await supabase
        .from('classes')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return newClass;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['class-stats'] });
      logActivity({
        event_type: 'class_created',
        activity: `Class "${data.name}" created`,
        entity_type: 'class',
        entity_id: data.id,
      });
      toast.success('Class created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create class: ${error.message}`);
    },
  });
};

export const useUpdateClass = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ClassUpdate }) => {
      const { data: updated, error } = await supabase
        .from('classes')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updated;
    },
    onSuccess: (updated, variables) => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['class-stats'] });
      logActivity({
        event_type: 'class_updated',
        activity: `Class "${updated.name}" updated`,
        entity_type: 'class',
        entity_id: variables.id,
        new_value: variables.data as Record<string, unknown>,
      });
      toast.success('Class updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update class: ${error.message}`);
    },
  });
};

export const useDeleteClass = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['class-stats'] });
      logActivity({
        event_type: 'class_deleted',
        activity: `Class deleted`,
        entity_type: 'class',
        entity_id: id,
      });
      toast.success('Class deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete class: ${error.message}`);
    },
  });
};
