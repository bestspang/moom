import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

    if (surface === 'member' || surface === 'trainer' || surface === 'staff') {
      navigate('/member', { replace: true });
    } else {
      // Admin surface: check if user has admin-capable role
      if (role === 'member') {
        // Member-only users on admin domain → redirect to member
        navigate('/member', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, role, loading, surface, navigate]);

  if (loading) return null;
  if (user) return null; // will redirect via useEffect

  if (surface === 'member' || surface === 'trainer' || surface === 'staff') {
    return <MemberLogin />;
  }

  return <AdminLogin />;
};

export default Login;
