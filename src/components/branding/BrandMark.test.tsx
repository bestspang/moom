import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrandProvider } from '@/contexts/BrandContext';
import { BrandMark } from './BrandMark';
import { DEFAULT_BRAND } from './brandDefaults';

// Mock supabase to return null so BrandProvider falls back to DEFAULT_BRAND.
import { vi } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
        }),
      }),
    }),
  },
}));

const wrap = (ui: React.ReactNode) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <BrandProvider>{ui}</BrandProvider>
    </QueryClientProvider>
  );
};

describe('BrandMark', () => {
  it('renders default brand name when no saved kit', () => {
    wrap(<BrandMark />);
    expect(screen.getByText(DEFAULT_BRAND.name)).toBeInTheDocument();
  });

  it('hides name when showName=false', () => {
    wrap(<BrandMark showName={false} />);
    expect(screen.queryByText(DEFAULT_BRAND.name)).not.toBeInTheDocument();
  });

  it('appends nameSuffix when provided', () => {
    wrap(<BrandMark nameSuffix="Admin" />);
    expect(screen.getByText(`${DEFAULT_BRAND.name} Admin`)).toBeInTheDocument();
  });
});
