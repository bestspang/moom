import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Role = Tables<'roles'>;
type RoleInsert = TablesInsert<'roles'>;
type RoleUpdate = TablesUpdate<'roles'>;

export interface RoleWithCount extends Role {
  accounts_count: number;
}

export const useRoles = (search?: string) => {
  return useQuery({
    queryKey: ['roles', search],
    queryFn: async () => {
      // First get all roles
      let query = supabase.from('roles').select('*');
      
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }
      
      const { data: roles, error } = await query.order('access_level', { ascending: false });
      
      if (error) throw error;
      
      // Then get staff counts per role
      const { data: staffCounts, error: countError } = await supabase
        .from('staff')
        .select('role_id');
      
      if (countError) throw countError;
      
      // Count staff per role
      const counts: Record<string, number> = {};
      staffCounts?.forEach((staff) => {
        if (staff.role_id) {
          counts[staff.role_id] = (counts[staff.role_id] || 0) + 1;
        }
      });
      
      // Merge counts with roles
      const rolesWithCounts: RoleWithCount[] = (roles || []).map((role) => ({
        ...role,
        accounts_count: counts[role.id] || 0,
      }));
      
      return rolesWithCounts;
    },
  });
};

export const useRole = (id: string) => {
  return useQuery({
    queryKey: ['roles', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Role;
    },
    enabled: !!id,
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: RoleInsert) => {
      const { data: newRole, error } = await supabase
        .from('roles')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return newRole;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create role: ${error.message}`);
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RoleUpdate }) => {
      const { data: updated, error } = await supabase
        .from('roles')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updated;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles', variables.id] });
      toast.success('Role updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update role: ${error.message}`);
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete role: ${error.message}`);
    },
  });
};

// Helper to format access level for display
export const formatAccessLevel = (level: Role['access_level']): string => {
  const labels: Record<string, string> = {
    level_1_minimum: 'Level 1: Minimum',
    level_2_operator: 'Level 2: Operator',
    level_3_manager: 'Level 3: Manager',
    level_4_master: 'Level 4: Master',
  };
  return labels[level] || level;
};
