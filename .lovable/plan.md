

# DB-Backed Training/Workout System

## Current State
- `WorkoutList.tsx` uses hardcoded data, no DB tables exist for training/workouts
- Existing `workouts` table in DB is a flat structure (no training groups) — will be replaced by the new `training_templates` + `workout_items` two-table design
- Realtime sync already covers many tables but not training/workout tables

## Plan

### 1. Database Migration

Create two new tables + enable realtime:

```sql
-- Training templates (groups)
CREATE TABLE public.training_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean DEFAULT true,
  ai_tags jsonb DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Workout items within a training
CREATE TABLE public.workout_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id uuid NOT NULL REFERENCES public.training_templates(id) ON DELETE CASCADE,
  name text NOT NULL,
  track_metric text,
  unit text,
  goal_type text,  -- minimize, maximize, target
  description text,
  ai_cues jsonb DEFAULT '{}'::jsonb,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.training_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_items ENABLE ROW LEVEL SECURITY;

-- Read policies (all authenticated)
CREATE POLICY "All can read training_templates" ON public.training_templates FOR SELECT USING (true);
CREATE POLICY "All can read workout_items" ON public.workout_items FOR SELECT USING (true);

-- Write policies (manager+)
CREATE POLICY "Managers can manage training_templates" ON public.training_templates FOR ALL USING (has_min_access_level(auth.uid(), 'level_3_manager'::access_level));
CREATE POLICY "Managers can manage workout_items" ON public.workout_items FOR ALL USING (has_min_access_level(auth.uid(), 'level_3_manager'::access_level));

-- updated_at trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.training_templates FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.training_templates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workout_items;
```

### 2. Create Hook — `src/hooks/useTrainingTemplates.ts`

- `useTrainingTemplates(search?, filterTrainingId?)` — fetches `training_templates` with nested `workout_items` via `.select('*, workout_items(*)')`, filters by search across training name / workout name / description
- `useCreateTraining()` — mutation that inserts training + items (insert training first, then batch insert items with the returned ID)
- `useUpdateTraining()` — update name / toggle `is_active`
- `useDeleteTraining()` — optional delete

Query keys: `['training-templates', search, filter]`

### 3. Create Component — `src/components/workouts/CreateTrainingDialog.tsx`

- Dialog with training name input (required)
- Dynamic workout rows: name, track_metric (select: Time/Rounds+Reps/Weight/Distance/Reps), unit (text), goal_type (select: Minimize/Maximize/Target), description
- "Add workout" button appends row
- Remove row button per row
- Footer: required fields message + Discard + Confirm buttons
- Draft autosave to `localStorage` key `training-create-draft`
- On confirm: calls `useCreateTraining` mutation, closes dialog, shows toast

### 4. Rewrite `src/pages/WorkoutList.tsx`

- Replace hardcoded data with `useTrainingTemplates(search, selectedTrainingId)`
- Search bar filters across training name, workout name, description
- Filter dropdown "All training" lists training names from data
- Each training group rendered as a `Collapsible` section with:
  - Training name + active/inactive toggle (Switch)
  - DataTable of workout items (columns: Workout, Track metric, Unit, Goal type, Description)
- "Create training" button in PageHeader opens `CreateTrainingDialog`
- Empty state when no trainings exist

### 5. Update Realtime — `src/hooks/useRealtimeSync.ts`

Add `training_templates` and `workout_items` to `TableName` union and invalidation map:
- `training_templates` → `['training-templates']`
- `workout_items` → `['training-templates']`

### 6. i18n Keys

Add to both `en.ts` and `th.ts` under `workouts`:
- `createTraining`, `trainingName`, `addWorkout`, `goalType`, `description`, `minimize`, `maximize`, `target`, `discardDraft`, `confirm`, `requiredFields`, `createSuccess`, `deleteConfirm`, `active`, `inactive`, `noTrainings`, `filterByTraining`

### 7. Update `src/lib/queryKeys.ts`

Add: `trainingTemplates: (search?, filter?) => ['training-templates', search, filter]`

## Files Summary

| Action | File |
|--------|------|
| Migration | Create `training_templates` + `workout_items` tables with RLS + realtime |
| Create | `src/hooks/useTrainingTemplates.ts` |
| Create | `src/components/workouts/CreateTrainingDialog.tsx` |
| Rewrite | `src/pages/WorkoutList.tsx` |
| Modify | `src/hooks/useRealtimeSync.ts` — add 2 tables |
| Modify | `src/lib/queryKeys.ts` — add training keys |
| Modify | `src/i18n/locales/en.ts` — extend workouts keys |
| Modify | `src/i18n/locales/th.ts` — extend workouts keys |

No breaking changes. Existing `workouts` table in DB is unused by the new code (the old page used hardcoded data). New tables are additive.

