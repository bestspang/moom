import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useCallback } from 'react';

const DISMISS_KEY_PREFIX = 'daily-briefing-dismiss-';

function getDismissKey() {
  const today = new Date().toISOString().slice(0, 10);
  return `${DISMISS_KEY_PREFIX}${today}`;
}

interface BriefingStats {
  checkinsToday: number;
  classesToday: number;
  currentlyInClass: number;
  expiringPackages7d: number;
  expiringPackages30d: number;
  highRiskCount: number;
  activeMembers: number;
}

export function useDailyBriefing(stats: BriefingStats | undefined) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(getDismissKey()) === '1'; } catch { return false; }
  });

  const query = useQuery({
    queryKey: ['daily-briefing', stats, language],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('daily-briefing', {
        body: { stats, language },
      });
      if (error) throw error;
      return data as { summary: string; source: string };
    },
    enabled: !!stats && !dismissed,
    staleTime: 30 * 60 * 1000, // 30 min
    retry: 1,
  });

  const dismiss = useCallback(() => {
    try { localStorage.setItem(getDismissKey(), '1'); } catch {}
    setDismissed(true);
  }, []);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['daily-briefing'] });
  }, [queryClient]);

  return { ...query, dismissed, dismiss, refresh };
}
