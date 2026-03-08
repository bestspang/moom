import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Thin adapter around useAuth() for member surface.
 * Resolves the logged-in user's member_id from identity_map or line_users.
 */
export function useMemberSession() {
  const { user, session, loading, signOut } = useAuth();

  const { data: memberId, isLoading: loadingMemberId } = useQuery({
    queryKey: ['member-identity', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Try identity_map first (admin-created member linked to auth user)
      const { data: identity } = await supabase
        .from('identity_map')
        .select('admin_entity_id')
        .eq('experience_user_id', user.id)
        .eq('entity_type', 'member')
        .eq('is_verified', true)
        .maybeSingle();

      if (identity?.admin_entity_id) return identity.admin_entity_id;

      // Try line_users → member_id
      const { data: lineUser } = await supabase
        .from('line_users')
        .select('member_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (lineUser?.member_id) return lineUser.member_id;

      return null;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const firstName = user?.user_metadata?.first_name ?? '';
  const lastName = user?.user_metadata?.last_name ?? '';

  return {
    user,
    session,
    memberId: memberId ?? null,
    firstName,
    lastName,
    email: user?.email ?? '',
    loading: loading || loadingMemberId,
    signOut,
    isAuthenticated: !!session,
  };
}
