

# Room Details Page — Implementation Plan

## Current State

- `rooms` table has all needed columns: `name`, `name_th`, `location_id`, `max_capacity`, `layout_type`, `categories` (text[]), `status`
- `useRoom(id)` hook exists, fetches room with joined location
- `useUpdateRoom` mutation exists with activity logging
- `CreateRoomDialog` has the full form UI pattern (sections: Information, Access, Room Layout)
- `DataTable` supports `onRowClick`
- Schedule validation RPC already enforces room-location match + category compatibility + capacity default
- Realtime sync already covers `rooms` table

## What's Missing

1. **No RoomDetails page** — no route, no component
2. **Rooms list doesn't navigate on row click** — no `onRowClick` handler
3. **No route for `/room/:id`** in App.tsx
4. **`useUpdateRoom` doesn't capture `old_value`** in activity log
5. **No i18n keys** for room details page

## Implementation Plan

### 1. Add route in App.tsx
Add `<Route path="room/:id" element={<RoomDetails />} />` under protected routes, import the new page.

### 2. Add row click navigation in Rooms.tsx
Add `useNavigate` and pass `onRowClick={(row) => navigate(\`/room/${row.id}\`)}` to DataTable.

### 3. Create `src/pages/RoomDetails.tsx`
A detail/edit page that:
- Uses `useParams` to get room ID, `useRoom(id)` to load data
- Uses `useLocations()` and `useClassCategories()` for select options
- Displays sections matching CreateRoomDialog layout: Information, Access, Room Layout
- Each section has a pencil/edit toggle for inline editing
- On save: calls `useUpdateRoom` with changed fields, shows toast
- Back button navigates to `/room`

**UI structure:**
- PageHeader with breadcrumbs and back arrow
- Card sections for Information (name EN/TH, location, max capacity), Access (all/specific categories), Room Layout (open/fixed)
- Each section toggles between read-only display and edit form
- Save/Cancel buttons per section

### 4. Enhance `useUpdateRoom` with old_value logging
Fetch current room data before update to capture `old_value` in activity log alongside `new_value`.

### 5. Add query key for single room
Add `room: (id: string) => ['rooms', 'detail', id]` to queryKeys.ts and use it in `useRoom` + invalidation.

### 6. Add i18n keys
Add `rooms.detail.*` keys for both EN and TH: `title`, `editInformation`, `editAccess`, `editLayout`, `backToList`, etc.

## Files to Create/Modify

| File | Change |
|------|--------|
| `src/pages/RoomDetails.tsx` | **Create** — full detail/edit page |
| `src/App.tsx` | Add route for `room/:id` |
| `src/pages/Rooms.tsx` | Add `onRowClick` navigation |
| `src/hooks/useRooms.ts` | Fix `useRoom` query key; enhance `useUpdateRoom` with `old_value` |
| `src/lib/queryKeys.ts` | Add `room(id)` key |
| `src/i18n/locales/en.ts` | Add room detail i18n keys |
| `src/i18n/locales/th.ts` | Add room detail i18n keys |

No DB migration needed. No breaking changes.

