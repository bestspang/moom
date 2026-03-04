

# Room Layouts Module — Gap Analysis & Implementation Plan

## Current State (Already Working)

- **DB table `rooms`**: Has all required columns — `name`, `name_th`, `location_id`, `layout_type` (enum: open/fixed), `max_capacity`, `categories` (text[]), `status`
- **CreateRoomDialog**: Saves all fields (name EN/TH, location, categories, layout type, max capacity) to DB
- **Room list page**: Shows name, location, categories, layout type, max capacity with status tabs
- **Activity logging**: `useCreateRoom`, `useUpdateRoom`, `useDeleteRoom` all log to `activity_log`
- **Realtime sync**: `useRealtimeSync` covers `rooms` table → invalidates `['rooms', 'room-stats']`
- **Schedule validation RPC**: `create_schedule_with_validation` already checks room-location match AND category compatibility using `rooms.categories`

## Real Gaps Found

### Gap 1: Search doesn't include Thai name
`useRooms` only searches `name` via `ilike`. Should also search `name_th`.

### Gap 2: No category filter on room list
The requirement asks for filtering rooms by category. Currently only status filter + text search exist.

### Gap 3: Categories column shows "All" based on empty array, not `all_categories` flag
The rooms table doesn't have an `all_categories` boolean column. The dialog sends `categories: []` for "all" — the list checks `cats.length === 0` to show "All". This works but is implicit. Adding a proper flag would be cleaner but the current approach works consistently. No change needed since behavior is correct.

### Gap 4: No data contract doc for rooms

### Gap 5: `useCreateRoom` doesn't log `old_value`/`new_value` properly
Currently logs only the activity string, not structured before/after values.

## Implementation Plan

### 1. Fix search to include `name_th` (useRooms.ts)
Change `query.ilike('name', ...)` to `query.or('name.ilike.%search%,name_th.ilike.%search%')`.

### 2. Add category filter to Rooms page
- Add a category filter dropdown/select to `Rooms.tsx` using `useClassCategories()`
- Pass selected category to `useRooms` hook
- In `useRooms`, when category filter is set:
  - Use `.contains('categories', [categoryName])` to find rooms with that specific category
  - OR include rooms where categories is empty (meaning "all categories")
  - This translates to: `query.or('categories.cs.{categoryName},categories.eq.{}')` 

### 3. Enhance activity logging in mutations
Add `new_value` with structured data to `useCreateRoom` and ensure `useUpdateRoom` captures before/after.

### 4. Create `docs/data-contract-rooms.md`

### 5. Add i18n keys for category filter

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useRooms.ts` | Add `name_th` to search; add category filter param |
| `src/pages/Rooms.tsx` | Add category filter dropdown |
| `src/lib/queryKeys.ts` | Update rooms key to include category filter |
| `docs/data-contract-rooms.md` | Create data contract |
| `src/i18n/locales/en.ts` | Add filter label keys |
| `src/i18n/locales/th.ts` | Same Thai keys |

No DB migration needed — all columns exist. No breaking changes. Schedule integration already works via the existing RPC.

