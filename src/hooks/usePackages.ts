import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Package = Tables<'packages'>;
type PackageInsert = TablesInsert<'packages'>;
type PackageUpdate = TablesUpdate<'packages'>;

export const usePackages = (status?: string, search?: string) => {
  return useQuery({
    queryKey: ['packages', status, search],
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
  return useQuery({
    queryKey: ['package-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('status');
      
      if (error) throw error;
      
      const stats = {
        on_sale: 0,
        scheduled: 0,
        drafts: 0,
        archive: 0,
      };
      
      data?.forEach((pkg) => {
        if (pkg.status && stats.hasOwnProperty(pkg.status)) {
          stats[pkg.status as keyof typeof stats]++;
        }
      });
      
      return stats;
    },
  });
};

export const usePackage = (id: string) => {
  return useQuery({
    queryKey: ['packages', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Package;
    },
    enabled: !!id,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['package-stats'] });
      toast.success('Package created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create package: ${error.message}`);
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['packages', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['package-stats'] });
      toast.success('Package updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update package: ${error.message}`);
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['package-stats'] });
      toast.success('Package deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete package: ${error.message}`);
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['package-stats'] });
      toast.success('Package archived successfully');
    },
    onError: (error) => {
      toast.error(`Failed to archive package: ${error.message}`);
    },
  });
};
