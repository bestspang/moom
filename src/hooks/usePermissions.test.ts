import { describe, it, expect } from 'vitest';
import { getDefaultPermissions, ALL_RESOURCES } from './usePermissions';

/**
 * RBAC matrix smoke test.
 *
 * Locks in the default permission map for each access level so future
 * AI edits to `getDefaultPermissions` cannot silently grant/revoke a
 * sensitive action (e.g. trainer suddenly able to write finance).
 */

const lookup = (level: Parameters<typeof getDefaultPermissions>[0]) => {
  const rows = getDefaultPermissions(level);
  return Object.fromEntries(rows.map((r) => [r.resource, r]));
};

describe('getDefaultPermissions — RBAC matrix', () => {
  it('level_4_master can do everything on every resource', () => {
    const perms = lookup('level_4_master');
    for (const r of ALL_RESOURCES) {
      expect(perms[r].can_read, `${r}.read`).toBe(true);
      expect(perms[r].can_write, `${r}.write`).toBe(true);
      expect(perms[r].can_delete, `${r}.delete`).toBe(true);
    }
  });

  it('level_3_manager has no roles access (security boundary)', () => {
    const perms = lookup('level_3_manager');
    expect(perms.roles.can_read).toBe(false);
    expect(perms.roles.can_write).toBe(false);
    expect(perms.finance.can_read).toBe(true);
    expect(perms.staff.can_write).toBe(true);
  });

  it('level_2_operator (trainer) cannot write finance, packages, staff, settings', () => {
    const perms = lookup('level_2_operator');
    for (const r of ['finance', 'packages', 'staff', 'settings', 'roles'] as const) {
      expect(perms[r].can_write, `${r}.write`).toBe(false);
      expect(perms[r].can_delete, `${r}.delete`).toBe(false);
    }
    // But can read+write the operational areas they need
    expect(perms.lobby.can_read).toBe(true);
    expect(perms.members.can_write).toBe(true);
    expect(perms.schedule.can_write).toBe(true);
  });

  it('level_1_minimum (front desk) can only see lobby/members/notifications/dashboard', () => {
    const perms = lookup('level_1_minimum');
    const allowed = new Set(['dashboard', 'lobby', 'members', 'notifications']);
    for (const r of ALL_RESOURCES) {
      if (allowed.has(r)) {
        expect(perms[r].can_read, `${r}.read`).toBe(true);
      } else {
        expect(perms[r].can_read, `${r}.read should be false`).toBe(false);
      }
      // Front desk is read-only across the board
      expect(perms[r].can_write, `${r}.write`).toBe(false);
      expect(perms[r].can_delete, `${r}.delete`).toBe(false);
    }
  });

  it('ALL_RESOURCES contains the critical security-sensitive resources', () => {
    // If someone removes one of these from ALL_RESOURCES it will be
    // silently dropped from the RBAC matrix — guard against that.
    for (const r of ['roles', 'staff', 'finance', 'settings', 'lobby', 'members']) {
      expect(ALL_RESOURCES).toContain(r);
    }
  });
});
