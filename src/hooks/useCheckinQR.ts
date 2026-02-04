import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CheckinQRToken {
  id: string;
  member_id: string;
  location_id: string;
  token: string;
  token_type: string;
  expires_at: string;
  used_at: string | null;
  used_by_staff_id: string | null;
  created_at: string;
}

// Generate a secure random token
const generateSecureToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

// Generate a new QR token for check-in
export const useGenerateQRToken = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      locationId,
      expiresInSeconds = 120,
      tokenType = 'checkin',
    }: {
      memberId: string;
      locationId: string;
      expiresInSeconds?: number;
      tokenType?: string;
    }) => {
      // Generate secure token
      const token = generateSecureToken();
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

      // Invalidate any existing unused tokens for this member/location
      await supabase
        .from('checkin_qr_tokens')
        .update({ expires_at: new Date().toISOString() })
        .eq('member_id', memberId)
        .eq('location_id', locationId)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString());

      // Create new token
      const { data, error } = await supabase
        .from('checkin_qr_tokens')
        .insert({
          member_id: memberId,
          location_id: locationId,
          token,
          token_type: tokenType,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) throw error;
      return data as CheckinQRToken;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['active-qr-token', variables.memberId] });
      toast.success('QR code generated');
    },
    onError: (error) => {
      toast.error('Failed to generate QR code');
      console.error('Generate QR token error:', error);
    },
  });
};

// Validate and use a QR token
export const useValidateQRToken = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      token,
      staffId,
    }: {
      token: string;
      staffId?: string;
    }) => {
      // Find the token
      const { data: tokenData, error: findError } = await supabase
        .from('checkin_qr_tokens')
        .select(`
          *,
          members(id, first_name, last_name, nickname, member_id),
          locations(id, name)
        `)
        .eq('token', token)
        .single();

      if (findError) throw new Error('Invalid QR code');
      if (!tokenData) throw new Error('QR code not found');

      // Check if expired
      if (new Date(tokenData.expires_at) < new Date()) {
        throw new Error('QR code has expired');
      }

      // Check if already used
      if (tokenData.used_at) {
        throw new Error('QR code has already been used');
      }

      // Mark as used
      const { data, error } = await supabase
        .from('checkin_qr_tokens')
        .update({
          used_at: new Date().toISOString(),
          used_by_staff_id: staffId || null,
        })
        .eq('id', tokenData.id)
        .select(`
          *,
          members(id, first_name, last_name, nickname, member_id),
          locations(id, name)
        `)
        .single();

      if (error) throw error;

      return {
        token: data as CheckinQRToken,
        member: tokenData.members,
        location: tokenData.locations,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-qr-token'] });
      toast.success('Check-in successful!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Invalid QR code');
      console.error('Validate QR token error:', error);
    },
  });
};

// Get active (unused, unexpired) QR token for a member
export const useActiveQRToken = (memberId: string, locationId?: string) => {
  return useQuery({
    queryKey: ['active-qr-token', memberId, locationId],
    queryFn: async () => {
      let query = supabase
        .from('checkin_qr_tokens')
        .select('*')
        .eq('member_id', memberId)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data?.[0] as CheckinQRToken | undefined;
    },
    enabled: !!memberId,
    refetchInterval: 10000, // Refetch every 10 seconds to check expiry
  });
};

// Get QR token history for a member
export const useQRTokenHistory = (memberId: string, limit = 10) => {
  return useQuery({
    queryKey: ['qr-token-history', memberId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checkin_qr_tokens')
        .select(`
          *,
          locations(id, name),
          staff:used_by_staff_id(id, first_name, last_name, nickname)
        `)
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    enabled: !!memberId,
  });
};

// Check if token is still valid (not expired and not used)
export const useIsTokenValid = (tokenId: string) => {
  return useQuery({
    queryKey: ['token-valid', tokenId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checkin_qr_tokens')
        .select('expires_at, used_at')
        .eq('id', tokenId)
        .single();

      if (error) throw error;
      if (!data) return false;

      const isExpired = new Date(data.expires_at) < new Date();
      const isUsed = !!data.used_at;

      return !isExpired && !isUsed;
    },
    enabled: !!tokenId,
    refetchInterval: 5000, // Check every 5 seconds
  });
};

// Get time remaining until token expires
export const getTokenTimeRemaining = (expiresAt: string): number => {
  const expiryTime = new Date(expiresAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((expiryTime - now) / 1000));
};

// Clean up expired tokens (can be called periodically)
export const useCleanupExpiredTokens = () => {
  return useMutation({
    mutationFn: async () => {
      // Delete tokens that expired more than 1 hour ago
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { error } = await supabase
        .from('checkin_qr_tokens')
        .delete()
        .lt('expires_at', oneHourAgo);

      if (error) throw error;
    },
    onError: (error) => {
      console.error('Cleanup expired tokens error:', error);
    },
  });
};
