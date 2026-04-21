import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { logActivity } from '@/lib/activityLogger';

export interface AiSuggestion {
  id: string;
  entity_type: string;
  entity_id: string | null;
  suggestion_type: string;
  payload: Record<string, unknown>;
  confidence: number | null;
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  created_by_ai_run_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  applied_at: string | null;
  created_at: string;
}

export function useAiSuggestions(status?: string, limit = 10) {
  return useQuery({
    queryKey: queryKeys.aiSuggestions(status),
    queryFn: async (): Promise<AiSuggestion[]> => {
      let query = supabase
        .from('ai_suggestions' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as AiSuggestion[];
    },
  });
}

export function useApproveSuggestion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_suggestions' as any)
        .update({
          status: 'approved',
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date().toISOString(),
        } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['ai-suggestions'] });
      logActivity({
        event_type: 'ai_suggestion_approved',
        activity: 'AI suggestion approved',
        entity_type: 'ai_suggestion',
        entity_id: id,
      });
      toast({ title: t('ai.suggestionApproved') });
    },
    onError: () => {
      toast({ title: t('ai.suggestionError'), variant: 'destructive' });
    },
  });
}

export function useRejectSuggestion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_suggestions' as any)
        .update({ status: 'rejected' } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['ai-suggestions'] });
      logActivity({
        event_type: 'ai_suggestion_rejected',
        activity: 'AI suggestion rejected',
        entity_type: 'ai_suggestion',
        entity_id: id,
      });
      toast({ title: t('ai.suggestionRejected') });
    },
    onError: () => {
      toast({ title: t('ai.suggestionError'), variant: 'destructive' });
    },
  });
}

export function useApplySuggestion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_suggestions' as any)
        .update({
          status: 'applied',
          applied_at: new Date().toISOString(),
        } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['ai-suggestions'] });
      logActivity({
        event_type: 'ai_suggestion_applied',
        activity: 'AI suggestion applied',
        entity_type: 'ai_suggestion',
        entity_id: id,
      });
      toast({ title: t('ai.suggestionApplied') });
    },
    onError: () => {
      toast({ title: t('ai.suggestionError'), variant: 'destructive' });
    },
  });
}
