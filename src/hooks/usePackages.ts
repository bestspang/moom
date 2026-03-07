import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import i18n from '@/i18n';
import { logActivity } from '@/lib/activityLogger';
import { useAuth } from '@/contexts/AuthContext';

type Package = Tables<'packages'>;
type PackageInsert = TablesInsert<'packages'>;
type PackageUpdate = TablesUpdate<'packages'>;

export const usePackages = (status?: string, search?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['packages', status, search],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase.from('packages').select('*');
      
      if (status && status !== 'all') {
        query = query.eq('status', status as Package['status']);
      }
      
      if (search) {
        query = query.or(`name_en.ilike.%${search}%,name_th.ilike.%${search}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Package[];
    },
  });
};

export const usePackageStats = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['package-stats'],
    enabled: !!user,
    queryFn: async () => {
      const statuses = ['on_sale', 'scheduled', 'drafts', 'archive'] as const;
      const results = await Promise.all(
        statuses.map((status) =>
          supabase
            .from('packages')
            .select('id', { count: 'exact', head: true })
            .eq('status', status)
        )
      );

      const stats: Record<string, number> = {};
      statuses.forEach((status, i) => {
        if (results[i].error) throw results[i].error;
        stats[status] = results[i].count ?? 0;
      });

      return stats as { on_sale: number; scheduled: number; drafts: number; archive: number };
    },
  });
};

export const usePackage = (id: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['packages', id],
    enabled: !!user && !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Package;
    },
  });
};

export const useCreatePackage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: PackageInsert) => {
      const { data: newPackage, error } = await supabase
        .from('packages')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return newPackage;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['package-stats'] });
      logActivity({
        event_type: 'package_created',
        activity: `Package "${data.name_en}" created`,
        entity_type: 'package',
        entity_id: data.id,
      });
      toast.success(i18n.t('toast.packageCreated'));
    },
    onError: (error) => {
      toast.error(i18n.t('toast.packageCreateFailed'));
    },
  });
};

export const useUpdatePackage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PackageUpdate }) => {
      const { data: updated, error } = await supabase
        .from('packages')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updated;
    },
    onSuccess: (updated, variables) => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['packages', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['package-stats'] });
      logActivity({
        event_type: 'package_updated',
        activity: `Package "${updated.name_en}" updated`,
        entity_type: 'package',
        entity_id: variables.id,
        new_value: variables.data as Record<string, unknown>,
      });
      toast.success(i18n.t('toast.packageUpdated'));
    },
    onError: (error) => {
      toast.error(i18n.t('toast.packageUpdateFailed'));
    },
  });
};

export const useDeletePackage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['package-stats'] });
      logActivity({
        event_type: 'package_deleted',
        activity: `Package deleted`,
        entity_type: 'package',
        entity_id: id,
      });
      toast.success(i18n.t('toast.packageDeleted'));
    },
    onError: (error) => {
      toast.error(i18n.t('toast.packageDeleteFailed'));
    },
  });
};

export const useArchivePackage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('packages')
        .update({ status: 'archive' })
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['package-stats'] });
      logActivity({
        event_type: 'package_archived',
        activity: `Package archived`,
        entity_type: 'package',
        entity_id: id,
      });
      toast.success(i18n.t('toast.packageArchived'));
    },
    onError: (error) => {
      toast.error(i18n.t('toast.packageArchiveFailed'));
    },
  });
};

// ── Bulk mutations ──

export const useBulkUpdatePackageStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const { error } = await supabase
        .from('packages')
        .update({ status: status as Package['status'] })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_, { ids, status }) => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['package-stats'] });
      logActivity({
        event_type: 'packages_bulk_status',
        activity: `${ids.length} packages status changed to ${status}`,
        entity_type: 'package',
      });
      toast.success(`${ids.length} packages updated`);
    },
    onError: (e) => toast.error(`Failed: ${(e as Error).message}`),
  });
};

export const useBulkDeletePackages = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('packages').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['package-stats'] });
      logActivity({
        event_type: 'packages_bulk_deleted',
        activity: `${ids.length} packages deleted`,
        entity_type: 'package',
      });
      toast.success(`${ids.length} packages deleted`);
    },
    onError: (e) => toast.error(`Failed: ${(e as Error).message}`),
  });
};

export const useBulkDuplicatePackages = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (packages: Package[]) => {
      const copies = packages.map(({ id, created_at, updated_at, ...rest }) => ({
        ...rest,
        name_en: `Copy of ${rest.name_en}`,
        name_th: rest.name_th ? `Copy of ${rest.name_th}` : null,
        status: 'drafts' as Package['status'],
      }));
      const { error } = await supabase.from('packages').insert(copies);
      if (error) throw error;
    },
    onSuccess: (_, pkgs) => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['package-stats'] });
      logActivity({
        event_type: 'packages_bulk_duplicated',
        activity: `${pkgs.length} packages duplicated`,
        entity_type: 'package',
      });
      toast.success(`${pkgs.length} packages duplicated`);
    },
    onError: (e) => toast.error(`Failed: ${(e as Error).message}`),
  });
};
