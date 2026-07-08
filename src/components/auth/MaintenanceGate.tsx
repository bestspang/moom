import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import Maintenance from '@/pages/Maintenance';
import Login from '@/pages/Auth/Login';

/**
 * Global routing gate for the "Coming Soon / Maintenance" mode.
 *
 * Behavior:
 * - When the `maintenance_mode` flag is OFF → render children unchanged.
 * - When ON → non-staff visitors see the Maintenance page instead of the
 *   normal app. Staff (any role other than `member`) keep full access so
 *   they can operate the system during downtime.
 *
 * Admin backdoor:
 * - Anonymous visitors hitting `/admin` always see the staff Login screen
 *   (regardless of the flag) so owners/managers can sign back in. After
 *   login, the underlying protected `/admin` route (staff management)
 *   takes over as usual.
 *
 * The gate never blocks:
 * - `/liff/*`  (LINE LIFF callbacks — required for auth flow)
 * - `/checkin`, `/checkin-display` (kiosk / QR flows)
 */
const MaintenanceGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: flag, isLoading: flagLoading } = useMaintenanceMode();
  const { user, role, loading: authLoading } = useAuth();
  const { pathname } = useLocation();

  // Wait for both to resolve before deciding — prevents a flash of the
  // Maintenance page for staff that are still loading.
  if (flagLoading || authLoading) return null;

  const isAdminEntry = pathname === '/admin';
  const isLiff = pathname.startsWith('/liff');
  const isKiosk = pathname === '/checkin' || pathname === '/checkin-display';
  // Anyone with a non-member role is considered staff for gate purposes.
  const isStaffUser = !!user && !!role && role !== 'member';

  // Admin backdoor: unauthenticated visit to /admin → show Login directly.
  // Authenticated staff fall through to the normal route (Staff mgmt page).
  if (isAdminEntry && !user) {
    return <Login />;
  }

  const enabled = flag?.enabled === true;
  if (!enabled) return <>{children}</>;

  // Flag ON — only staff, admin entry, LIFF callbacks and kiosk pass through.
  if (isStaffUser || isAdminEntry || isLiff || isKiosk) {
    return <>{children}</>;
  }

  return <Maintenance />;
};

export default MaintenanceGate;
