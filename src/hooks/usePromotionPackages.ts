import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Package = Tables<'packages'>;

export const usePromotionPackages = (packageIds: string[] | null) => {
  return useQuery({
    queryKey: ['promotion-packages', packageIds],
    queryFn: async () => {
      if (!packageIds || packageIds.length === 0) return [] as Package[];

      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .in('id', packageIds);

      if (error) throw error;
      return data as Package[];
    },
    enabled: !!packageIds && packageIds.length > 0,
  });
};
