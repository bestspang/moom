import { describe, it, expect } from 'vitest';
import { TABLE_INVALIDATION_MAP } from './useRealtimeSync';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Realtime invalidation contract test.
 *
 * Ensures that postgres_changes on key tables triggers invalidation of
 * the queries that surfaces actually read. Catches AI regressions where
 * a prefix gets renamed (e.g. 'check-ins' -> 'checkins') and the Lobby
 * silently stops updating in real time.
 */
describe('TABLE_INVALIDATION_MAP — realtime contract', () => {
  it('member_attendance invalidates Lobby check-ins query prefix', () => {
    const prefixes = TABLE_INVALIDATION_MAP['member_attendance'];
    expect(prefixes).toContain('check-ins');
    // The actual queryKey used by useCheckIns must start with 'check-ins'
    const sampleKey = queryKeys.checkIns('2026-01-01');
    expect(sampleKey[0]).toBe('check-ins');
  });

  it('checkin_qr_tokens invalidates check-ins (QR -> Lobby live update)', () => {
    expect(TABLE_INVALIDATION_MAP['checkin_qr_tokens']).toContain('check-ins');
  });

  it('members invalidates members + member detail prefixes', () => {
    const prefixes = TABLE_INVALIDATION_MAP['members'];
    expect(prefixes).toContain('members');
    expect(prefixes).toContain('member');
  });

  it('transfer_slips invalidates transfer-slips and detail (payment review live)', () => {
    const prefixes = TABLE_INVALIDATION_MAP['transfer_slips'];
    expect(prefixes).toContain('transfer-slips');
    expect(prefixes).toContain('transfer-slip-detail');
  });

  it('member_packages invalidates package + member-package read paths', () => {
    const prefixes = TABLE_INVALIDATION_MAP['member_packages'];
    expect(prefixes).toContain('member-packages');
    expect(prefixes).toContain('package-metrics');
  });

  it('member_contracts invalidates contracts + enrichment', () => {
    expect(TABLE_INVALIDATION_MAP['member_contracts']).toContain('member-contracts');
  });

  it('class_bookings invalidates the booking + schedule live views', () => {
    const prefixes = TABLE_INVALIDATION_MAP['class_bookings'];
    expect(prefixes).toContain('class-bookings');
    expect(prefixes).toContain('member-bookings');
    expect(prefixes).toContain('booking-count');
  });

  it('packages invalidates the packages list + stats', () => {
    const prefixes = TABLE_INVALIDATION_MAP['packages'];
    expect(prefixes).toContain('packages');
    expect(prefixes).toContain('package-stats');
  });

  it('notifications invalidates list + unread counter (drives the bell)', () => {
    const prefixes = TABLE_INVALIDATION_MAP['notifications'];
    expect(prefixes).toContain('notifications');
    expect(prefixes).toContain('notifications-unread-count');
  });

  it('transactions invalidates finance views', () => {
    const prefixes = TABLE_INVALIDATION_MAP['transactions'];
    expect(prefixes).toContain('transactions');
    expect(prefixes).toContain('finance-transactions');
  });

  it('member_billing invalidates billing summary', () => {
    expect(TABLE_INVALIDATION_MAP['member_billing']).toContain('member-billing');
  });

  it('every entry is non-empty (an empty array = silent no-op)', () => {
    for (const [table, prefixes] of Object.entries(TABLE_INVALIDATION_MAP)) {
      expect(prefixes.length, `${table} has no invalidation targets`).toBeGreaterThan(0);
    }
  });

  it('every prefix appears as a string literal in queryKeys.ts (typo guard)', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const src = fs.readFileSync(
      path.resolve(process.cwd(), 'src/lib/queryKeys.ts'),
      'utf8',
    );
    // Collect every prefix used by the realtime map
    const allPrefixes = new Set<string>();
    for (const list of Object.values(TABLE_INVALIDATION_MAP)) {
      for (const p of list) allPrefixes.add(p);
    }
    // A few prefixes are produced by ad-hoc queries outside queryKeys.ts.
    // Skip those to keep the guard tight without false positives.
    const ignored = new Set<string>([
      'member-attendance', 'member-summary-stats', 'members-enrichment',
      'gym-checkins', 'high-risk-members', 'upcoming-birthdays',
      'class-performance', 'package-usage', 'package-usage-summary',
      'hot-leads', 'ai-suggestions', 'role-permissions', 'my-permissions',
      'user-roles', 'transfer-slip-detail', 'transfer-slip-stats',
      'gamification-profiles', 'xp-leaderboard', 'streak-leaderboard',
      'badge-earnings', 'my-badges', 'quest-instances', 'my-quests',
      'reward-redemptions', 'my-rewards', 'my-squad', 'available-squads',
      'squad-rankings', 'member-status-tier', 'status-tier-distribution',
      'sp-history', 'announcement-stats', 'activity-logs',
      'staff-stats', 'staff-positions', 'class-categories',
      'room-stats', 'location-stats', 'promotion-stats',
      'promotion-packages', 'promotion-redemptions', 'class-stats',
      'class-waitlist', 'finance-stats', 'schedule-stats',
      'training-templates', 'checkin-qr-tokens', 'momentum-profile',
      'member-injuries', 'member-suspensions', 'member-notes',
      'announcements',
    ]);
    const missing: string[] = [];
    for (const p of allPrefixes) {
      if (ignored.has(p)) continue;
      // Look for the literal as a quoted string in queryKeys.ts
      const re = new RegExp(`['"\`]${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`);
      if (!re.test(src)) missing.push(p);
    }
    expect(
      missing,
      `Realtime invalidation references prefixes that are not in queryKeys.ts (possible typo): ${missing.join(', ')}`,
    ).toEqual([]);
  });
});

