import React, { createContext, useContext, useMemo } from 'react';
import { detectSurface, isDevEnvironment, type AppSurface } from './hostname';

interface SurfaceContextValue {
  surface: AppSurface;
  isAdmin: boolean;
  isMember: boolean;
  isTrainer: boolean;
  isStaff: boolean;
  isMobileFirst: boolean;
}

const SurfaceContext = createContext<SurfaceContextValue | undefined>(undefined);

const STORAGE_KEY = 'moom-surface-preference';

/**
 * Read the stored surface preference (dev/preview only — production
 * surface is dictated by hostname).
 */
export function getStoredSurfacePreference(): AppSurface | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw && ['admin', 'member', 'trainer', 'staff'].includes(raw)) {
      return raw as AppSurface;
    }
  } catch {
    /* localStorage may be unavailable (SSR, privacy mode) */
  }
  return null;
}

/**
 * Persist the user's chosen surface so it survives reloads in dev/preview.
 * No-op in production (hostname is authoritative there).
 */
export function setSurfacePreference(surface: AppSurface): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, surface);
  } catch {
    /* ignore quota / privacy errors */
  }
}

export function clearSurfacePreference(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function SurfaceProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<SurfaceContextValue>(() => {
    // detectSurface already handles hostname + ?surface= + path inference.
    // Stored preference is only used as a tie-breaker on dev/preview when
    // no explicit override or path prefix exists.
    let surface = detectSurface();
    if (isDevEnvironment()) {
      const params = new URLSearchParams(window.location.search);
      const hasOverride = params.has('surface');
      const path = window.location.pathname;
      const pathInfers =
        path.startsWith('/member') ||
        path.startsWith('/trainer') ||
        path.startsWith('/staff');
      if (!hasOverride && !pathInfers) {
        const stored = getStoredSurfacePreference();
        if (stored) surface = stored;
      }
    }
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
