import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { getBangkokDayRange } from '@/lib/dateRange';

/**
 * Net XP a member has earned today (Asia/Bangkok), summed from their own xp_ledger.
 * xp_ledger has a member self-read RLS policy, so no RPC is needed.
 */
export function useXpToday(memberId: string | null) {
  const { start, end } = getBangkokDayRange(new Date());
  const day = start.slice(0, 10);
  return useQuery({
    queryKey: queryKeys.memberXpToday(memberId, day),
    enabled: !!memberId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('xp_ledger')
        .select('delta')
        .eq('member_id', memberId as string)
        .gte('created_at', start)
        .lt('created_at', end);
      if (error) throw error;
      return (data ?? []).reduce((sum, r) => sum + (Number(r.delta) || 0), 0);
    },
  });
}
