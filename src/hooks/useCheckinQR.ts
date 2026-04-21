import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import i18n from '@/i18n';
import { logActivity } from '@/lib/activityLogger';

interface CheckinQRToken {
  id: string;
  member_id: string | null;
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

// Generate a new QR token for check-in (memberId is optional for location-only QR)
export const useGenerateQRToken = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      locationId,
      expiresInSeconds = 120,
      tokenType = 'checkin',
    }: {
      memberId?: string;
      locationId: string;
      expiresInSeconds?: number;
      tokenType?: string;
    }) => {
      const token = generateSecureToken();
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

      // Invalidate existing unused tokens for this location
      const invalidateQuery = supabase
        .from('checkin_qr_tokens')
        .update({ expires_at: new Date().toISOString() } as any)
        .eq('location_id', locationId)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString());

      if (memberId) {
        invalidateQuery.eq('member_id', memberId);
      }
      await invalidateQuery;

      // Create new token (member_id is nullable now)
      const insertData: any = {
        location_id: locationId,
        token,
        token_type: tokenType,
        expires_at: expiresAt,
      };
      if (memberId) {
        insertData.member_id = memberId;
      }

      const { data, error } = await supabase
        .from('checkin_qr_tokens')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data as CheckinQRToken;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-qr-token'] });
      logActivity({
        event_type: 'checkin_qr_generated',
        activity: 'Check-in QR token generated',
        entity_type: 'checkin_qr_token',
      });
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
      memberId,
      staffId,
    }: {
      token: string;
      memberId?: string;
      staffId?: string;
    }) => {
      const { data: tokenData, error: findError } = await supabase
        .from('checkin_qr_tokens')
        .select('*')
        .eq('token', token)
        .single();

      if (findError) throw new Error('Invalid QR code');
      if (!tokenData) throw new Error('QR code not found');
      if (new Date(tokenData.expires_at) < new Date()) throw new Error('QR code has expired');
      if (tokenData.used_at) throw new Error('QR code has already been used');

      // Mark as used
      await supabase
        .from('checkin_qr_tokens')
        .update({
          used_at: new Date().toISOString(),
          used_by_staff_id: staffId || null,
        } as any)
        .eq('id', tokenData.id);

      // Create attendance record
      const effectiveMemberId = memberId || tokenData.member_id;
      if (effectiveMemberId) {
        await supabase
          .from('member_attendance')
          .insert({
            member_id: effectiveMemberId,
            location_id: tokenData.location_id,
            check_in_time: new Date().toISOString(),
            check_in_type: 'gym',
            checkin_method: 'qr',
          } as any);
      }

      return { token: tokenData, memberId: effectiveMemberId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['active-qr-token'] });
      queryClient.invalidateQueries({ queryKey: ['check-ins'] });
      logActivity({
        event_type: 'checkin_qr_validated',
        activity: 'Check-in via QR code successful',
        entity_type: 'member_attendance',
        member_id: data.memberId || undefined,
      });
      toast.success('Check-in successful!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Invalid QR code');
    },
  });
};

// Get active (unused, unexpired) QR token for a member
export const useActiveQRToken = (memberId: string | null, locationId?: string) => {
  return useQuery({
    queryKey: ['active-qr-token', memberId, locationId],
    queryFn: async () => {
      if (!memberId) return undefined;
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
    refetchInterval: 10000,
  });
};

// Fetch token info (read-only, no mark as used) for redemption page
export const useTokenInfo = (token: string | null) => {
  return useQuery({
    queryKey: ['token-info', token],
    queryFn: async () => {
      if (!token) return null;
      const { data, error } = await supabase
        .from('checkin_qr_tokens')
        .select('*, locations(name)')
        .eq('token', token)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        ...data,
        location_name: (data.locations as any)?.name || '',
      } as CheckinQRToken & { location_name: string };
    },
    enabled: !!token,
    staleTime: 5000,
  });
};

// Get time remaining until token expires
export const getTokenTimeRemaining = (expiresAt: string): number => {
  const expiryTime = new Date(expiresAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((expiryTime - now) / 1000));
};
