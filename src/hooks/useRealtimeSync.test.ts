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

  it('every entry is non-empty (an empty array = silent no-op)', () => {
    for (const [table, prefixes] of Object.entries(TABLE_INVALIDATION_MAP)) {
      expect(prefixes.length, `${table} has no invalidation targets`).toBeGreaterThan(0);
    }
  });
});
