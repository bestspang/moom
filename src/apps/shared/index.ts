export { SurfaceProvider, useSurface } from './SurfaceContext';
export { detectSurface, isMemberHost, isAdminHost, isDevEnvironment, getSurfaceBaseUrl, buildCrossSurfaceUrl, getDefaultRoute, getRouteHostAffinity } from './hostname';
export { default as SurfaceGuard } from './SurfaceGuard';
export { getRedirectResult } from './SurfaceGuard';
export type { AppSurface, ExperienceRole } from './types';
