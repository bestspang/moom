import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/lib/queryKeys';

export interface ExpiringPackage {
  id: string;
  memberName: string;
  memberId: string;
  packageName: string;
  expiryDate: string;
  daysLeft: number;
  urgency: 'red' | 'yellow' | 'green';
}

export const useExpiringPackages = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...queryKeys.dashboardStats(), 'expiring-packages'],
    enabled: !!user,
    queryFn: async (): Promise<ExpiringPackage[]> => {
      const now = new Date();
      const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('member_packages')
        .select(`
          id,
          expiry_date,
          members!inner (id, first_name, last_name, member_id),
          packages!inner (name_en)
        `)
        .eq('status', 'active')
        .not('expiry_date', 'is', null)
        .gte('expiry_date', now.toISOString().split('T')[0])
        .lte('expiry_date', in30Days.toISOString().split('T')[0])
        .order('expiry_date', { ascending: true })
        .limit(20);

      if (error) throw error;

      return (data || []).map((row: any) => {
        const expiryDate = new Date(row.expiry_date);
        const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        let urgency: 'red' | 'yellow' | 'green';
        if (daysLeft <= 7) urgency = 'red';
        else if (daysLeft <= 14) urgency = 'yellow';
        else urgency = 'green';

        return {
          id: row.id,
          memberName: `${row.members.first_name} ${row.members.last_name}`,
          memberId: row.members.id,
          packageName: row.packages.name_en,
          expiryDate: row.expiry_date,
          daysLeft,
          urgency,
        };
      });
    },
  });
};
