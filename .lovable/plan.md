

# Upgrade CreatePackage — Implementation Plan

## Current State
- `CreatePackage.tsx` uses raw `useState`, no form validation, no autosave, no draft persistence
- `packages` table has: `categories text[]`, `access_days jsonb`, `all_categories bool`, `any_day_any_time bool` — but NO `access_locations`, `schedule_start_at`, `schedule_end_at`, or AI columns
- `package_status` enum already includes `scheduled`
- `locations` table and `useLocations` hook exist; `useClassCategories` hook exists

## Database Migration

Add missing columns to `packages`:

```sql
ALTER TABLE packages ADD COLUMN access_locations uuid[] DEFAULT '{}'::uuid[];
ALTER TABLE packages ADD COLUMN all_locations boolean DEFAULT true;
ALTER TABLE packages ADD COLUMN schedule_start_at timestamptz;
ALTER TABLE packages ADD COLUMN schedule_end_at timestamptz;
ALTER TABLE packages ADD COLUMN ai_tags jsonb DEFAULT '[]'::jsonb;
ALTER TABLE packages ADD COLUMN ai_price_suggestion jsonb;
ALTER TABLE packages ADD COLUMN ai_copy_suggestions jsonb;
```

No join tables needed — `access_locations uuid[]` stores location IDs directly (matches existing `categories text[]` pattern). `access_days jsonb` already exists for day/time rules.

## Implementation Plan

### 1. Refactor CreatePackage to react-hook-form + Zod

- Define `createPackageSchema` with Zod (all current fields + new ones)
- Replace `useState` with `useForm` + `zodResolver`
- `watch()` feeds the preview sidebar in real-time

### 2. Autosave Draft

- `useEffect` with debounced (1s) save of `watch()` values to `localStorage('package-create-draft')`
- On mount, check localStorage and call `reset(draft)` if found
- "Discard" button clears localStorage + resets form

### 3. Access Locations Section

- Fetch locations via `useLocations()` (already exists)
- Radio: All locations / Specific locations
- When specific: multi-select checkboxes for locations
- Maps to `all_locations` bool + `access_locations uuid[]`

### 4. Class Categories Selection

- Already has radio for all/specific
- When specific: fetch `useClassCategories()`, render multi-select checkboxes
- Maps to existing `all_categories` bool + `categories text[]`

### 5. Access Days & Times

- Already has radio for any/specific
- When specific: day-of-week checkboxes + start/end time inputs per selected day
- Maps to existing `access_days jsonb` (array of `{day, start_time, end_time}`)

### 6. Distribution Section

- New Card with 3 radio options:
  - "Sell now" → status = `on_sale`
  - "Scheduled sale" → status = `scheduled`, show date pickers for `schedule_start_at` / `schedule_end_at`
  - "Save as draft" → status = `drafts`
- Remove old action buttons pattern, replace with single "Create Package" button that uses the selected distribution

### 7. AI Assist Placeholder

- Disabled Card section "AI Assist (coming soon)" with greyed-out placeholders for tags, price suggestion, copy suggestions
- No logic wired

### 8. Preview Sidebar

- Enhanced with all new fields: selected locations, selected categories, access day rules, distribution status/dates

### 9. i18n Keys

Add keys for: access locations, specific locations, distribution, sell now, scheduled sale, schedule dates, AI assist coming soon

## Files Summary

| Action | File |
|--------|------|
| Migration | Add 7 columns to `packages` |
| Rewrite | `src/pages/CreatePackage.tsx` — react-hook-form + all new sections |
| Modify | `src/i18n/locales/en.ts` — new keys |
| Modify | `src/i18n/locales/th.ts` — new keys |

No new hooks needed — reuses existing `useLocations`, `useClassCategories`, `useCreatePackage`. No breaking changes to existing data.

