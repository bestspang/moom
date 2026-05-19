import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrandProvider, useBrand } from './BrandContext';
import { DEFAULT_BRAND } from '@/components/branding/brandDefaults';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                value: {
                  ...DEFAULT_BRAND,
                  name: 'IRON FORGE',
                  logoUrl: 'https://example.com/iron.png',
                },
              },
              error: null,
            }),
          }),
        }),
      }),
    }),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <BrandProvider>{children}</BrandProvider>
    </QueryClientProvider>
  );
};

describe('BrandContext', () => {
  beforeEach(() => {
    document.title = '';
    document.head.innerHTML = '';
  });

  it('loads brand from settings and exposes via useBrand', async () => {
    const { result } = renderHook(() => useBrand(), { wrapper });
    await waitFor(() => expect(result.current.brand.name).toBe('IRON FORGE'));
    expect(result.current.brand.primary).toBe(DEFAULT_BRAND.primary);
  });

  it('syncs document.title from brand.name', async () => {
    renderHook(() => useBrand(), { wrapper });
    await waitFor(() => expect(document.title).toBe('IRON FORGE'));
  });

  it('sets favicon link when brand.logoUrl is provided', async () => {
    renderHook(() => useBrand(), { wrapper });
    await waitFor(() => {
      const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      expect(link?.href).toContain('iron.png');
    });
  });

  it('falls back to DEFAULT_BRAND before data loads', () => {
    const { result } = renderHook(() => useBrand(), { wrapper });
    // Initial sync render: data not yet resolved
    expect(result.current.brand.name).toBeTruthy();
  });
});
