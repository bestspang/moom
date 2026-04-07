import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { detectSurface } from '@/apps/shared/hostname';
import { useTranslation } from 'react-i18next';
import type { Database } from '@/integrations/supabase/types';

type AccessLevel = Database['public']['Enums']['access_level'];

interface ProtectedRouteProps {
  children: React.ReactNode;
  minAccessLevel?: AccessLevel;
}

const accessLevelOrder: Record<AccessLevel, number> = {
  level_1_minimum: 1,
  level_2_operator: 2,
  level_3_manager: 3,
  level_4_master: 4,
};

const AccessDenied: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const surface = detectSurface();
  const backPath = surface === 'member' ? '/member' : '/';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm px-4">
        <div className="rounded-full bg-destructive/10 p-4">
          <ShieldX className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">{t('auth.accessDenied')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('auth.accessDeniedDescription')}
        </p>
        <Button variant="outline" onClick={() => navigate(backPath)}>
          {t('auth.backTo', { page: surface === 'member' ? t('auth.home') : t('auth.dashboard') })}
        </Button>
      </div>
    </div>
  );
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  minAccessLevel 
}) => {
  const { user, loading, accessLevel } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (minAccessLevel) {
    if (!accessLevel) {
      return <AccessDenied />;
    }
    const userLevel = accessLevelOrder[accessLevel];
    const requiredLevel = accessLevelOrder[minAccessLevel];

    if (userLevel < requiredLevel) {
      return <AccessDenied />;
    }
  }

  return <>{children}</>;
};
