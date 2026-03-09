import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { MemberBottomNav } from '../components/MemberBottomNav';
import { MemberHeader } from '../components/MemberHeader';
import { MemberHeaderErrorBoundary } from '../components/MemberHeaderErrorBoundary';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { XPToast } from '../features/momentum/XPToast';

export function MemberLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.log('[MemberLayout] render:', { user: !!user, userId: user?.id, loading, path: location.pathname });

  if (loading) {
    console.log('[MemberLayout] → showing loader');
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    console.log('[MemberLayout] → redirecting to /login (user is null)');
    return <Navigate to="/login" state={{ from: { pathname: '/member' } }} replace />;
  }

  console.log('[MemberLayout] → rendering layout with header');
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MemberHeaderErrorBoundary>
        <MemberHeader />
      </MemberHeaderErrorBoundary>
      <div className="flex-1 pt-14 pb-20">
        <Outlet />
      </div>
      <MemberBottomNav />
      <XPToast />
    </div>
  );
}
