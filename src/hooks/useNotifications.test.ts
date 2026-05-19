import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const fromMock = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...args: any[]) => fromMock(...args) },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/activityLogger', () => ({ logActivity: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k }),
}));

import { useMarkAsRead, useMarkAllAsRead } from './useNotifications';
import { logActivity } from '@/lib/activityLogger';

const makeWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return { qc, invalidateSpy, Wrapper };
};

beforeEach(() => {
  fromMock.mockReset();
  (logActivity as any).mockReset?.();
});

describe('useMarkAsRead', () => {
  it('updates notification by id and invalidates the three notification caches', async () => {
    const eqSpy = vi.fn(async () => ({ error: null }));
    fromMock.mockReturnValueOnce({
      update: () => ({ eq: eqSpy }),
    });

    const { Wrapper, invalidateSpy } = makeWrapper();
    const { result } = renderHook(() => useMarkAsRead(), { wrapper: Wrapper });

    await result.current.mutateAsync('notif-1');

    expect(eqSpy).toHaveBeenCalledWith('id', 'notif-1');
    await waitFor(() => expect(logActivity).toHaveBeenCalled());
    expect((logActivity as any).mock.calls[0][0].event_type).toBe('notification_read');

    const invalidated = invalidateSpy.mock.calls.map((c) => (c[0] as any).queryKey[0]);
    expect(invalidated).toContain('notifications');
    expect(invalidated).toContain('notifications-unread-count');
    expect(invalidated).toContain('notifications-recent');
  });
});

describe('useMarkAllAsRead', () => {
  it('filters by user_id + is_read=false and invalidates caches', async () => {
    const eqUserSpy = vi.fn(function (this: any) {
      return this;
    });
    const builder: any = {
      update: () => builder,
      eq: vi.fn(function (this: any, col: string, val: any) {
        eqUserSpy.call(this, col, val);
        // After two eq() calls, resolve as a thenable
        builder._eqCount = (builder._eqCount || 0) + 1;
        if (builder._eqCount === 2) {
          return Promise.resolve({ error: null });
        }
        return this;
      }),
    };
    fromMock.mockReturnValueOnce(builder);

    const { Wrapper, invalidateSpy } = makeWrapper();
    const { result } = renderHook(() => useMarkAllAsRead(), { wrapper: Wrapper });

    await result.current.mutateAsync();

    const calls = eqUserSpy.mock.calls.map((c) => [c[0], c[1]]);
    expect(calls).toContainEqual(['user_id', 'user-1']);
    expect(calls).toContainEqual(['is_read', false]);

    await waitFor(() => expect(logActivity).toHaveBeenCalled());
    expect((logActivity as any).mock.calls[0][0].event_type).toBe('notifications_all_read');

    const invalidated = invalidateSpy.mock.calls.map((c) => (c[0] as any).queryKey[0]);
    expect(invalidated).toContain('notifications-unread-count');
  });
});
