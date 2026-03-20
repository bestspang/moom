/**
 * Multi-surface hostname detection and routing utilities.
 *
 * Surfaces:
 *   admin   → admin.moom.fit (desktop-first)
 *   member  → member.moom.fit (mobile-first)
 *   trainer → member.moom.fit/trainer/* (mobile-first)
 *   staff   → member.moom.fit/staff/* (mobile-first)
 *
 * In development (localhost / *.lovable.app), defaults to admin surface
 * unless ?surface=member|trainer|staff is provided.
 */

export type AppSurface = 'admin' | 'member' | 'trainer' | 'staff';

interface HostnameConfig {
  adminHosts: string[];
  memberHosts: string[];
}

const CONFIG: HostnameConfig = {
  adminHosts: ['admin.moom.fit'],
  memberHosts: ['member.moom.fit'],
};

/** Detect the current app surface from hostname + pathname + optional override */
export function detectSurface(): AppSurface {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  const params = new URLSearchParams(window.location.search);

  // Dev override via ?surface=member|trainer|staff|admin
  const override = params.get('surface') as AppSurface | null;
  if (override && ['admin', 'member', 'trainer', 'staff'].includes(override)) {
    return override;
  }

  // Production hostname detection
  if (CONFIG.memberHosts.includes(hostname)) {
    if (pathname.startsWith('/trainer')) return 'trainer';
    if (pathname.startsWith('/staff')) return 'staff';
    return 'member';
  }

  if (CONFIG.adminHosts.includes(hostname)) {
    return 'admin';
  }

  // Development / preview: infer surface from pathname so refresh stays on the same surface
  if (pathname.startsWith('/member')) return 'member';
  if (pathname.startsWith('/trainer')) return 'trainer';
  if (pathname.startsWith('/staff')) return 'staff';

  return 'admin';
}

/** Check if current hostname is a known member-facing host */
export function isMemberHost(): boolean {
  return CONFIG.memberHosts.includes(window.location.hostname);
}

/** Check if current hostname is a known admin host */
export function isAdminHost(): boolean {
  return CONFIG.adminHosts.includes(window.location.hostname);
}

/** Check if we're in a development/preview environment */
export function isDevEnvironment(): boolean {
  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.lovable.app')
  );
}

/** Check if we're on a custom domain (not lovable.app or localhost) */
export function isCustomDomain(): boolean {
  const hostname = window.location.hostname;
  return (
    hostname !== 'localhost' &&
    hostname !== '127.0.0.1' &&
    !hostname.endsWith('.lovable.app') &&
    (CONFIG.adminHosts.includes(hostname) || CONFIG.memberHosts.includes(hostname))
  );
}

/** Get the correct base URL for a given surface */
export function getSurfaceBaseUrl(surface: AppSurface): string {
  const protocol = window.location.protocol;
  switch (surface) {
    case 'admin':
      return isDevEnvironment()
        ? `${protocol}//${window.location.host}`
        : `${protocol}//admin.moom.fit`;
    case 'member':
    case 'trainer':
    case 'staff':
      return isDevEnvironment()
        ? `${protocol}//${window.location.host}`
        : `${protocol}//member.moom.fit`;
  }
}

/** Build a redirect URL to the correct surface/domain */
export function buildCrossSurfaceUrl(
  surface: AppSurface,
  path: string,
): string {
  const base = getSurfaceBaseUrl(surface);
  if (isDevEnvironment()) {
    // In dev, use ?surface= param
    const url = new URL(path, base);
    url.searchParams.set('surface', surface);
    return url.toString();
  }
  return `${base}${path}`;
}

/** Get the default route for a given surface */
export function getDefaultRoute(surface: AppSurface): string {
  switch (surface) {
    case 'admin':
      return '/';
    case 'member':
      return '/member';
    case 'trainer':
      return '/trainer';
    case 'staff':
      return '/staff';
  }
}

/** Route-host affinity: which hostname should serve this route? */
export type RouteAffinity = 'admin' | 'member' | 'shared';

const MEMBER_HOST_PREFIXES = ['/member', '/trainer', '/staff'];
const SHARED_PREFIXES = ['/login', '/signup', '/forgot-password', '/reset-password', '/checkin', '/liff', '/diagnostics/surface', '/diagnostics/auth'];

export function getRouteHostAffinity(pathname: string): RouteAffinity {
  if (MEMBER_HOST_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return 'member';
  }
  if (SHARED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return 'shared';
  }
  // Everything else (/, /lobby, /finance, /setting, etc.) is admin
  return 'admin';
}
