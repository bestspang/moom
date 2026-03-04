

# Workout List Data Complete (`workout_list_data_complete_01`)

## Current State

| Area | Status |
|------|--------|
| DB tables `training_templates` + `workout_items` | ✅ Exist with correct schema |
| Create training + batch workout items | ✅ Working |
| Update training name/is_active toggle | ✅ Working with activity_log |
| List with search + filter dropdown | ✅ Working (client-side search) |
| Realtime sync | ✅ Both tables in TABLE_INVALIDATION_MAP |
| Create dialog with draft persistence | ✅ Working |
| AI-readiness field (`ai_tags` / `ai_cues`) | ✅ Already on both tables |

## Gaps

### GAP 1: Missing auth guard — same empty-list bug pattern
`useTrainingTemplates` has no `enabled: !!user`. During auth transitions, RLS blocks the query and React Query caches empty results.

### GAP 2: No edit workout items
Cannot rename, change metric/unit/goal, or update description of existing workout items.

### GAP 3: No delete workout item or delete training
No way to remove a single workout row or archive/delete an entire training template.

### GAP 4: Missing DB indexes
No index on `workout_items.training_id` or `workout_items.sort_order`. As data grows, the `select('*, workout_items(*)')` join will slow down.

---

## Implementation Plan

### Step 1: DB migration — add indexes
```sql
CREATE INDEX IF NOT EXISTS idx_workout_items_training_id ON public.workout_items (training_id);
CREATE INDEX IF NOT EXISTS idx_workout_items_sort_order ON public.workout_items (training_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_training_templates_created_at ON public.training_templates (created_at);
```

### Step 2: Fix `useTrainingTemplates` hook
- Import `useAuth`, add `enabled: !!user` to both query calls
- Add `useUpdateWorkoutItem` mutation (update any field on a workout_item row, log activity)
- Add `useDeleteWorkoutItem` mutation (delete row, log activity)
- Add `useDeleteTraining` mutation (delete training + cascade workout_items, log activity)

### Step 3: Update `WorkoutList.tsx` — add edit/delete actions
- Add an "Actions" column to the DataTable with Edit and Delete buttons per workout item
- Add inline edit capability (or a small edit dialog) for workout item fields
- Add delete confirmation for training templates (with cascade warning)
- Add edit training name capability (inline or dialog)

### Files to Touch

| File | Change |
|------|--------|
| DB migration | Add 3 indexes |
| `src/hooks/useTrainingTemplates.ts` | Auth guard + 3 new mutations |
| `src/pages/WorkoutList.tsx` | Edit/delete actions UI |

No breaking changes. All additive.

