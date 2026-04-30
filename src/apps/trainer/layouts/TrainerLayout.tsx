import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { Home, Calendar, Users, Dumbbell, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { TrainerHeader } from '../components/TrainerHeader';
import { useTranslation } from 'react-i18next';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

export function TrainerLayout() {
  const location = useLocation();
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  useRealtimeSync();

  const TRAINER_NAV = [
    { label: t('trainer.nav.home'), path: '/trainer', icon: Home },
    { label: t('trainer.nav.schedule'), path: '/trainer/schedule', icon: Calendar },
    { label: t('trainer.nav.roster'), path: '/trainer/roster', icon: Users },
    { label: t('trainer.nav.workouts'), path: '/trainer/workouts', icon: Dumbbell },
    { label: t('trainer.nav.profile'), path: '/trainer/profile', icon: User },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="surface-member flex min-h-screen flex-col bg-background">
      <TrainerHeader />
      <main className="flex-1 pt-14 pb-20 animate-page-enter" key={location.pathname}>
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card safe-bottom">
        <div className="mx-auto flex max-w-lg items-center justify-around py-2">
          {TRAINER_NAV.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/trainer' && location.pathname.startsWith(item.path));
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
