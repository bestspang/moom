

# Class Module — Implementation Plan

## Current State

- **DB `classes` table**: Has `name`, `description`, `type` (class/pt), `category_id`, `level`, `duration`, `status` (active/drafts/archive). Missing `name_th`.
- **Hooks**: `useClasses`, `useClassStats`, `useClass`, `useCreateClass`, `useUpdateClass`, `useDeleteClass` exist with basic functionality.
- **Classes list page**: Has tabs + search but no filters (Type/Categories/Level), no row click navigation, no create page link.
- **No Create Class page** — button exists but does nothing.
- **No Class Details page** — no route, no component.
- **`useClass(id)` uses `queryKeys.classes(id)`** which collides with list query keys.
- **Status values**: 'active'/'drafts'/'archive' — keep these to avoid breaking existing data. Map 'active' as "published" conceptually.

## Gaps to Fix

### A. DB Migration
Add `name_th` column to `classes` table (text, nullable).

### B. Query Keys
Add `classDetail: (id) => ['classes', 'detail', id]` and update `useClass` to use it. Add `classPerformance: (id) => ['class-performance', id]`.

### C. Class List Page Enhancements
- Add Type, Categories, Level filter dropdowns
- Add row click → navigate to `/class/:id`
- Create button → navigate to `/class/create`
- Pass filters to `useClasses` hook
- Search both `name` and `name_th` (like rooms)

### D. Create Class Page
New page at `/class/create` with:
- Type selector (Class/PT)
- Fields: name (EN)*, name_th, description*, category*, duration*, level* (for class type)
- Actions: Discard, Save as draft (status='drafts'), Publish (status='active')
- Zod validation, react-hook-form
- Activity log on create

### E. Class Details Page
New page at `/class/:id` with:
- Performance cards (scheduled this week, bookings this week, avg capacity, total bookings)
- Class information section with inline edit (same pattern as RoomDetails)
- Performance metrics hook using schedule + class_bookings aggregation

### F. Hooks Updates
- `useClasses`: Add type, category, level filter params; search `name_th`
- `useClassPerformance(classId)`: Query schedule + class_bookings for metrics
- `useUpdateClass`: Accept `oldData` for structured activity logging

### G. Routes
Add `/class/create` → CreateClass and `/class/:id` → ClassDetails in App.tsx.

### H. Realtime
Already covered — `useRealtimeSync` handles `classes` and `class_categories`.

## Files to Create/Modify

| File | Change |
|------|--------|
| **DB migration** | Add `name_th` text column to `classes` |
| `src/pages/CreateClass.tsx` | **Create** — form page with draft/publish |
| `src/pages/ClassDetails.tsx` | **Create** — details + performance + inline edit |
| `src/App.tsx` | Add routes for `/class/create` and `/class/:id` |
| `src/pages/Classes.tsx` | Add filters, row click, create button navigation |
| `src/hooks/useClasses.ts` | Add filters, fix query key, add performance hook, enhance logging |
| `src/lib/queryKeys.ts` | Add `classDetail`, `classPerformance` keys |
| `src/i18n/locales/en.ts` | Add class create/detail i18n keys |
| `src/i18n/locales/th.ts` | Same Thai keys |
| `docs/data-contract-classes.md` | **Create** — data contract |

