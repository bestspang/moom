import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
    queryKey: ['economy-guardrails'],
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
    mutationFn: async ({ id, rule_value, is_active }: { id: string; rule_value: string; is_active: boolean }) => {
      // Validation: divisors must be > 0
      const numVal = Number(rule_value);
      if (isNaN(numVal)) throw new Error('Value must be a number');
      if (rule_value.includes('DIVISOR') && numVal <= 0) throw new Error('Divisor must be > 0');
      if (rule_value.includes('CAP') && numVal < 1) throw new Error('Cap must be ≥ 1');

      const { error } = await supabase
        .from('economy_guardrails')
        .update({ rule_value, is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['economy-guardrails'] });
      toast.success('Guardrail updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { ...query, updateGuardrail };
}
