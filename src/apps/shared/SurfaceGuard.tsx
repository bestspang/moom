import { useLocation, Navigate } from 'react-router-dom';
import { isMemberHost, isAdminHost, isDevEnvironment, getRouteHostAffinity } from './hostname';
import type { ReactNode } from 'react';

interface SurfaceGuardProps {
  children: ReactNode;
}

/**
 * Domain-aware route guard.
 *
 * Production only (skipped in dev/lovable.app):
 * - member.moom.fit + admin-only route → redirect to admin.moom.fit
 * - admin.moom.fit + member-host route → redirect to member.moom.fit
 * - member.moom.fit/ (root) → Navigate to /member
 */
export default function SurfaceGuard({ children }: SurfaceGuardProps) {
  const location = useLocation();

  // Dev environments: no guard, use ?surface= for testing
  if (isDevEnvironment()) {
    return <>{children}</>;
  }

  const pathname = location.pathname;
  const affinity = getRouteHostAffinity(pathname);

  // member.moom.fit root → redirect to /member
  if (isMemberHost() && pathname === '/') {
    return <Navigate to="/member" replace />;
  }

  // Wrong-host: member host serving admin route
  if (isMemberHost() && affinity === 'admin') {
    window.location.href = `https://admin.moom.fit${pathname}${location.search}`;
    return null;
  }

  // Wrong-host: admin host serving member/trainer/staff route
  if (isAdminHost() && affinity === 'member') {
    window.location.href = `https://member.moom.fit${pathname}${location.search}`;
    return null;
  }

  return <>{children}</>;
}

/** Get the redirect result for diagnostics display */
export function getRedirectResult(pathname: string): string {
  if (isDevEnvironment()) return 'No redirect (dev environment)';

  const affinity = getRouteHostAffinity(pathname);

  if (isMemberHost() && pathname === '/') return 'Redirect → /member';
  if (isMemberHost() && affinity === 'admin') return `Redirect → admin.moom.fit${pathname}`;
  if (isAdminHost() && affinity === 'member') return `Redirect → member.moom.fit${pathname}`;

  return 'No redirect (correct host)';
}
