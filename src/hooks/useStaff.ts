import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Staff = Tables<'staff'>;
type StaffInsert = TablesInsert<'staff'>;
type StaffUpdate = TablesUpdate<'staff'>;

export const useStaff = (status?: string, search?: string) => {
  return useQuery({
    queryKey: ['staff', status, search],
    queryFn: async () => {
      let query = supabase
        .from('staff')
        .select(`
          *,
          role:roles(id, name, access_level)
        `);
      
      if (status && status !== 'all') {
        query = query.eq('status', status as Staff['status']);
      }
      
      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

export const useStaffStats = () => {
  return useQuery({
    queryKey: ['staff-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('status');
      
      if (error) throw error;
      
      const stats = {
        active: 0,
        pending: 0,
        terminated: 0,
      };
      
      data?.forEach((member) => {
        if (member.status && stats.hasOwnProperty(member.status)) {
          stats[member.status as keyof typeof stats]++;
        }
      });
      
      return stats;
    },
  });
};

export const useStaffMember = (id: string) => {
  return useQuery({
    queryKey: ['staff', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select(`
          *,
          role:roles(id, name, access_level)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateStaff = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: StaffInsert) => {
      const { data: newStaff, error } = await supabase
        .from('staff')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return newStaff;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staff-stats'] });
      toast.success('Staff member created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create staff member: ${error.message}`);
    },
  });
};

export const useUpdateStaff = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: StaffUpdate }) => {
      const { data: updated, error } = await supabase
        .from('staff')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updated;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staff', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['staff-stats'] });
      toast.success('Staff member updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update staff member: ${error.message}`);
    },
  });
};

export const useDeleteStaff = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staff-stats'] });
      toast.success('Staff member deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete staff member: ${error.message}`);
    },
  });
};
