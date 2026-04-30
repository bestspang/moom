import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { MemberBottomNav } from '../components/MemberBottomNav';
import { MemberHeader } from '../components/MemberHeader';
import { MemberHeaderErrorBoundary } from '../components/MemberHeaderErrorBoundary';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { XPToast } from '../features/momentum/XPToast';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export function MemberLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  useRealtimeSync();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/member/login" state={{ from: location }} replace />;
  }

  return (
    <div className="surface-member flex min-h-screen flex-col bg-background">
      <MemberHeaderErrorBoundary>
        <MemberHeader />
      </MemberHeaderErrorBoundary>
      <main className="flex-1 pt-14 pb-20 animate-page-enter" key={location.pathname}>
        <ErrorBoundary key={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
      <MemberBottomNav />
      <XPToast />
    </div>
  );
}
