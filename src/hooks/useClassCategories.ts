import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type ClassCategory = Tables<'class_categories'>;
type ClassCategoryInsert = TablesInsert<'class_categories'>;
type ClassCategoryUpdate = TablesUpdate<'class_categories'>;

export const useClassCategories = (search?: string) => {
  return useQuery({
    queryKey: ['class-categories', search],
    queryFn: async () => {
      let query = supabase.from('class_categories').select('*');
      
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }
      
      const { data, error } = await query.order('name', { ascending: true });
      
      if (error) throw error;
      return data as ClassCategory[];
    },
  });
};

export const useClassCategory = (id: string) => {
  return useQuery({
    queryKey: ['class-categories', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_categories')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as ClassCategory;
    },
    enabled: !!id,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-categories'] });
      toast.success('Category created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create category: ${error.message}`);
    },
  });
};

export const useUpdateClassCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ClassCategoryUpdate }) => {
      const { data: updated, error } = await supabase
        .from('class_categories')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updated;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['class-categories'] });
      queryClient.invalidateQueries({ queryKey: ['class-categories', variables.id] });
      toast.success('Category updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update category: ${error.message}`);
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-categories'] });
      toast.success('Category deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete category: ${error.message}`);
    },
  });
};
