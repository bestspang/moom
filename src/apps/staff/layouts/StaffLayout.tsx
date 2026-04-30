import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { Home, ScanLine, Users, CreditCard, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

export function StaffLayout() {
  const location = useLocation();
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  useRealtimeSync();

  const STAFF_NAV = [
    { label: t('staff.nav.home'), path: '/staff', icon: Home },
    { label: t('staff.nav.checkin'), path: '/staff/checkin', icon: ScanLine },
    { label: t('staff.nav.members'), path: '/staff/members', icon: Users },
    { label: t('staff.nav.payments'), path: '/staff/payments', icon: CreditCard },
    { label: t('staff.nav.profile'), path: '/staff/profile', icon: User },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: { pathname: '/staff' } }} replace />;
  }

  return (
    <div className="surface-member flex min-h-screen flex-col bg-background">
      <main className="flex-1 pb-20 animate-page-enter" key={location.pathname}>
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card safe-bottom">
        <div className="mx-auto flex max-w-lg items-center justify-around py-2">
          {STAFF_NAV.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/staff' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5px]')} />
                <span className={cn('font-medium', isActive && 'font-semibold')}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
