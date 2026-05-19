import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock supabase BEFORE importing the hook under test
const fromMock = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: any[]) => fromMock(...args),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/activityLogger', () => ({
  logActivity: vi.fn(),
}));

import { useValidateQRToken } from './useCheckinQR';
import { toast } from 'sonner';
import { logActivity } from '@/lib/activityLogger';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: qc }, children);
};

beforeEach(() => {
  fromMock.mockReset();
  (toast.success as any).mockReset?.();
  (toast.error as any).mockReset?.();
  (logActivity as any).mockReset?.();
});

/**
 * QR check-in end-to-end contract test (no browser).
 *
 * Locks in the redeem flow against AI regressions:
 *  - Expired tokens must reject
 *  - Used tokens must reject
 *  - Successful redemption must (a) mark token used, (b) insert attendance
 *    with checkin_method='qr', (c) fire activity_log, (d) toast success.
 */
describe('useValidateQRToken — QR check-in E2E contract', () => {
  it('rejects expired tokens', async () => {
    fromMock.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: {
              id: 't1',
              token: 'abc',
              member_id: 'M1',
              location_id: 'L1',
              expires_at: new Date(Date.now() - 1000).toISOString(),
              used_at: null,
            },
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useValidateQRToken(), { wrapper });
    await expect(
      result.current.mutateAsync({ token: 'abc', staffId: 'S1' }),
    ).rejects.toThrow(/expired/i);
  });

  it('rejects already-used tokens', async () => {
    fromMock.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: {
              id: 't2',
              token: 'def',
              member_id: 'M1',
              location_id: 'L1',
              expires_at: new Date(Date.now() + 60_000).toISOString(),
              used_at: new Date().toISOString(),
            },
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useValidateQRToken(), { wrapper });
    await expect(
      result.current.mutateAsync({ token: 'def', staffId: 'S1' }),
    ).rejects.toThrow(/used/i);
  });

  it('successful redemption marks token used and inserts attendance with checkin_method=qr', async () => {
    const updateEq = vi.fn(async () => ({ data: null, error: null }));
    const insertSpy = vi.fn(async () => ({ data: null, error: null }));

    // call 1: select token
    fromMock.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: {
              id: 't3',
              token: 'ok',
              member_id: 'M1',
              location_id: 'L1',
              expires_at: new Date(Date.now() + 60_000).toISOString(),
              used_at: null,
            },
            error: null,
          }),
        }),
      }),
    });
    // call 2: update token (mark used)
    fromMock.mockReturnValueOnce({
      update: () => ({ eq: updateEq }),
    });
    // call 3: insert attendance
    fromMock.mockReturnValueOnce({
      insert: insertSpy,
    });

    const { result } = renderHook(() => useValidateQRToken(), { wrapper });
    await result.current.mutateAsync({ token: 'ok', staffId: 'S1' });

    // Token was marked used
    expect(updateEq).toHaveBeenCalledWith('id', 't3');

    // Attendance was inserted with the right shape
    expect(insertSpy).toHaveBeenCalledTimes(1);
    const payload = insertSpy.mock.calls[0][0];
    expect(payload.member_id).toBe('M1');
    expect(payload.location_id).toBe('L1');
    expect(payload.checkin_method).toBe('qr');
    expect(payload.check_in_type).toBe('gym');

    await waitFor(() => {
      expect(logActivity).toHaveBeenCalled();
      expect((toast.success as any)).toHaveBeenCalled();
    });
    expect((logActivity as any).mock.calls[0][0].event_type).toBe('checkin_qr_validated');
  });
});
