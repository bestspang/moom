import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

type Status = 'pending' | 'sent' | 'failed' | 'skipped';

export interface LinePushOutboxStats {
  pending: number;
  sent: number;
  failed: number;
  skipped: number;
  lastError: { template: string; error: string; at: string } | null;
}

async function fetchCount(status: Status, since: string): Promise<number> {
  const { count, error } = await supabase
    .from('line_push_outbox')
    .select('id', { count: 'exact', head: true })
    .eq('status', status)
    .gte('created_at', since);
  if (error) throw error;
  return count ?? 0;
}

/** Manager+ only (RLS enforces). Returns 24h counts across statuses + last failure. */
export function useLinePushOutboxStats() {
  return useQuery({
    queryKey: queryKeys.linePushOutboxStats(),
    queryFn: async (): Promise<LinePushOutboxStats> => {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const [pending, sent, failed, skipped] = await Promise.all([
        fetchCount('pending', since),
        fetchCount('sent', since),
        fetchCount('failed', since),
        fetchCount('skipped', since),
      ]);

      const { data: lastErrorRow } = await supabase
        .from('line_push_outbox')
        .select('template, last_error, created_at')
        .eq('status', 'failed')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        pending,
        sent,
        failed,
        skipped,
        lastError: lastErrorRow?.last_error
          ? {
              template: lastErrorRow.template as string,
              error: lastErrorRow.last_error as string,
              at: lastErrorRow.created_at as string,
            }
          : null,
      };
    },
    staleTime: 30_000,
  });
}
