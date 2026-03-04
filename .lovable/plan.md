

# Roles Management with Permission Matrix

## Current State
- `roles` table exists with `name`, `access_level`, `permissions` (jsonb, unused), `description`
- `Roles.tsx` list page shows roles with counts — functional but no create/edit wiring
- Access control is purely `access_level`-based via `has_min_access_level()` in Sidebar and ProtectedRoute
- No `role_permissions` table, no permission matrix, no per-resource enforcement
- `useRoles.ts` has CRUD hooks but Create button not wired to anything

## Plan

### 1. Database Migration

```sql
-- role_permissions table
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  resource text NOT NULL,
  can_read boolean DEFAULT false,
  can_write boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role_id, resource)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All can read role_permissions" ON public.role_permissions
  FOR SELECT USING (true);

CREATE POLICY "Masters can manage role_permissions" ON public.role_permissions
  FOR ALL USING (has_min_access_level(auth.uid(), 'level_4_master'::access_level));

-- AI-ready field on roles
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS ai_policy jsonb DEFAULT '{}'::jsonb;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.role_permissions;
```

Resource keys (predefined list): `dashboard`, `lobby`, `schedule`, `rooms`, `classes`, `class_categories`, `members`, `leads`, `packages`, `promotions`, `staff`, `roles`, `locations`, `activity_log`, `announcements`, `workout_list`, `transfer_slips`, `finance`, `reports`, `settings`, `notifications`.

### 2. Create `usePermissions` Hook — `src/hooks/usePermissions.ts`

- Fetches `role_permissions` for the current user's staff `role_id` (from `user_roles` → `staff` → `staff_positions` or direct `role_id`)
- Returns `{ can(resource, action): boolean, permissions, loading }`
- Caches in React Query with key `['my-permissions']`
- Falls back to access_level-based defaults when no role_permissions rows exist (backward compat)

### 3. Update `useRoles.ts`

- Add `useRolePermissions(roleId)` — fetches permissions for a specific role
- Add `useSaveRoleWithPermissions()` — mutation that upserts role + deletes old permissions + inserts new permissions
- Add `useDefaultPermissions(accessLevel)` — returns default permission matrix for a given access level

### 4. Create `RoleEditorPage` — `src/pages/RoleEditor.tsx`

- Routes: `/roles/create` and `/roles/:id`
- Sections:
  - Role name input (required)
  - Access level selector (4 cards: Master/Manager/Operator/Minimum)
  - Permission matrix table: rows = resources, columns = All/Read/Write/Delete checkboxes
  - "All" column toggles all 3 permissions for that resource
  - "Restore default settings" button resets matrix to access-level defaults
- Footer: Discard + Save buttons
- On save: upserts role → deletes old role_permissions → inserts new ones → navigates back to `/roles`

### 5. Update `Roles.tsx`

- Wire Create button → navigate to `/roles/create`
- Add row click → navigate to `/roles/:id`
- Show accounts count from staff_positions (already done via useRoles)

### 6. Update Sidebar — Permission-based Nav Filtering

- Import `usePermissions` hook
- Each nav item gets a `resource` key mapping
- `hasAccess()` checks both `minLevel` (existing) AND `permissions.can(resource, 'read')`
- Backward compatible: if no permissions loaded, fall back to access_level only

### 7. Update Routes — `App.tsx`

- Add `/roles/create` and `/roles/:id` routes pointing to `RoleEditorPage`

### 8. Update Realtime — `useRealtimeSync.ts`

- Add `role_permissions` → invalidates `['roles', 'my-permissions']`

### 9. i18n Keys

Add under `roles`:
- `editRole`, `permissionMatrix`, `resource`, `read`, `write`, `deleteAction`, `allPermissions`, `restoreDefaults`, `saveRole`, `createSuccess`, `updateSuccess`, `accessLevelDescription.*`, `resources.*` (all 21 resource labels)

## Files Summary

| Action | File |
|--------|------|
| Migration | `role_permissions` table + `ai_policy` column + RLS + realtime |
| Create | `src/hooks/usePermissions.ts` |
| Create | `src/pages/RoleEditor.tsx` |
| Modify | `src/hooks/useRoles.ts` — add permission hooks |
| Modify | `src/pages/Roles.tsx` — wire navigation |
| Modify | `src/components/layout/Sidebar.tsx` — permission filtering |
| Modify | `src/App.tsx` — add routes |
| Modify | `src/hooks/useRealtimeSync.ts` — add table |
| Modify | `src/lib/queryKeys.ts` — add keys |
| Modify | `src/i18n/locales/en.ts` — extend roles keys |
| Modify | `src/i18n/locales/th.ts` — extend roles keys |

No breaking changes. Existing access_level enforcement remains as fallback. Permission-based filtering is additive — if no `role_permissions` rows exist for a role, behavior defaults to current access_level logic.

