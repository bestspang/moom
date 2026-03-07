import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ChurnRiskMember {
  id: string;
  name: string;
  phone: string | null;
  recentCount: number;
  priorCount: number;
  declinePercent: number;
}

/**
 * Identifies members whose attendance frequency dropped >50%
 * comparing last 30 days vs prior 30 days.
 */
export function useChurnPrediction() {
  return useQuery({
    queryKey: ['churn-prediction'],
    queryFn: async () => {
      const now = new Date();
      const d30 = new Date(now.getTime() - 30 * 86_400_000).toISOString();
      const d60 = new Date(now.getTime() - 60 * 86_400_000).toISOString();

      // Get all attendance in last 60 days
      const { data: attendance, error } = await supabase
        .from('member_attendance')
        .select('member_id, check_in_time')
        .gte('check_in_time', d60);

      if (error) throw error;

      // Get member info
      const memberIds = [...new Set((attendance || []).map(a => a.member_id))];
      if (memberIds.length === 0) return [];

      const { data: members } = await supabase
        .from('members')
        .select('id, first_name, last_name, phone, status')
        .in('id', memberIds)
        .eq('status', 'active');

      const memberMap = new Map((members || []).map(m => [m.id, m]));

      // Count per member: recent (last 30d) vs prior (30-60d)
      const counts = new Map<string, { recent: number; prior: number }>();
      for (const a of attendance || []) {
        if (!counts.has(a.member_id)) counts.set(a.member_id, { recent: 0, prior: 0 });
        const c = counts.get(a.member_id)!;
        if (a.check_in_time && a.check_in_time >= d30) c.recent++;
        else c.prior++;
      }

      const results: ChurnRiskMember[] = [];
      for (const [memberId, c] of counts) {
        // Only flag if they had activity before (prior > 0) and declined > 50%
        if (c.prior >= 2 && c.recent < c.prior * 0.5) {
          const m = memberMap.get(memberId);
          if (!m) continue;
          results.push({
            id: memberId,
            name: `${m.first_name} ${m.last_name}`,
            phone: m.phone,
            recentCount: c.recent,
            priorCount: c.prior,
            declinePercent: Math.round((1 - c.recent / c.prior) * 100),
          });
        }
      }

      return results.sort((a, b) => b.declinePercent - a.declinePercent).slice(0, 20);
    },
    staleTime: 10 * 60 * 1000,
  });
}
