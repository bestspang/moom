import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export interface WorkoutItemRow {
  id: string;
  training_id: string;
  name: string;
  track_metric: string | null;
  unit: string | null;
  goal_type: string | null;
  description: string | null;
  ai_cues: Record<string, unknown> | null;
  sort_order: number;
  created_at: string;
}

export interface TrainingTemplateRow {
  id: string;
  name: string;
  is_active: boolean;
  ai_tags: unknown[] | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  workout_items: WorkoutItemRow[];
}

// ── List ──
export function useTrainingTemplates(search?: string, filterTrainingId?: string) {
  return useQuery({
    queryKey: queryKeys.trainingTemplates(search, filterTrainingId),
    queryFn: async () => {
      let query = supabase
        .from('training_templates')
        .select('*, workout_items(*)')
        .order('created_at', { ascending: true });

      if (filterTrainingId) {
        query = query.eq('id', filterTrainingId);
      }

      const { data, error } = await query;
      if (error) throw error;

      let results = (data ?? []) as unknown as TrainingTemplateRow[];

      // Sort workout_items by sort_order within each training
      results = results.map((t) => ({
        ...t,
        workout_items: [...(t.workout_items ?? [])].sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
        ),
      }));

      // Client-side search across training name, workout name, description
      if (search?.trim()) {
        const q = search.trim().toLowerCase();
        results = results
          .map((t) => {
            const trainingMatch = t.name.toLowerCase().includes(q);
            const matchedItems = t.workout_items.filter(
              (w) =>
                w.name.toLowerCase().includes(q) ||
                (w.description ?? '').toLowerCase().includes(q)
            );
            if (trainingMatch) return t; // show all items if training name matches
            if (matchedItems.length > 0) return { ...t, workout_items: matchedItems };
            return null;
          })
          .filter(Boolean) as TrainingTemplateRow[];
      }

      return results;
    },
  });
}

// ── Create ──
export interface CreateTrainingInput {
  name: string;
  items: {
    name: string;
    track_metric?: string;
    unit?: string;
    goal_type?: string;
    description?: string;
  }[];
}

export function useCreateTraining() {
  const qc = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (input: CreateTrainingInput) => {
      // 1. Insert training template
      const { data: training, error: tErr } = await supabase
        .from('training_templates')
        .insert({ name: input.name })
        .select()
        .single();
      if (tErr) throw tErr;

      // 2. Batch insert workout items
      if (input.items.length > 0) {
        const rows = input.items.map((item, idx) => ({
          training_id: training.id,
          name: item.name,
          track_metric: item.track_metric || null,
          unit: item.unit || null,
          goal_type: item.goal_type || null,
          description: item.description || null,
          sort_order: idx,
        }));
        const { error: iErr } = await supabase.from('workout_items').insert(rows);
        if (iErr) throw iErr;
      }

      return training;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['training-templates'] });
      toast.success(t('workouts.createSuccess'));
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

// ── Update (name / is_active) ──
export function useUpdateTraining() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; name?: string; is_active?: boolean }) => {
      const updates: Record<string, unknown> = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.is_active !== undefined) updates.is_active = input.is_active;

      const { error } = await supabase
        .from('training_templates')
        .update(updates)
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['training-templates'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
