# Members surface audit

Locks in the RBAC matrix and button→handler trace for the Members list
and Member Details pages. Use this together with `Members.smoke.test.ts`
to detect AI regressions on visible UI vs. permission gates.

## RBAC matrix

| Action / Resource | Owner (L4) | Manager (L3) | Trainer (L2) | Front Desk (L1) |
|---|---|---|---|---|
| `members.read` (list, detail) | ✅ | ✅ | ✅ | ✅ |
| `members.write` (create, edit) | ✅ | ✅ | ✅ | ❌ |
| `members.delete` / archive | ✅ | ✅ | ❌ | ❌ |
| `packages.write` (add member package) | ✅ | ✅ | ❌ | ❌ |
| `finance.read` (billing/transactions tab) | ✅ | ✅ | ❌ | ❌ |
| `notes.write` (add member note) | ✅ | ✅ | ✅ | ❌ |
| `lobby.write` (manual check-in from drawer) | ✅ | ✅ | ❌ | ❌ |

Source of truth: `src/hooks/usePermissions.ts` → `getDefaultPermissions()`.
Locked in by `src/hooks/usePermissions.test.ts`.

## Button → handler trace (Members list)

| Button | Component | Handler | Permission gate |
|---|---|---|---|
| **Add Member** | `Members.tsx` | opens `MemberCreateDialog` | `can('members','write')` |
| **Row click** | `MembersTable` | `navigate('/members/:id/detail')` | `can('members','read')` |
| **Search input** | `Members.tsx` | local state, filters TanStack query | — |
| **Status filter** | `Members.tsx` | local state | — |

## Button → handler trace (Member Details drawer / page)

| Button | Handler | Permission gate |
|---|---|---|
| **Edit Profile** | opens `MemberEditDialog` | `can('members','write')` |
| **Manage Suspension** | opens suspension dialog | `can('members','write')` |
| **Add Package** | opens purchase flow | `can('packages','write')` |
| **Add Note** | opens note dialog | `can('members','write')` |
| **Manual Check-in** | calls `useCreateCheckIn` | `can('lobby','write')` |
| **Archive** | confirms then mutates | `can('members','delete')` |

## i18n contract

The smoke test (`src/pages/Members.smoke.test.ts`) asserts every key
listed in its `requiredMembersKeys` array exists in both EN and TH.
When adding a new label to the Members surface, append the key to that
array so future renames are caught in CI.

## Things NOT to change without explicit approval

- `src/hooks/usePermissions.ts` — RBAC defaults
- Routing in `src/App.tsx` for `/members` and `/members/:id/detail`
- The `MemberDetails` tab structure (Overview, Records) — see
  `mem://ux/member-details-overhaul`
