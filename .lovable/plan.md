

# Recheck: Class Module — Gap Analysis

## Summary

The implementation is **largely complete and correct**. Most acceptance criteria are met. Below are the specific gaps found, categorized by severity.

---

## What's Working Correctly

- **DB schema**: `classes` table has `name_th`, correct enums for `type`, `level`, `status`. FK to `class_categories`. Migration was applied.
- **Query keys**: `classDetail(id)`, `classPerformance(id)`, `classStats()` all properly defined and used — no collision.
- **Class list page**: Search (both `name` + `name_th`), tabs (All/Drafts/Archive), Type/Category/Level filters, row click navigation to `/class/:id`, create button → `/class/create`.
- **Create class page**: react-hook-form + zod, type selector, all fields, Save as Draft / Publish actions, activity logging.
- **Class details page**: Performance cards computed from `schedule` + `class_bookings`, inline edit with activity logging (old/new values).
- **Hooks**: `useClasses` with server-side filtering, `useClassPerformance`, `useCreateClass`, `useUpdateClass`, `useDeleteClass` — all with activity logging and cache invalidation.
- **Routes**: `/class`, `/class/create`, `/class/:id` all registered.
- **Realtime**: `classes` and `class_categories` in `useRealtimeSync`.
- **Data contract**: `docs/data-contract-classes.md` created and accurate.

---

## Gaps Found

### GAP 1: Spec asks for `description_th` but DB only has `description` (single column)
**Severity**: Medium  
**Spec says**: `description_en` + `description_th` as separate columns  
**Current**: DB has single `description` column (text, nullable). No `description_th`.  
**Impact**: Thai description cannot be stored separately.  
**Fix**: Add `description_th` column to `classes` table. Update Create and Details pages to include the field. Update data contract.

### GAP 2: Realtime invalidation for `class_bookings` missing `class-performance` key
**Severity**: Low  
**Current**: `class_bookings` changes invalidate `['class-bookings', 'member-bookings', 'booking-count', 'schedule']` but NOT `['class-performance']`.  
**Impact**: Performance cards on ClassDetails won't auto-update when bookings change via realtime.  
**Fix**: Add `'class-performance'` to `class_bookings` entry in `TABLE_INVALIDATION_MAP`.

### GAP 3: `classes` realtime invalidation missing `class-performance` key
**Severity**: Low  
**Current**: `classes` changes invalidate `['classes', 'class-stats']` but not `['class-performance']`.  
**Impact**: Minor — class details performance won't refresh on class changes (though class detail query itself does refresh).  
**Fix**: Add `'class-performance'` to `classes` entry in `TABLE_INVALIDATION_MAP`.

### GAP 4: ClassDetails uses `(classData as any).name_th` — type cast
**Severity**: Low  
**Current**: `name_th` exists in the types file (`string | null`), so `as any` is unnecessary.  
**Impact**: No runtime issue, just code quality.  
**Fix**: Remove `as any` casts for `name_th` in ClassDetails.

### GAP 5: No pagination on Class list
**Severity**: Medium  
**Spec says**: "show 1–10 of N like your UI" with pagination  
**Current**: `DataTable` receives all rows, no server-side pagination.  
**Impact**: Works fine for small datasets but won't scale. No pagination controls visible.  
**Fix**: Add `page`/`perPage` state, use `.range()` in Supabase query, pass `pagination` prop to `DataTable`.

### GAP 6: Filter "all" value bug
**Severity**: Medium  
**Current**: When user selects "All" in Type/Category/Level filters, the value `"all"` is passed. In `useClasses`, the hook passes this to Supabase as `typeFilter="all"` → `query.eq('type', 'all')` which matches nothing.  
**Fix**: In `Classes.tsx`, when filter value is `"all"`, pass `undefined` (or empty string). Currently `typeFilter || undefined` handles empty string but NOT `"all"`. Need to add: `typeFilter === 'all' ? undefined : typeFilter`.

### GAP 7: Create class form missing `description_th` field
**Severity**: Medium (related to GAP 1)  
**Current**: Only `description` (EN) field exists. No Thai description input.  
**Fix**: Depends on GAP 1. After adding `description_th` column, add the field to CreateClass and ClassDetails forms.

---

## Implementation Plan

### Step 1: DB Migration — Add `description_th` column
```sql
ALTER TABLE classes ADD COLUMN IF NOT EXISTS description_th text;
```

### Step 2: Fix filter "all" value bug in Classes.tsx
Change filter passing to convert `"all"` → `undefined` for all three filter selects.

### Step 3: Add `description_th` to CreateClass + ClassDetails
- CreateClass: Add textarea field for Thai description, include in submit payload.
- ClassDetails: Add to view mode and edit mode, include in save payload.

### Step 4: Fix realtime invalidation map
Add `'class-performance'` to both `class_bookings` and `classes` entries.

### Step 5: Add pagination to Class list
- Add `page`/`perPage` state to `Classes.tsx`
- Update `useClasses` to accept pagination params and use `.range()` + `count: 'exact'`
- Pass `pagination` prop to `DataTable`

### Step 6: Remove unnecessary `as any` casts
Clean up `(classData as any).name_th` → `classData.name_th` since types already include it.

### Step 7: Update data contract
Add `description_th` to docs.

### Files to Touch

| File | Change |
|------|--------|
| DB migration | Add `description_th` column |
| `src/pages/Classes.tsx` | Fix filter bug, add pagination |
| `src/pages/CreateClass.tsx` | Add `description_th` field |
| `src/pages/ClassDetails.tsx` | Add `description_th` view/edit, remove `as any` |
| `src/hooks/useClasses.ts` | Add pagination support to `useClasses` |
| `src/hooks/useRealtimeSync.ts` | Add `class-performance` to invalidation map |
| `docs/data-contract-classes.md` | Add `description_th` |

