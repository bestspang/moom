

# Simplify Classes Page to Match Class Categories Layout

## Problem
The current Classes page has complex filters (type, category, level dropdowns) and status tabs. The user wants it simplified to match the clean Class Categories layout style.

## Changes

**`src/pages/Classes.tsx`** — Rewrite to match ClassCategories pattern:
- Remove status tabs, type/category/level filter dropdowns
- Keep only: PageHeader + SearchBar + simple DataTable
- Keep columns simple: Class name, Type (Class/PT), Category, Level, Duration
- Keep "Create class" button and row click navigation
- Remove pagination (or keep if data is large) — keep pagination since they may have many classes
- Remove all the filter state variables (`activeTab`, `typeFilter`, `categoryFilter`, `levelFilter`)

The page will look like the ClassCategories screenshot: clean header, search bar, and a straightforward data table.

## Files
| File | Change |
|------|--------|
| `src/pages/Classes.tsx` | **Rewrite** — simplified layout matching ClassCategories style |

## Risk
- **Low**: Only simplifies the Classes list page UI. No hooks or data layer changes.
- Existing `useClasses` hook still works — just called without filters.

