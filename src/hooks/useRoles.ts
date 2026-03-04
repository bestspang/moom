import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { logActivity } from '@/lib/activityLogger';
import type { PermissionRow, ResourceKey } from './usePermissions';

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
      let query = supabase.from('roles').select('*');
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }
      const { data: roles, error } = await query.order('access_level', { ascending: false });
      if (error) throw error;

      // Count staff per role using head-only count queries (avoids 1000-row limit)
      const counts: Record<string, number> = {};
      await Promise.all(
        (roles || []).map(async (role) => {
          const { count } = await supabase
            .from('staff_positions')
            .select('*', { count: 'exact', head: true })
            .eq('role_id', role.id);
          counts[role.id] = count ?? 0;
        })
      );

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

export const useRolePermissions = (roleId: string) => {
  return useQuery({
    queryKey: ['role-permissions', roleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('resource, can_read, can_write, can_delete')
        .eq('role_id', roleId);
      if (error) throw error;
      return data as { resource: string; can_read: boolean | null; can_write: boolean | null; can_delete: boolean | null }[];
    },
    enabled: !!roleId,
  });
};

export const useSaveRoleWithPermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ role, permissions }: { role: { id?: string; name: string; access_level: string }; permissions: PermissionRow[] }) => {
      let roleId = role.id;

      if (roleId) {
        // Update existing role
        const { error } = await supabase
          .from('roles')
          .update({ name: role.name, access_level: role.access_level as any })
          .eq('id', roleId);
        if (error) throw error;
      } else {
        // Insert new role
        const { data, error } = await supabase
          .from('roles')
          .insert({ name: role.name, access_level: role.access_level as any })
          .select('id')
          .single();
        if (error) throw error;
        roleId = data.id;
      }

      // Delete old permissions
      const { error: delError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId);
      if (delError) throw delError;

      // Insert new permissions
      const rows = permissions.map((p) => ({
        role_id: roleId!,
        resource: p.resource,
        can_read: p.can_read,
        can_write: p.can_write,
        can_delete: p.can_delete,
      }));

      if (rows.length > 0) {
        const { error: insError } = await supabase
          .from('role_permissions')
          .insert(rows);
        if (insError) throw insError;
      }

      return roleId;
    },
    onSuccess: (roleId, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['my-permissions'] });
      logActivity({
        event_type: 'role_updated',
        activity: `Role "${variables.role.name}" saved`,
        entity_type: 'role',
        entity_id: roleId ?? undefined,
      });
    },
    onError: (error) => {
      toast.error(`Failed to save role: ${error.message}`);
    },
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: RoleInsert) => {
      const { data: newRole, error } = await supabase.from('roles').insert(data).select().single();
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
      const { data: updated, error } = await supabase.from('roles').update(data).eq('id', id).select().single();
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
      const { error } = await supabase.from('roles').delete().eq('id', id);
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
