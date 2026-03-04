

# Staff Management — Full Implementation Plan

## Current State
- `Staff.tsx` lists staff with status tabs (active/terminated) and search — works correctly
- `useStaff.ts` has CRUD hooks (create/update/delete/stats) — functional
- Staff table has: id, user_id, role_id, status (active/pending/terminated), first_name, last_name, nickname, phone, email, avatar_url, location_id
- Staff currently has a single `role_id` FK → `roles` — supports only ONE role per staff
- No staff detail page, no create dialog, no `staff_positions` table
- `line_users` table already has `staff_id` column — LINE identity linking is ready
- `LineIdentityCard` component already supports `ownerType='staff'`
- Route is `/admin` for Staff list — no `/admin/:id` detail route

## Plan

### 1. Database Migration — `staff_positions` table

```sql
CREATE TABLE public.staff_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  scope_all_locations boolean DEFAULT true,
  location_ids uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.staff_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read positions" ON public.staff_positions
  FOR SELECT USING (has_min_access_level(auth.uid(), 'level_1_minimum'::access_level));

CREATE POLICY "Managers can manage positions" ON public.staff_positions
  FOR ALL USING (has_min_access_level(auth.uid(), 'level_3_manager'::access_level));
```

Also add `address` column to `staff` table (currently missing):
```sql
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS address text;
```

### 2. Edge Function Stub — `invite-staff`

Create `supabase/functions/invite-staff/index.ts`:
- Accepts `{ staff_id, email }` via POST
- Sets `staff.status = 'pending'` using service role client
- Inserts `activity_log` entry with `event_type = 'staff_invited'`
- Returns `{ ok: true }`
- Stub — does NOT send email/LINE yet (ready for future integration)

### 3. Create `CreateStaffDialog` — `src/components/staff/CreateStaffDialog.tsx`

Dialog/Drawer (responsive) with sections:
- **Profile**: first_name (required), last_name (required), nickname, date of birth (optional)
- **Contact**: phone, email
- **Address**: address text
- **Positions**: dynamic rows — each row has role select + "All locations" toggle + location multi-select when specific
- "Add position" button for multiple roles
- Draft autosave to `localStorage` key `staff-create-draft`
- Bottom bar: Discard + Create buttons
- On create: insert staff → insert staff_positions → insert activity_log → optionally invoke `invite-staff` edge function

### 4. Create `StaffDetails` page — `src/pages/StaffDetails.tsx`

Tabs: Profile | Positions & Availability
- **Profile tab**: Info card (avatar, name, contact, address) with inline edit (pencil icons), status badge, LINE identity card (`LineIdentityCard ownerType="staff"`)
- **Positions tab**: List of positions with role name, location scope, edit/remove actions
- **Resend Invitation** button visible when status = 'pending' (calls `invite-staff` edge function)
- Back navigation to staff list

### 5. Update Hooks — `src/hooks/useStaff.ts`

- Add `useStaffPositions(staffId)` — fetches positions with joined role and location data
- Add `useCreateStaffWithPositions()` — mutation that inserts staff + positions in sequence
- Add `useInviteStaff()` — calls `invite-staff` edge function
- Update `useStaffMember` select to include `staff_positions(*, role:roles(*))`

### 6. Route & Navigation Updates — `src/App.tsx` + `Staff.tsx`

- Add route: `<Route path="admin/:id" element={<StaffDetails />} />`
- `Staff.tsx`: wire Create button → open `CreateStaffDialog`
- `Staff.tsx`: add `onRowClick` → navigate to `/admin/${row.id}`
- Update columns to show positions from `staff_positions` instead of single `role_id`

### 7. Realtime — `src/hooks/useRealtimeSync.ts`

Add `staff` and `staff_positions` to `TableName` union and invalidation map:
- `staff` → `['staff', 'staff-stats']`
- `staff_positions` → `['staff', 'staff-positions']`

### 8. i18n Keys

Add to `en.ts` and `th.ts` under `staff`:
- `createSuccess`, `positions`, `addPosition`, `allLocations`, `specificLocations`, `resendInvitation`, `invitationSent`, `profile`, `positionsAndAvailability`, `address`, `invitePending`, `lineComingSoon`, `discardDraft`, `staffDetails`

## Files Summary

| Action | File |
|--------|------|
| Migration | Add `staff_positions` table + `address` column on `staff` |
| Create | `supabase/functions/invite-staff/index.ts` |
| Create | `src/components/staff/CreateStaffDialog.tsx` |
| Create | `src/pages/StaffDetails.tsx` |
| Modify | `src/hooks/useStaff.ts` — add position hooks + invite |
| Modify | `src/pages/Staff.tsx` — wire create dialog + row click |
| Modify | `src/App.tsx` — add detail route |
| Modify | `src/hooks/useRealtimeSync.ts` — add staff tables |
| Modify | `src/lib/queryKeys.ts` — add staff keys |
| Modify | `src/i18n/locales/en.ts` — extend staff keys |
| Modify | `src/i18n/locales/th.ts` — extend staff keys |

No breaking changes. Existing staff list continues to work. `staff.role_id` remains for backward compat but `staff_positions` becomes the source of truth for multi-role assignments.

