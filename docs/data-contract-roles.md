# Data Contract: Roles & Permissions

## Table: `roles`

| UI Field | DB Column | Type | Required | Notes |
|----------|-----------|------|----------|-------|
| Name | `name` | text | ✅ | Unique |
| Access level | `access_level` | enum | ✅ | level_1_minimum / level_2_operator / level_3_manager / level_4_master |
| Description | `description` | text | | |
| AI policy | `ai_policy` | jsonb | | |

## Table: `role_permissions`

| UI Field | DB Column | Type | Required | Notes |
|----------|-----------|------|----------|-------|
| Role | `role_id` | uuid | ✅ | FK roles, cascade delete |
| Resource | `resource` | text | ✅ | e.g. dashboard, members, finance |
| Can read | `can_read` | boolean | | |
| Can write | `can_write` | boolean | | |
| Can delete | `can_delete` | boolean | | |

Constraint: unique(role_id, resource)

## Table: `user_roles`

| UI Field | DB Column | Type | Required | Notes |
|----------|-----------|------|----------|-------|
| User | `user_id` | uuid | ✅ | FK auth.users |
| App role | `role` | enum | ✅ | front_desk / trainer / admin / owner |
| Custom role | `role_id` | uuid | | FK roles (optional link) |

## Resources (Permission Matrix)

`dashboard`, `lobby`, `schedule`, `rooms`, `classes`, `class_categories`, `members`, `leads`, `packages`, `promotions`, `staff`, `roles`, `locations`, `activity_log`, `announcements`, `workout_list`, `transfer_slips`, `finance`, `reports`, `settings`, `notifications`

## Access Level Defaults

| Level | Description | Default scope |
|-------|-------------|---------------|
| level_1_minimum | Front desk | Read: dashboard, lobby, members, notifications |
| level_2_operator | Trainer/operator | Read+Write on schedule, members, leads, classes |
| level_3_manager | Manager | Full access except roles/settings |
| level_4_master | Owner | Full access to everything |

## Activity Log Events

| Event | Trigger |
|-------|---------|
| `role_created` | New role created |
| `role_updated` | Role name/level or permissions saved |

## Query Keys

| Key | Usage |
|-----|-------|
| `['roles', search]` | Roles list with account counts |
| `['roles', id]` | Single role detail |
| `['role-permissions', roleId]` | Permissions for a role |
| `['my-permissions', userId]` | Current user's merged permissions |

## Realtime Invalidation

Tables in `TABLE_INVALIDATION_MAP`: `roles`, `role_permissions`, `staff_positions`

## RLS

| Table | SELECT | INSERT/UPDATE/DELETE |
|-------|--------|---------------------|
| roles | All authenticated | level_4_master |
| role_permissions | All authenticated | level_4_master |
| user_roles | Own row only | level_4_master |

## Frontend Enforcement

`usePermissions()` hook → `can(resource, action)` checks DB permissions first, falls back to access_level defaults. Used in Sidebar filtering and page-level guards.
