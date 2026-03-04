import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queryKeys';
import { logActivity } from '@/lib/activityLogger';

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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['class-bookings', variables.scheduleId] });
      queryClient.invalidateQueries({ queryKey: ['member-bookings', variables.memberId] });
      logActivity({
        event_type: 'booking_created',
        activity: `Booking created for schedule`,
        entity_type: 'class_booking',
        entity_id: data.id,
        member_id: variables.memberId,
      });
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['class-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['member-bookings'] });
      logActivity({
        event_type: 'booking_cancelled',
        activity: `Booking cancelled`,
        entity_type: 'class_booking',
        entity_id: data.id,
        member_id: data.member_id,
      });
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
        .select(`
          *,
          schedule:schedule_id(id, scheduled_date, location_id)
        `)
        .single();

      if (error) throw error;

      // --- Cross-module writes for "attended" ---
      if (status === 'attended' && data) {
        const schedule = (data as any).schedule;

        // 1) Insert member_attendance row
        await supabase.from('member_attendance').insert({
          member_id: data.member_id,
          schedule_id: data.schedule_id,
          member_package_id: data.member_package_id ?? undefined,
          location_id: schedule?.location_id ?? undefined,
          checkin_method: 'manual',
          check_in_type: 'class',
          check_in_time: new Date().toISOString(),
        });

        // 2) If session-based package, insert ledger entry
        if (data.member_package_id) {
          const { data: mp } = await supabase
            .from('member_packages')
            .select('sessions_remaining, sessions_used, package_id, packages(sessions)')
            .eq('id', data.member_package_id)
            .single();

          const pkg = (mp as any)?.packages;
          if (pkg?.sessions && pkg.sessions > 0) {
            const newBalance = Math.max((mp?.sessions_remaining ?? 0) - 1, 0);

            await supabase.from('package_usage_ledger').insert({
              member_package_id: data.member_package_id,
              delta_sessions: -1,
              balance_after: newBalance,
              usage_type: 'booking',
              reference_type: 'schedule',
              reference_id: data.schedule_id,
              note: 'Class attendance',
            });

            // Update sessions_remaining on member_packages
            await supabase
              .from('member_packages')
              .update({
                sessions_remaining: newBalance,
                sessions_used: (mp?.sessions_used ?? 0) + 1,
              })
              .eq('id', data.member_package_id);
          }
        }
      }

      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['class-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['member-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['member-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['package-usage'] });
      queryClient.invalidateQueries({ queryKey: ['member-packages'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['gym-checkins'] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      logActivity({
        event_type: 'attendance_marked',
        activity: `Attendance marked as ${variables.status}`,
        entity_type: 'class_booking',
        entity_id: variables.bookingId,
        member_id: data.member_id,
      });
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
        .select(`
          *,
          schedule:schedule_id(id, scheduled_date, location_id)
        `);

      if (error) throw error;

      // --- Cross-module writes for each "attended" booking ---
      if (status === 'attended' && data) {
        for (const booking of data) {
          const schedule = (booking as any).schedule;

          // 1) Insert member_attendance row
          await supabase.from('member_attendance').insert({
            member_id: booking.member_id,
            schedule_id: booking.schedule_id,
            member_package_id: booking.member_package_id ?? undefined,
            location_id: schedule?.location_id ?? undefined,
            checkin_method: 'manual',
            check_in_type: 'class',
            check_in_time: new Date().toISOString(),
          });

          // 2) If session-based package, insert ledger entry
          if (booking.member_package_id) {
            const { data: mp } = await supabase
              .from('member_packages')
              .select('sessions_remaining, sessions_used, package_id, packages(sessions)')
              .eq('id', booking.member_package_id)
              .single();

            const pkg = (mp as any)?.packages;
            if (pkg?.sessions && pkg.sessions > 0) {
              const newBalance = Math.max((mp?.sessions_remaining ?? 0) - 1, 0);

              await supabase.from('package_usage_ledger').insert({
                member_package_id: booking.member_package_id,
                delta_sessions: -1,
                balance_after: newBalance,
                usage_type: 'booking',
                reference_type: 'schedule',
                reference_id: booking.schedule_id,
                note: 'Class attendance (batch)',
              });

              await supabase
                .from('member_packages')
                .update({
                  sessions_remaining: newBalance,
                  sessions_used: (mp?.sessions_used ?? 0) + 1,
                })
                .eq('id', booking.member_package_id);
            }
          }
        }
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['class-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['member-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['member-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['package-usage'] });
      queryClient.invalidateQueries({ queryKey: ['member-packages'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['gym-checkins'] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      logActivity({
        event_type: 'attendance_marked',
        activity: `Batch attendance marked as ${variables.status} for ${variables.bookingIds.length} bookings`,
        entity_type: 'class_booking',
      });
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
