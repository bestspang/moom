import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { logActivity } from '@/lib/activityLogger';

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
          role:roles(id, name, access_level),
          staff_positions(id, role_id, scope_all_locations, location_ids, role:roles(id, name))
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
      const [activeRes, pendingRes, terminatedRes] = await Promise.all([
        supabase.from('staff').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('staff').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('staff').select('*', { count: 'exact', head: true }).eq('status', 'terminated'),
      ]);

      return {
        active: activeRes.count ?? 0,
        pending: pendingRes.count ?? 0,
        terminated: terminatedRes.count ?? 0,
      };
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
          role:roles(id, name, access_level),
          staff_positions(id, role_id, scope_all_locations, location_ids, role:roles(id, name))
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useStaffPositions = (staffId: string) => {
  return useQuery({
    queryKey: ['staff-positions', staffId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_positions')
        .select(`
          *,
          role:roles(id, name, access_level)
        `)
        .eq('staff_id', staffId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!staffId,
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

interface CreateStaffWithPositionsInput {
  staff: StaffInsert;
  positions: Array<{
    role_id: string;
    scope_all_locations: boolean;
    location_ids: string[];
  }>;
}

export const useCreateStaffWithPositions = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ staff, positions }: CreateStaffWithPositionsInput) => {
      // Insert staff
      const { data: newStaff, error: staffError } = await supabase
        .from('staff')
        .insert(staff)
        .select()
        .single();
      
      if (staffError) throw staffError;

      // Also set role_id for backward compat (first position's role)
      if (positions.length > 0) {
        await supabase
          .from('staff')
          .update({ role_id: positions[0].role_id })
          .eq('id', newStaff.id);
      }

      // Insert positions
      if (positions.length > 0) {
        const positionRows = positions.map(p => ({
          staff_id: newStaff.id,
          role_id: p.role_id,
          scope_all_locations: p.scope_all_locations,
          location_ids: p.location_ids,
        }));

        const { error: posError } = await supabase
          .from('staff_positions')
          .insert(positionRows);
        
        if (posError) throw posError;
      }

      // Log activity
      logActivity({
        event_type: 'staff_created',
        activity: `Staff member ${staff.first_name} ${staff.last_name} created`,
        entity_type: 'staff',
        entity_id: newStaff.id,
      });

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
    onSuccess: (updated, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staff', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['staff-stats'] });
      toast.success('Staff member updated successfully');

      logActivity({
        event_type: 'staff_updated',
        activity: `Staff member ${updated.first_name} ${updated.last_name} updated`,
        entity_type: 'staff',
        entity_id: variables.id,
        new_value: variables.data as Record<string, unknown>,
      });
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
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staff-stats'] });
      toast.success('Staff member deleted successfully');

      logActivity({
        event_type: 'staff_deleted',
        activity: `Staff member deleted`,
        entity_type: 'staff',
        entity_id: id,
      });
    },
    onError: (error) => {
      toast.error(`Failed to delete staff member: ${error.message}`);
    },
  });
};

export const useAddStaffPosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { staff_id: string; role_id: string; scope_all_locations: boolean; location_ids: string[] }) => {
      const { data: pos, error } = await supabase
        .from('staff_positions')
        .insert(data)
        .select('*, role:roles(id, name)')
        .single();
      if (error) throw error;
      return pos;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staff-positions', variables.staff_id] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Position added');
      logActivity({
        event_type: 'staff_position_added',
        activity: `Position added to staff`,
        entity_type: 'staff',
        entity_id: variables.staff_id,
      });
    },
    onError: (error) => {
      toast.error(`Failed to add position: ${error.message}`);
    },
  });
};

export const useRemoveStaffPosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, staff_id }: { id: string; staff_id: string }) => {
      const { error } = await supabase.from('staff_positions').delete().eq('id', id);
      if (error) throw error;
      return { id, staff_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staff-positions', result.staff_id] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Position removed');
      logActivity({
        event_type: 'staff_position_removed',
        activity: `Position removed from staff`,
        entity_type: 'staff',
        entity_id: result.staff_id,
      });
    },
    onError: (error) => {
      toast.error(`Failed to remove position: ${error.message}`);
    },
  });
};

export const useInviteStaff = () => {
  return useMutation({
    mutationFn: async ({ staff_id, email }: { staff_id: string; email?: string }) => {
      const { data, error } = await supabase.functions.invoke('invite-staff', {
        body: { staff_id, email },
      });
      
      if (error) throw error;
      return data;
    },
    onError: (error) => {
      toast.error(`Failed to send invitation: ${error.message}`);
    },
  });
};
