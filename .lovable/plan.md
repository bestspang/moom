

# Locations CRUD with Categories, Opening Hours & Dependency Sync

## Current State
- `Locations.tsx` is a read-only list with search + status tabs — no create/edit buttons, no row click
- `useLocations.ts` has full CRUD hooks already (create/update/delete) — just not wired to UI
- `locations` table has: `id`, `location_id`, `name`, `contact_number`, `categories` (text[]), `status` (open/closed) — **no `opening_hours` column**
- i18n has minimal `locations.*` keys (title, searchPlaceholder, id, locationName)
- Dependent modules already use `useLocations()`: Schedule, CreatePackage, CreateRoom, CreateLead, CreateStaff, CheckIn, Settings

## Plan

### 1. Database Migration — Add `opening_hours` column

```sql
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS opening_hours jsonb DEFAULT '{}'::jsonb;
```

Shape: `{ "monday": { "open": "06:00", "close": "22:00" }, ... }` — nullable per day means closed that day.

### 2. Create `CreateLocationDialog` — `src/components/locations/CreateLocationDialog.tsx`

Dialog with fields:
- `location_id` (text, required, e.g. "BR-0001")
- `name` (text, required)
- `contact_number` (text, optional)
- `status` (select: open/closed, default open)
- `categories` (multi-select checkboxes from `useClassCategories()`)
- `opening_hours` (7 weekday rows: toggle enabled + open/close time inputs)

Uses `useCreateLocation()` mutation. Zod validation. Draft autosave to localStorage.

### 3. Create `EditLocationDialog` — `src/components/locations/EditLocationDialog.tsx`

Same form as Create but pre-populated from existing location data. Uses `useUpdateLocation()`. Includes delete button with confirmation.

### 4. Update `Locations.tsx`

- Add "Create" button in PageHeader → opens CreateLocationDialog
- Add `onRowClick` → opens EditLocationDialog with selected location
- Add `opening_hours` column showing summary (e.g. "Mon-Fri 06:00-22:00")
- Add status column with StatusBadge

### 5. i18n Keys

Add to both `en.ts` and `th.ts` under `locations`:
- `createLocation`, `editLocation`, `contactNumber`, `categories`, `openingHours`, `status`, `open`, `closed`, `createSuccess`, `updateSuccess`, `deleteSuccess`, `deleteConfirm`, `monday`-`sunday`, `openTime`, `closeTime`, `allDay`, `closedDay`

### 6. Dependency Consistency Check

All dependent modules already consume `useLocations()` which returns live data from DB — **no code changes needed** in Schedule, Packages, Staff, etc. They already use the locations list dynamically. The only change is that locations data now includes `opening_hours` in the response, which existing consumers safely ignore (they don't reference that field).

No schema contract changes for existing consumers.

## Files Summary

| Action | File |
|--------|------|
| Migration | Add `opening_hours` jsonb column to `locations` |
| Create | `src/components/locations/CreateLocationDialog.tsx` |
| Create | `src/components/locations/EditLocationDialog.tsx` |
| Modify | `src/pages/Locations.tsx` — wire create/edit, add columns |
| Modify | `src/i18n/locales/en.ts` — extend locations keys |
| Modify | `src/i18n/locales/th.ts` — extend locations keys |

No breaking changes. Existing consumers of `useLocations()` are unaffected — additive column only.

