import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import i18n from '@/i18n';
import { logActivity } from '@/lib/activityLogger';
import { useAuth } from '@/contexts/AuthContext';

type ClassCategory = Tables<'class_categories'>;
type ClassCategoryInsert = TablesInsert<'class_categories'>;
type ClassCategoryUpdate = TablesUpdate<'class_categories'>;

export type ClassCategoryWithCount = ClassCategory & {
  computed_class_count: number;
};

export const useClassCategories = (search?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['class-categories', search],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from('class_categories')
        .select('*, classes(count)');

      if (search) {
        query = query.or(`name.ilike.%${search}%,name_th.ilike.%${search}%`);
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) throw error;

      return (data ?? []).map((row: any) => ({
        ...row,
        computed_class_count: row.classes?.[0]?.count ?? 0,
      })) as ClassCategoryWithCount[];
    },
  });
};

export const useClassCategory = (id: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['class-categories', id],
    enabled: !!user && !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as ClassCategory;
    },
  });
};

export const useCategoryClasses = (categoryId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['class-categories', categoryId, 'classes'],
    enabled: !!user && !!categoryId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, name_th, type, level, status, updated_at')
        .eq('category_id', categoryId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useCreateClassCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ClassCategoryInsert) => {
      const { data: newCategory, error } = await supabase
        .from('class_categories')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return newCategory;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['class-categories'] });
      logActivity({
        event_type: 'class_category_created',
        activity: `Class category "${data.name}" created`,
        entity_type: 'class_category',
        entity_id: data.id,
      });
      toast.success(i18n.t('toast.categoryCreated'));
    },
    onError: (error) => {
      toast.error(i18n.t('toast.categoryCreateFailed'));
    },
  });
};

export const useUpdateClassCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data, oldData }: { id: string; data: ClassCategoryUpdate; oldData?: Record<string, unknown> }) => {
      const { data: updated, error } = await supabase
        .from('class_categories')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: (updated, variables) => {
      queryClient.invalidateQueries({ queryKey: ['class-categories'] });
      queryClient.invalidateQueries({ queryKey: ['class-categories', variables.id] });
      logActivity({
        event_type: 'class_category_updated',
        activity: `Class category "${updated.name}" updated`,
        entity_type: 'class_category',
        entity_id: variables.id,
        old_value: variables.oldData ?? null,
        new_value: variables.data as Record<string, unknown>,
      });
      toast.success(i18n.t('toast.categoryUpdated'));
    },
    onError: (error) => {
      toast.error(i18n.t('toast.categoryUpdateFailed'));
    },
  });
};

export const useDeleteClassCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('class_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['class-categories'] });
      logActivity({
        event_type: 'class_category_deleted',
        activity: `Class category deleted`,
        entity_type: 'class_category',
        entity_id: id,
      });
      toast.success(i18n.t('toast.categoryDeleted'));
    },
    onError: (error) => {
      toast.error(i18n.t('toast.categoryDeleteFailed'));
    },
  });
};
