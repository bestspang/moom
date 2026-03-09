import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { detectSurface } from '@/apps/shared/hostname';
import AdminLogin from './AdminLogin';
import MemberLogin from './MemberLogin';

/**
 * Surface-aware login router.
 * Renders AdminLogin on admin surface, MemberLogin on member surface.
 * Also handles post-OAuth redirect (user already logged in).
 */
const Login: React.FC = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const surface = detectSurface();

  // If user is already logged in, redirect to the correct surface
  useEffect(() => {
    if (loading || !user) return;
    // Wait for role to be resolved before redirecting
    if (!role) return;

    if (surface === 'member' || surface === 'trainer' || surface === 'staff') {
      navigate('/member', { replace: true });
    } else {
      // Admin surface: check if user has admin-capable role
      if (role === 'member') {
        navigate('/member', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, role, loading, surface, navigate]);

  if (loading) return null;

  // User logged in but role still loading — show spinner
  if (user && !role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user) return null; // will redirect via useEffect

  if (surface === 'member' || surface === 'trainer' || surface === 'staff') {
    return <MemberLogin />;
  }

  return <AdminLogin />;
};

export default Login;
