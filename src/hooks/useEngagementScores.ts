import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateEngagementScore, type EngagementResult } from '@/lib/engagementScore';
import { differenceInDays } from 'date-fns';
import { queryKeys } from '@/lib/queryKeys';

export function useEngagementScores(memberIds: string[]) {
  return useQuery({
    queryKey: queryKeys.engagementScores(memberIds),
    queryFn: async () => {
      if (memberIds.length === 0) return {} as Record<string, EngagementResult>;

      // Batch query attendance counts + latest per member
      const { data: attendance } = await supabase
        .from('member_attendance')
        .select('member_id, check_in_time')
        .in('member_id', memberIds);

      // Batch query member_packages for sessions
      const { data: packages } = await supabase
        .from('member_packages')
        .select('member_id, sessions_used, sessions_remaining, status')
        .in('member_id', memberIds)
        .in('status', ['active', 'ready_to_use']);

      // Fetch join dates
      const { data: members } = await supabase
        .from('members')
        .select('id, member_since')
        .in('id', memberIds);

      const now = new Date();
      const result: Record<string, EngagementResult> = {};

      // Pre-process attendance by member
      const attendanceMap = new Map<string, { count: number; latest: Date | null }>();
      for (const a of attendance || []) {
        const existing = attendanceMap.get(a.member_id);
        const t = a.check_in_time ? new Date(a.check_in_time) : null;
        if (!existing) {
          attendanceMap.set(a.member_id, { count: 1, latest: t });
        } else {
          existing.count++;
          if (t && (!existing.latest || t > existing.latest)) {
            existing.latest = t;
          }
        }
      }

      // Pre-process packages by member
      const packageMap = new Map<string, { sessionsUsed: number; totalSessions: number | null }>();
      for (const p of packages || []) {
        const existing = packageMap.get(p.member_id);
        const used = p.sessions_used || 0;
        const total = (p.sessions_remaining !== null && p.sessions_used !== null)
          ? (p.sessions_remaining + p.sessions_used)
          : null;
        if (!existing) {
          packageMap.set(p.member_id, { sessionsUsed: used, totalSessions: total });
        } else {
          existing.sessionsUsed += used;
          if (total !== null) {
            existing.totalSessions = (existing.totalSessions || 0) + total;
          }
        }
      }

      // Member join dates
      const memberMap = new Map<string, string | null>();
      for (const m of members || []) {
        memberMap.set(m.id, m.member_since);
      }

      for (const id of memberIds) {
        const att = attendanceMap.get(id);
        const pkg = packageMap.get(id);
        const joinDate = memberMap.get(id);

        const daysSinceJoin = joinDate ? differenceInDays(now, new Date(joinDate)) : 30;
        const daysSinceLastVisit = att?.latest ? differenceInDays(now, att.latest) : null;

        result[id] = calculateEngagementScore({
          totalVisits: att?.count || 0,
          daysSinceLastVisit,
          sessionsUsed: pkg?.sessionsUsed || 0,
          totalSessions: pkg?.totalSessions ?? null,
          daysSinceJoin: Math.max(1, daysSinceJoin),
        });
      }

      return result;
    },
    enabled: memberIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Single member engagement score hook
 */
export function useEngagementScore(memberId: string | undefined) {
  const ids = memberId ? [memberId] : [];
  const query = useEngagementScores(ids);
  return {
    ...query,
    data: memberId && query.data ? query.data[memberId] : undefined,
  };
}
