import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useCallback } from 'react';
import { queryKeys } from '@/lib/queryKeys';

const DISMISS_KEY_PREFIX = 'daily-briefing-dismiss-';

function getDismissKey() {
  const today = new Date().toISOString().slice(0, 10);
  return `${DISMISS_KEY_PREFIX}${today}`;
}

interface BriefingAction {
  text: string;
  route: string;
  priority: 'high' | 'medium' | 'low';
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

interface BriefingData {
  summary: string;
  actions: BriefingAction[];
  source: string;
}

export function useDailyBriefing(stats: BriefingStats | undefined) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(getDismissKey()) === '1'; } catch { return false; }
  });

  const query = useQuery({
    queryKey: queryKeys.dailyBriefing(stats, language),
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('daily-briefing', {
        body: { stats, language },
      });
      if (error) throw error;
      return {
        summary: data?.summary || '',
        actions: Array.isArray(data?.actions) ? data.actions : [],
        source: data?.source || 'unknown',
      } as BriefingData;
    },
    enabled: !!stats && !dismissed,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(getDismissKey(), '1');
    } catch {
      // Ignore localStorage failures; dismissal still applies for this session.
    }
    setDismissed(true);
  }, []);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dailyBriefing() });
  }, [queryClient]);

  return { ...query, dismissed, dismiss, refresh };
}
