import { Outlet, Navigate } from 'react-router-dom';
import { MemberBottomNav } from '../components/MemberBottomNav';
import { MemberHeader } from '../components/MemberHeader';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function MemberLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: { pathname: '/member' } }} replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex-1 pb-20">
        <Outlet />
      </div>
      <MemberBottomNav />
    </div>
  );
}
