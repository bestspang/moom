import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Build a single chainable supabase mock that returns { count, error }
let mockedCount: number = 0;
let mockedError: any = null;

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => {
      const builder: any = {};
      builder.select = () => builder;
      builder.eq = () => builder;
      builder.then = (resolve: any) =>
        Promise.resolve({ count: mockedCount, error: mockedError }).then(resolve);
      return builder;
    },
  },
}));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

import { NotificationBell } from './NotificationBell';

const renderBell = (onClick?: () => void) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    React.createElement(
      QueryClientProvider,
      { client: qc },
      React.createElement(NotificationBell, { onClick }),
    ),
  );
};

beforeEach(() => {
  mockedCount = 0;
  mockedError = null;
});

describe('NotificationBell', () => {
  it('renders no badge when unread count = 0', async () => {
    mockedCount = 0;
    renderBell();
    const button = await screen.findByRole('button');
    // The badge span has class 'absolute' and the digit text — assert no digit text
    await waitFor(() => {
      expect(button.querySelector('span')).toBeNull();
    });
  });

  it('renders the unread count when between 1 and 99', async () => {
    mockedCount = 3;
    renderBell();
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('renders "99+" when count exceeds 99', async () => {
    mockedCount = 150;
    renderBell();
    await waitFor(() => {
      expect(screen.getByText('99+')).toBeInTheDocument();
    });
  });

  it('fires onClick when the bell is clicked', async () => {
    const onClick = vi.fn();
    renderBell(onClick);
    const button = await screen.findByRole('button');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
