import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type AccessLevel = Database['public']['Enums']['access_level'];

export type ResourceKey =
  | 'dashboard' | 'lobby' | 'schedule' | 'rooms' | 'classes' | 'class_categories'
  | 'members' | 'leads' | 'packages' | 'promotions' | 'staff' | 'roles'
  | 'locations' | 'activity_log' | 'announcements' | 'workout_list'
  | 'transfer_slips' | 'finance' | 'reports' | 'settings' | 'notifications'
  | 'gamification';

export type PermissionAction = 'read' | 'write' | 'delete';

export const ALL_RESOURCES: ResourceKey[] = [
  'dashboard', 'lobby', 'schedule', 'rooms', 'classes', 'class_categories',
  'members', 'leads', 'packages', 'promotions', 'staff', 'roles',
  'locations', 'activity_log', 'announcements', 'workout_list',
  'transfer_slips', 'finance', 'reports', 'settings', 'notifications',
];

export interface PermissionRow {
  resource: ResourceKey;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
}

// Default permissions per access level
export const getDefaultPermissions = (level: AccessLevel): PermissionRow[] => {
  const allTrue: PermissionRow = { resource: 'dashboard', can_read: true, can_write: true, can_delete: true };
  const readOnly: PermissionRow = { resource: 'dashboard', can_read: true, can_write: false, can_delete: false };
  const none: PermissionRow = { resource: 'dashboard', can_read: false, can_write: false, can_delete: false };

  const masterResources = ALL_RESOURCES;
  const managerResources: ResourceKey[] = [
    'dashboard', 'lobby', 'schedule', 'rooms', 'classes', 'class_categories',
    'members', 'leads', 'packages', 'promotions', 'staff', 'locations',
    'activity_log', 'announcements', 'workout_list', 'transfer_slips',
    'finance', 'reports', 'settings', 'notifications',
  ];
  const operatorResources: ResourceKey[] = [
    'dashboard', 'lobby', 'schedule', 'rooms', 'classes', 'class_categories',
    'members', 'leads', 'activity_log', 'announcements', 'workout_list',
    'reports', 'notifications',
  ];
  const minimumResources: ResourceKey[] = [
    'dashboard', 'lobby', 'members', 'notifications',
  ];

  return ALL_RESOURCES.map((resource) => {
    switch (level) {
      case 'level_4_master':
        return { ...allTrue, resource };
      case 'level_3_manager':
        return managerResources.includes(resource)
          ? { ...allTrue, resource }
          : { ...none, resource };
      case 'level_2_operator':
        return operatorResources.includes(resource)
          ? { ...readOnly, resource, can_write: ['schedule', 'members', 'leads', 'classes', 'workout_list'].includes(resource) }
          : { ...none, resource };
      case 'level_1_minimum':
        return minimumResources.includes(resource)
          ? { ...readOnly, resource }
          : { ...none, resource };
      default:
        return { ...none, resource };
    }
  });
};

export const usePermissions = () => {
  const { user, accessLevel } = useAuth();

  const query = useQuery({
    queryKey: ['my-permissions', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get user's staff record to find role_id
      const { data: staff } = await supabase
        .from('staff')
        .select('role_id')
        .eq('user_id', user.id)
        .maybeSingle();

      // Also check staff_positions for role_ids
      let roleIds: string[] = [];
      if (staff?.role_id) roleIds.push(staff.role_id);

      const { data: staffRecord } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (staffRecord) {
        const { data: positions } = await supabase
          .from('staff_positions')
          .select('role_id')
          .eq('staff_id', staffRecord.id);

        if (positions) {
          roleIds = [...roleIds, ...positions.map((p) => p.role_id)];
        }
      }

      // Deduplicate
      roleIds = [...new Set(roleIds)];

      if (roleIds.length === 0) return null;

      // Fetch permissions for all roles — merge (union of permissions)
      const { data: permissions, error } = await supabase
        .from('role_permissions')
        .select('resource, can_read, can_write, can_delete')
        .in('role_id', roleIds);

      if (error) throw error;
      if (!permissions || permissions.length === 0) return null;

      // Merge: for each resource, OR all permissions
      const merged: Record<string, PermissionRow> = {};
      for (const p of permissions) {
        const existing = merged[p.resource];
        if (existing) {
          existing.can_read = existing.can_read || (p.can_read ?? false);
          existing.can_write = existing.can_write || (p.can_write ?? false);
          existing.can_delete = existing.can_delete || (p.can_delete ?? false);
        } else {
          merged[p.resource] = {
            resource: p.resource as ResourceKey,
            can_read: p.can_read ?? false,
            can_write: p.can_write ?? false,
            can_delete: p.can_delete ?? false,
          };
        }
      }

      return merged;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const can = (resource: ResourceKey, action: PermissionAction): boolean => {
    // If permissions are loaded from DB, use them
    if (query.data) {
      const perm = query.data[resource];
      if (!perm) return false;
      switch (action) {
        case 'read': return perm.can_read;
        case 'write': return perm.can_write;
        case 'delete': return perm.can_delete;
      }
    }

    // Fallback to access_level defaults
    if (!accessLevel) return false;
    const defaults = getDefaultPermissions(accessLevel);
    const defaultPerm = defaults.find((d) => d.resource === resource);
    if (!defaultPerm) return false;
    switch (action) {
      case 'read': return defaultPerm.can_read;
      case 'write': return defaultPerm.can_write;
      case 'delete': return defaultPerm.can_delete;
    }
  };

  return {
    can,
    permissions: query.data,
    loading: query.isLoading,
    hasCustomPermissions: !!query.data,
  };
};
