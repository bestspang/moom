import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];
type AccessLevel = Database['public']['Enums']['access_level'];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  accessLevel: AccessLevel | null;
  staffStatus: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Map app_role to access_level
const roleToAccessLevel: Record<AppRole, AccessLevel> = {
  front_desk: 'level_1_minimum',
  trainer: 'level_2_operator',
  admin: 'level_3_manager',
  owner: 'level_4_master',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [accessLevel, setAccessLevel] = useState<AccessLevel | null>(null);
  const [staffStatus, setStaffStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRoleAndStatus = async (userId: string) => {
    try {
      // Fetch role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleError) {
        console.error('Error fetching user role:', roleError);
        return;
      }

      if (roleData) {
        setRole(roleData.role);
        setAccessLevel(roleToAccessLevel[roleData.role]);
      }

      // Fetch staff status
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('status')
        .eq('user_id', userId)
        .single();

      if (staffError) {
        console.error('Error fetching staff status:', staffError);
        return;
      }

      if (staffData?.status === 'inactive') {
        setStaffStatus('inactive');
        // Auto sign-out inactive users
        await supabase.auth.signOut();
        return;
      }

      setStaffStatus(staffData?.status ?? null);
    } catch (error) {
      console.error('Error in fetchUserRoleAndStatus:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener BEFORE getting session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(() => fetchUserRoleAndStatus(session.user.id), 0);
        } else {
          setRole(null);
          setAccessLevel(null);
          setStaffStatus(null);
        }
        
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRoleAndStatus(session.user.id);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      // Note: Staff and user_roles records are now created automatically
      // via database trigger (handle_new_user) for security
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setAccessLevel(null);
    setStaffStatus(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        accessLevel,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
