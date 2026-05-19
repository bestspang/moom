import { describe, it, expect } from 'vitest';
import { getDefaultPermissions } from '@/hooks/usePermissions';

/**
 * Member Details × RBAC policy contract.
 *
 * Locks the permission matrix documented in `docs/audit-members.md` against
 * `getDefaultPermissions`. MemberDetails itself does not call `can()` at the
 * page level — individual action buttons / sibling dialogs do — so the right
 * place to detect a silent policy shift is here, at the source of truth.
 *
 * If a future AI edit accidentally grants Trainer access to packages.write
 * or Front Desk access to members.write, this test fails immediately.
 */

type Role = 'owner' | 'manager' | 'trainer' | 'frontDesk';
const ROLE_TO_LEVEL: Record<Role, Parameters<typeof getDefaultPermissions>[0]> = {
  owner: 'level_4_master',
  manager: 'level_3_manager',
  trainer: 'level_2_operator',
  frontDesk: 'level_1_minimum',
};

const lookup = (role: Role) => {
  const rows = getDefaultPermissions(ROLE_TO_LEVEL[role]);
  return Object.fromEntries(rows.map((r) => [r.resource, r]));
};

// resource -> { action -> expected map per role }
// Mirrors docs/audit-members.md "RBAC matrix" exactly.
const EXPECTED: Array<{
  label: string;
  resource: string;
  action: 'can_read' | 'can_write' | 'can_delete';
  expect: Record<Role, boolean>;
}> = [
  {
    label: 'List + detail visible',
    resource: 'members',
    action: 'can_read',
    expect: { owner: true, manager: true, trainer: true, frontDesk: true },
  },
  {
    label: 'Edit Profile / Add Note (members.write)',
    resource: 'members',
    action: 'can_write',
    expect: { owner: true, manager: true, trainer: true, frontDesk: false },
  },
  {
    label: 'Archive (members.delete)',
    resource: 'members',
    action: 'can_delete',
    expect: { owner: true, manager: true, trainer: false, frontDesk: false },
  },
  {
    label: 'Add Package (packages.write)',
    resource: 'packages',
    action: 'can_write',
    expect: { owner: true, manager: true, trainer: false, frontDesk: false },
  },
  {
    label: 'Finance tab (finance.read)',
    resource: 'finance',
    action: 'can_read',
    expect: { owner: true, manager: true, trainer: false, frontDesk: false },
  },
  {
    label: 'Manual Check-in from drawer (lobby.write)',
    resource: 'lobby',
    action: 'can_write',
    expect: { owner: true, manager: true, trainer: true, frontDesk: false },
  },
];

describe('Member Details — RBAC policy contract (docs/audit-members.md)', () => {
  for (const row of EXPECTED) {
    for (const role of ['owner', 'manager', 'trainer', 'frontDesk'] as const) {
      it(`${role} → ${row.label} = ${row.expect[role]}`, () => {
        const perms = lookup(role);
        expect(perms[row.resource]?.[row.action]).toBe(row.expect[role]);
      });
    }
  }

  it('Overview + Records tabs are gated only by members.read (so visible to every role)', () => {
    for (const role of ['owner', 'manager', 'trainer', 'frontDesk'] as const) {
      expect(lookup(role).members.can_read).toBe(true);
    }
  });
});
