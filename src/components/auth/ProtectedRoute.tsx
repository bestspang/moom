import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
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

  // Check access level if required
  if (minAccessLevel && accessLevel) {
    const userLevel = accessLevelOrder[accessLevel];
    const requiredLevel = accessLevelOrder[minAccessLevel];
    
    if (userLevel < requiredLevel) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};
