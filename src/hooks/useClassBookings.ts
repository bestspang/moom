import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queryKeys';

// Types based on database schema
type BookingStatus = 'booked' | 'cancelled' | 'attended' | 'no_show';
type WaitlistStatus = 'waiting' | 'promoted' | 'expired' | 'cancelled';

interface ClassBooking {
  id: string;
  schedule_id: string;
  member_id: string;
  member_package_id: string | null;
  status: BookingStatus;
  booked_at: string;
  cancelled_at: string | null;
  attended_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ClassWaitlist {
  id: string;
  schedule_id: string;
  member_id: string;
  position: number;
  status: WaitlistStatus;
  created_at: string;
  promoted_at: string | null;
  expired_at: string | null;
}

// Fetch bookings for a specific schedule
export const useClassBookings = (scheduleId?: string) => {
  return useQuery({
    queryKey: queryKeys.classBookings(scheduleId),
    queryFn: async () => {
      let query = supabase
        .from('class_bookings')
        .select(`
          *,
          members(id, first_name, last_name, nickname, avatar_url, member_id),
          member_packages(id, package_id, sessions_remaining)
        `)
        .order('booked_at', { ascending: true });

      if (scheduleId) {
        query = query.eq('schedule_id', scheduleId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!scheduleId,
  });
};

// Fetch bookings for a specific member
export const useMemberBookings = (memberId: string, status?: BookingStatus) => {
  return useQuery({
    queryKey: queryKeys.memberBookings(memberId, status),
    queryFn: async () => {
      let query = supabase
        .from('class_bookings')
        .select(`
          *,
          schedule(
            id,
            scheduled_date,
            start_time,
            end_time,
            classes(id, name, description),
            rooms(id, name),
            staff(id, first_name, last_name, nickname)
          )
        `)
        .eq('member_id', memberId)
        .order('booked_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!memberId,
  });
};

// Create a new booking
export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      scheduleId,
      memberId,
      memberPackageId,
      notes,
    }: {
      scheduleId: string;
      memberId: string;
      memberPackageId?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('class_bookings')
        .insert({
          schedule_id: scheduleId,
          member_id: memberId,
          member_package_id: memberPackageId || null,
          notes: notes || null,
          status: 'booked',
          booked_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['class-bookings', variables.scheduleId] });
      queryClient.invalidateQueries({ queryKey: ['member-bookings', variables.memberId] });
      toast.success('Booking created successfully');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate key')) {
        toast.error('Member is already booked for this class');
      } else {
        toast.error('Failed to create booking');
      }
      console.error('Create booking error:', error);
    },
  });
};

// Cancel a booking
export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      cancelledBy,
      reason,
    }: {
      bookingId: string;
      cancelledBy: string;
      reason?: string;
    }) => {
      const { data, error } = await supabase
        .from('class_bookings')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: cancelledBy,
          cancellation_reason: reason || null,
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['member-bookings'] });
      toast.success('Booking cancelled');
    },
    onError: (error) => {
      toast.error('Failed to cancel booking');
      console.error('Cancel booking error:', error);
    },
  });
};

// Mark attendance for a booking
export const useMarkAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      status,
    }: {
      bookingId: string;
      status: 'attended' | 'no_show';
    }) => {
      const updates: Partial<ClassBooking> = { status };
      if (status === 'attended') {
        updates.attended_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('class_bookings')
        .update(updates)
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['member-bookings'] });
      toast.success('Attendance recorded');
    },
    onError: (error) => {
      toast.error('Failed to record attendance');
      console.error('Mark attendance error:', error);
    },
  });
};

// Batch mark attendance for multiple bookings
export const useBatchMarkAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingIds,
      status,
    }: {
      bookingIds: string[];
      status: 'attended' | 'no_show';
    }) => {
      const updates: Partial<ClassBooking> = { status };
      if (status === 'attended') {
        updates.attended_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('class_bookings')
        .update(updates)
        .in('id', bookingIds)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['member-bookings'] });
      toast.success('Attendance recorded for all members');
    },
    onError: (error) => {
      toast.error('Failed to record attendance');
      console.error('Batch mark attendance error:', error);
    },
  });
};

// =============================================
// Waitlist Hooks
// =============================================

// Fetch waitlist for a schedule
export const useWaitlist = (scheduleId: string) => {
  return useQuery({
    queryKey: queryKeys.classWaitlist(scheduleId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_waitlist')
        .select(`
          *,
          members(id, first_name, last_name, nickname, avatar_url, member_id)
        `)
        .eq('schedule_id', scheduleId)
        .eq('status', 'waiting')
        .order('position', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!scheduleId,
  });
};

// Join waitlist
export const useJoinWaitlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      scheduleId,
      memberId,
    }: {
      scheduleId: string;
      memberId: string;
    }) => {
      const { data: existing, error: posError } = await supabase
        .from('class_waitlist')
        .select('position')
        .eq('schedule_id', scheduleId)
        .eq('status', 'waiting')
        .order('position', { ascending: false })
        .limit(1);

      if (posError) throw posError;

      const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 1;

      const { data, error } = await supabase
        .from('class_waitlist')
        .insert({
          schedule_id: scheduleId,
          member_id: memberId,
          position: nextPosition,
          status: 'waiting',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['class-waitlist', variables.scheduleId] });
      toast.success('Added to waitlist');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate key')) {
        toast.error('Already on the waitlist');
      } else {
        toast.error('Failed to join waitlist');
      }
      console.error('Join waitlist error:', error);
    },
  });
};

// Leave waitlist
export const useLeaveWaitlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      waitlistId,
    }: {
      waitlistId: string;
    }) => {
      const { data, error } = await supabase
        .from('class_waitlist')
        .update({ status: 'cancelled' })
        .eq('id', waitlistId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-waitlist'] });
      toast.success('Removed from waitlist');
    },
    onError: (error) => {
      toast.error('Failed to leave waitlist');
      console.error('Leave waitlist error:', error);
    },
  });
};

// Promote from waitlist to booking
export const usePromoteFromWaitlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      waitlistId,
      scheduleId,
      memberId,
      memberPackageId,
    }: {
      waitlistId: string;
      scheduleId: string;
      memberId: string;
      memberPackageId?: string;
    }) => {
      const { error: waitlistError } = await supabase
        .from('class_waitlist')
        .update({
          status: 'promoted',
          promoted_at: new Date().toISOString(),
        })
        .eq('id', waitlistId);

      if (waitlistError) throw waitlistError;

      const { data, error } = await supabase
        .from('class_bookings')
        .insert({
          schedule_id: scheduleId,
          member_id: memberId,
          member_package_id: memberPackageId || null,
          status: 'booked',
          booked_at: new Date().toISOString(),
          notes: 'Promoted from waitlist',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['class-waitlist', variables.scheduleId] });
      queryClient.invalidateQueries({ queryKey: ['class-bookings', variables.scheduleId] });
      toast.success('Member promoted from waitlist');
    },
    onError: (error) => {
      toast.error('Failed to promote from waitlist');
      console.error('Promote from waitlist error:', error);
    },
  });
};

// Get booking count for a schedule
export const useBookingCount = (scheduleId: string) => {
  return useQuery({
    queryKey: queryKeys.bookingCount(scheduleId),
    queryFn: async () => {
      const { count, error } = await supabase
        .from('class_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('schedule_id', scheduleId)
        .eq('status', 'booked');

      if (error) throw error;
      return count || 0;
    },
    enabled: !!scheduleId,
  });
};
