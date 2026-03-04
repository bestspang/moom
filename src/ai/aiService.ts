import { supabase } from '@/integrations/supabase/client';
import type { AiRunMeta } from './types';

export interface AiService {
  runPrompt(templateName: string, input: Record<string, unknown>): Promise<unknown>;
  logRun(meta: AiRunMeta): Promise<void>;
}

/**
 * Stub implementation — returns mock output and optionally logs to ai_runs.
 * Replace with real AI calls when ready.
 */
export const stubAiService: AiService = {
  async runPrompt(templateName, input) {
    return { stub: true, templateName, input };
  },

  async logRun(meta) {
    const row = {
      actor_user_id: meta.actorUserId,
      prompt_template_id: meta.promptTemplateId ?? null,
      scope_location_id: meta.scopeLocationId ?? null,
      model: meta.model ?? null,
      input: (meta.input as any) ?? null,
      output: (meta.output as any) ?? null,
      latency_ms: meta.latencyMs ?? null,
      cost_usd: meta.costUsd ?? null,
      status: meta.status,
      error: meta.error ?? null,
    };
    const { error } = await supabase.from('ai_runs').insert([row]);
    if (error) console.error('[aiService.logRun] insert failed:', error.message);
  },
};
