import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';

interface ProvidersOptions {
  routerProps?: MemoryRouterProps;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: ProvidersOptions & Omit<RenderOptions, 'wrapper'>,
) {
  const { routerProps, ...renderOptions } = options ?? {};

  function Wrapper({ children }: { children: React.ReactNode }) {
    return <MemoryRouter {...routerProps}>{children}</MemoryRouter>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/** Factory for a complete useAuth mock return value */
export function mockAuthValue(overrides: Record<string, any> = {}) {
  return {
    user: null,
    session: null,
    role: null,
    allRoles: [],
    accessLevel: null,
    staffStatus: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    ...overrides,
  };
}
