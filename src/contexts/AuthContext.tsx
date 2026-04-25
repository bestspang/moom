import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { consumeSessionFromUrl } from '@/apps/shared/sessionTransfer';
import type { User, Session } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];
type AccessLevel = Database['public']['Enums']['access_level'];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  allRoles: AppRole[];
  accessLevel: AccessLevel | null;
  staffStatus: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, firstName: string, lastName: string, signupSurface?: 'admin' | 'member', extraMeta?: Record<string, string>) => Promise<{ error: Error | null }>;
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
  member: 'level_1_minimum',
  front_desk: 'level_1_minimum',
  trainer: 'level_2_operator',
  freelance_trainer: 'level_2_operator',
  admin: 'level_3_manager',
  owner: 'level_4_master',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [allRoles, setAllRoles] = useState<AppRole[]>([]);
  const [accessLevel, setAccessLevel] = useState<AccessLevel | null>(null);
  const [staffStatus, setStaffStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchingForUserRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  const fetchUserRoleAndStatus = async (userId: string) => {
    if (fetchingForUserRef.current === userId) return;
    fetchingForUserRef.current = userId;
    try {
      // Fetch role
      const { data: rolesData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (roleError) {
        console.error('Error fetching user roles:', roleError);
        setLoading(false);
        return;
      }

      if (rolesData && rolesData.length > 0) {
        const roles = rolesData.map(r => r.role);
        setAllRoles(roles);
        const roleOrder: AppRole[] = ['owner', 'admin', 'trainer', 'freelance_trainer', 'front_desk', 'member'];
        const highest = roleOrder.find(r => roles.includes(r)) ?? roles[0];
        setRole(highest);
        setAccessLevel(roleToAccessLevel[highest]);
      } else {
        setAllRoles(['member']);
        setRole('member');
        setAccessLevel('level_1_minimum');
      }

      // Fetch staff status
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('status')
        .eq('user_id', userId)
        .maybeSingle();

      if (staffError) {
        console.error('Error fetching staff status:', staffError);
        setLoading(false);
        return;
      }

      if (staffData?.status === 'inactive') {
        setStaffStatus('inactive');
        await supabase.auth.signOut();
        return;
      }

      setStaffStatus(staffData?.status ?? null);
    } catch (error) {
      console.error('Error in fetchUserRoleAndStatus:', error);
    } finally {
      fetchingForUserRef.current = null;
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set up auth state listener BEFORE getting session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
      if (session?.user) {
          initializedRef.current = true;
          setSession(session);
          setUser(session.user);
          if (fetchingForUserRef.current !== session.user.id) {
            setTimeout(() => fetchUserRoleAndStatus(session.user.id), 0);
          } else {
            setLoading(false);
          }
        } else if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session?.user)) {
          initializedRef.current = true;
          setSession(null);
          setUser(null);
          setRole(null);
          setAllRoles([]);
          setAccessLevel(null);
          setStaffStatus(null);
          setLoading(false);
        }
      }
    );

    // Try to consume session tokens from URL hash (cross-surface transfer)
    consumeSessionFromUrl().then((consumed) => {
      if (consumed) {
        console.log('[AuthContext] Session consumed from URL hash');
        // onAuthStateChange will fire with the new session — no further action needed
        return;
      }
      // Fallback: only stop loading if onAuthStateChange hasn't already handled it
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!initializedRef.current) {
          if (session?.user) {
            initializedRef.current = true;
            setSession(session);
            setUser(session.user);
            fetchUserRoleAndStatus(session.user.id);
          } else {
            initializedRef.current = true;
            // Let onAuthStateChange INITIAL_SESSION handle setLoading(false)
          }
        }
      });
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

  const signUp = async (email: string, password: string, firstName: string, lastName: string, signupSurface: 'admin' | 'member' = 'admin', extraMeta?: Record<string, string>) => {
    try {
      // Note: Staff and user_roles records are now created automatically
      // via database trigger (handle_new_user) for security
      // signup_surface determines whether a staff or member record is created
      const emailRedirectTo = signupSurface === 'member'
        ? `${window.location.origin}/member`
        : window.location.origin;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          data: {
            first_name: firstName,
            last_name: lastName,
            signup_surface: signupSurface,
            ...extraMeta,
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
    setAllRoles([]);
    setAccessLevel(null);
    setStaffStatus(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        allRoles,
        accessLevel,
        staffStatus,
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
