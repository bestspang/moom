import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, subMonths, differenceInMonths } from 'date-fns';

export interface CohortRow {
  cohortMonth: string;       // yyyy-MM
  cohortLabel: string;       // e.g. "Jan"
  totalJoined: number;
  /** Retention % at month 1, 3, 6, 12 */
  m1: number;
  m3: number;
  m6: number;
  m12: number;
}

/**
 * Groups members by join month and checks how many still have
 * an active/ready_to_use package N months later.
 * Looks back 12 months from today.
 */
export function useCohortRetention() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['cohort-retention'],
    enabled: !!user,
    queryFn: async (): Promise<CohortRow[]> => {
      const now = new Date();
      const twelveMonthsAgo = format(subMonths(now, 11), 'yyyy-MM-dd');

      // 1. Members who joined in the last 12 months
      const { data: members, error: mErr } = await supabase
        .from('members')
        .select('id, member_since, status')
        .gte('member_since', twelveMonthsAgo)
        .not('member_since', 'is', null);

      if (mErr) throw mErr;

      // 2. All member_packages for those members (to check retention at various points)
      const memberIds = (members || []).map((m) => m.id);
      if (memberIds.length === 0) {
        return buildEmptyCohorts(now);
      }

      // Batch in chunks of 200
      const allPkgs: Array<{ member_id: string; status: string | null; purchase_date: string | null; expiry_date: string | null }> = [];
      for (let i = 0; i < memberIds.length; i += 200) {
        const chunk = memberIds.slice(i, i + 200);
        const { data: pkgs } = await supabase
          .from('member_packages')
          .select('member_id, status, purchase_date, expiry_date')
          .in('member_id', chunk);
        if (pkgs) allPkgs.push(...pkgs);
      }

      // Group members by cohort month
      const cohorts = new Map<string, { members: typeof members }>();
      for (let i = 11; i >= 0; i--) {
        const key = format(subMonths(now, i), 'yyyy-MM');
        cohorts.set(key, { members: [] });
      }

      (members || []).forEach((m) => {
        const key = format(new Date(m.member_since!), 'yyyy-MM');
        const c = cohorts.get(key);
        if (c) c.members!.push(m);
      });

      // Build package lookup: memberId → array of packages
      const pkgMap = new Map<string, typeof allPkgs>();
      allPkgs.forEach((p) => {
        const arr = pkgMap.get(p.member_id) || [];
        arr.push(p);
        pkgMap.set(p.member_id, arr);
      });

      const result: CohortRow[] = [];

      cohorts.forEach((cohort, monthKey) => {
        const totalJoined = cohort.members!.length;
        if (totalJoined === 0) {
          result.push({
            cohortMonth: monthKey,
            cohortLabel: format(new Date(monthKey + '-01'), 'MMM'),
            totalJoined: 0,
            m1: 0, m3: 0, m6: 0, m12: 0,
          });
          return;
        }

        const cohortDate = new Date(monthKey + '-01');
        const monthsElapsed = differenceInMonths(now, cohortDate);

        const calcRetention = (nMonths: number): number => {
          if (monthsElapsed < nMonths) return -1; // Not enough time elapsed
          const checkDate = new Date(cohortDate);
          checkDate.setMonth(checkDate.getMonth() + nMonths);

          let retained = 0;
          cohort.members!.forEach((m) => {
            const memberPkgs = pkgMap.get(m.id) || [];
            // Check if member had an active package at checkDate
            const hadPkg = memberPkgs.some((p) => {
              if (!p.purchase_date) return false;
              const start = new Date(p.purchase_date);
              const end = p.expiry_date ? new Date(p.expiry_date) : new Date('2099-12-31');
              return start <= checkDate && end >= checkDate;
            });
            // Or member is still active (for members without expiry tracking)
            if (hadPkg || m.status === 'active') retained++;
          });
          return Math.round((retained / totalJoined) * 100);
        };

        result.push({
          cohortMonth: monthKey,
          cohortLabel: format(cohortDate, 'MMM'),
          totalJoined,
          m1: calcRetention(1),
          m3: calcRetention(3),
          m6: calcRetention(6),
          m12: calcRetention(12),
        });
      });

      return result;
    },
    staleTime: 15 * 60 * 1000,
  });
}

function buildEmptyCohorts(now: Date): CohortRow[] {
  const result: CohortRow[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = subMonths(now, i);
    result.push({
      cohortMonth: format(d, 'yyyy-MM'),
      cohortLabel: format(d, 'MMM'),
      totalJoined: 0,
      m1: 0, m3: 0, m6: 0, m12: 0,
    });
  }
  return result;
}
