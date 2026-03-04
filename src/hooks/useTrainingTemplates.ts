import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { logActivity } from '@/lib/activityLogger';

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
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.trainingTemplates(search, filterTrainingId),
    enabled: !!user,
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
            if (trainingMatch) return t;
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
      const { data: training, error: tErr } = await supabase
        .from('training_templates')
        .insert({ name: input.name })
        .select()
        .single();
      if (tErr) throw tErr;

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
    onSuccess: (training) => {
      qc.invalidateQueries({ queryKey: ['training-templates'] });
      toast.success(t('workouts.createSuccess'));
      logActivity({
        event_type: 'training_created',
        activity: `Training template "${training.name}" created`,
        entity_type: 'training',
        entity_id: training.id,
      });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

// ── Update training (name / is_active) ──
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
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['training-templates'] });
      logActivity({
        event_type: 'training_updated',
        activity: `Training template updated`,
        entity_type: 'training',
        entity_id: variables.id,
        new_value: variables as Record<string, unknown>,
      });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

// ── Update workout item ──
export function useUpdateWorkoutItem() {
  const qc = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      track_metric?: string;
      unit?: string;
      goal_type?: string;
      description?: string;
    }) => {
      const { id, ...updates } = input;
      const { error } = await supabase
        .from('workout_items')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['training-templates'] });
      toast.success(t('workouts.updateSuccess'));
      logActivity({
        event_type: 'workout_item_updated',
        activity: `Workout item updated`,
        entity_type: 'workout_item',
        entity_id: variables.id,
        new_value: variables as Record<string, unknown>,
      });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

// ── Delete workout item ──
export function useDeleteWorkoutItem() {
  const qc = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (input: { id: string; name: string }) => {
      const { error } = await supabase
        .from('workout_items')
        .delete()
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['training-templates'] });
      toast.success(t('workouts.deleteSuccess'));
      logActivity({
        event_type: 'workout_item_deleted',
        activity: `Workout item "${variables.name}" deleted`,
        entity_type: 'workout_item',
        entity_id: variables.id,
      });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

// ── Delete training (cascade) ──
export function useDeleteTraining() {
  const qc = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (input: { id: string; name: string }) => {
      const { error } = await supabase
        .from('training_templates')
        .delete()
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['training-templates'] });
      toast.success(t('workouts.deleteTrainingSuccess'));
      logActivity({
        event_type: 'training_deleted',
        activity: `Training template "${variables.name}" deleted`,
        entity_type: 'training',
        entity_id: variables.id,
      });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
