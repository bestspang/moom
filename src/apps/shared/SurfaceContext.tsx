import React, { createContext, useContext, useMemo } from 'react';
import { detectSurface, type AppSurface } from './hostname';

interface SurfaceContextValue {
  surface: AppSurface;
  isAdmin: boolean;
  isMember: boolean;
  isTrainer: boolean;
  isStaff: boolean;
  isMobileFirst: boolean;
}

const SurfaceContext = createContext<SurfaceContextValue | undefined>(undefined);

export function SurfaceProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<SurfaceContextValue>(() => {
    const surface = detectSurface();
    return {
      surface,
      isAdmin: surface === 'admin',
      isMember: surface === 'member',
      isTrainer: surface === 'trainer',
      isStaff: surface === 'staff',
      isMobileFirst: surface !== 'admin',
    };
  }, []);

  return (
    <SurfaceContext.Provider value={value}>
      {children}
    </SurfaceContext.Provider>
  );
}

export function useSurface(): SurfaceContextValue {
  const ctx = useContext(SurfaceContext);
  if (!ctx) throw new Error('useSurface must be used within SurfaceProvider');
  return ctx;
}
