import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logActivity } from '@/lib/activityLogger';
import { queryKeys } from '@/lib/queryKeys';

export interface EconomyGuardrail {
  id: string;
  rule_code: string;
  rule_value: string;
  description: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

export function useEconomyGuardrails() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.economyGuardrails(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('economy_guardrails')
        .select('*')
        .order('rule_code');
      if (error) throw error;
      return data as EconomyGuardrail[];
    },
  });

  const updateGuardrail = useMutation({
    mutationFn: async ({ id, rule_code, rule_value, is_active, old_rule_value, old_is_active }: { id: string; rule_code: string; rule_value: string; is_active: boolean; old_rule_value: string; old_is_active: boolean }) => {
      // Validation: divisors must be > 0, caps must be ≥ 1
      const numVal = Number(rule_value);
      if (isNaN(numVal)) throw new Error('Value must be a number');
      const isDivisor = /PER_\d+_THB/.test(rule_code);
      const isCap = rule_code.includes('CAP');
      if (isDivisor && numVal <= 0) throw new Error('Divisor must be > 0');
      if (isCap && numVal < 1) throw new Error('Cap must be ≥ 1');

      const { error } = await supabase
        .from('economy_guardrails')
        .update({ rule_value, is_active })
        .eq('id', id);
      if (error) throw error;

      // Audit log — fire-and-forget
      const { data: { user } } = await supabase.auth.getUser();
      supabase.from('gamification_audit_log').insert({
        event_type: 'admin_update_guardrail',
        action_key: rule_code,
        staff_id: user?.id ?? null,
        metadata: { guardrail_id: id, rule_code, old_value: old_rule_value, new_value: rule_value, old_is_active, new_is_active: is_active },
        flagged: false,
      }).then(({ error: auditErr }) => {
        if (auditErr) console.warn('[audit] guardrail log failed:', auditErr.message);
     qc.invalidateQueries({ queryKey: queryKeys.economyGuardrails() });
     toast.success('Guardrail updated'); @@
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.economyGuardrails() });
      toast.success('Guardrail updated');
      logActivity({ event_type: 'economy_guardrail_updated', entity_type: 'economy_guardrail', entity_id: variables.id, metadata: { rule_code: variables.rule_code, rule_value: variables.rule_value } });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { ...query, updateGuardrail };
}
