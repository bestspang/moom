import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm px-4">
        <div className="rounded-full bg-destructive/10 p-4">
          <ShieldX className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Access Denied</h1>
        <p className="text-sm text-muted-foreground">
          You don't have permission to view this page. Contact your administrator if you believe this is an error.
        </p>
        <Button variant="outline" onClick={() => navigate('/')}>
          Back to Dashboard
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

  if (minAccessLevel && accessLevel) {
    const userLevel = accessLevelOrder[accessLevel];
    const requiredLevel = accessLevelOrder[minAccessLevel];
    
    if (userLevel < requiredLevel) {
      return <AccessDenied />;
    }
  }

  return <>{children}</>;
};
