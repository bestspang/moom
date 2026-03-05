

# Fix: Enable Import CSV for Classes, Workouts, and Transfer Slips

## Problem
The Import CSV buttons on Class list, Workout list, and Transfer slips cards are disabled (`hasImport: false`) because no entity configs exist for them.

## Plan

### 1. Create entity configs for Classes and Workouts

**`src/lib/importer/entityConfigs/classes.ts`** — New file
- Header aliases: name, name_th, type (class/pt), level (all_levels/beginner/intermediate/advanced), duration, status, description, description_th, category
- Validate: require `name`
- Upsert: match by `name` + `type`, insert/update `classes` table
- Invalidate: `['classes']`

**`src/lib/importer/entityConfigs/workouts.ts`** — New file
- Header aliases: name, description, is_active
- Validate: require `name`
- Upsert: match by `name`, insert/update `training_templates` table
- Invalidate: `['training-templates']`

### 2. Update EntityId type and registry

**`src/lib/importer/types.ts`** — Add `'classes' | 'workouts'` to `EntityId`

**`src/lib/importer/index.ts`** — Import and register `classesConfig` and `workoutsConfig`

### 3. Enable import buttons in SettingsImportExport

**`src/pages/settings/SettingsImportExport.tsx`** — Set `hasImport: true` and add `importEntity` for classes, workouts, and slips (slips stays stub with error message)

### 4. Slips — keep as stub but allow opening the dialog
Set `hasImport: true` for slips so the button is clickable. The existing stub config in `index.ts` already returns validation error "Slips import not yet supported", which will show in preview step.

### Files to create/modify

| File | Action |
|---|---|
| `src/lib/importer/entityConfigs/classes.ts` | Create |
| `src/lib/importer/entityConfigs/workouts.ts` | Create |
| `src/lib/importer/types.ts` | Edit — add classes/workouts to EntityId |
| `src/lib/importer/index.ts` | Edit — register new configs |
| `src/pages/settings/SettingsImportExport.tsx` | Edit — enable import for classes/workouts/slips |

### Risk: Low
- Additive only — no existing behavior changed
- Classes and training_templates tables already exist in DB

