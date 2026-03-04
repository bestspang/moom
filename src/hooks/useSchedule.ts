import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { queryKeys } from '@/lib/queryKeys';
import { logActivity } from '@/lib/activityLogger';

export type ScheduleWithRelations = Tables<'schedule'> & {
  class: Tables<'classes'> | null;
  trainer: Tables<'staff'> | null;
  room: Tables<'rooms'> | null;
  location: Tables<'locations'> | null;
  booked_count?: number;
  attended_count?: number;
};

export interface ScheduleItem {
  id: string;
  time: string;
  className: string;
  trainer: string;
  location: string;
  room: string;
  availability: string;
  checkedIn: number;
  capacity: number;
}

export function mapScheduleToItem(s: ScheduleWithRelations): ScheduleItem {
  return {
    id: s.id,
    time: `${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)}`,
    className: (s.class as any)?.name || 'Unknown',
    trainer: s.trainer ? `${s.trainer.first_name} ${s.trainer.last_name}` : '-',
    location: (s.location as any)?.name || '-',
    room: (s.room as any)?.name || '-',
    availability: `${s.booked_count ?? 0}/${s.capacity || 0}`,
    checkedIn: s.attended_count ?? 0,
    capacity: s.capacity || 0,
  };
}

export type ScheduleStats = {
  classesCount: number;
  ptCount: number;
  avgCapacity: number;
  cancellations: number;
  classesCountDiff: number;
  ptCountDiff: number;
  avgCapacityDiff: number;
  cancellationsDiff: number;
};

export function useScheduleByDate(date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: queryKeys.schedule(dateStr),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule')
        .select(`
          *,
          class:classes(*),
          trainer:staff(*),
          room:rooms(*),
          location:locations(*)
        `)
        .eq('scheduled_date', dateStr)
        .order('start_time', { ascending: true });

      if (error) throw error;

      const schedules = data as ScheduleWithRelations[];
      if (schedules.length === 0) return schedules;

      // Fetch booking counts in a single query
      const scheduleIds = schedules.map(s => s.id);
      const { data: bookings } = await supabase
        .from('class_bookings')
        .select('schedule_id, status')
        .in('schedule_id', scheduleIds)
        .in('status', ['booked', 'attended']);

      // Aggregate counts
      const countMap: Record<string, { booked: number; attended: number }> = {};
      (bookings || []).forEach(b => {
        if (!countMap[b.schedule_id]) countMap[b.schedule_id] = { booked: 0, attended: 0 };
        countMap[b.schedule_id].booked++;
        if (b.status === 'attended') countMap[b.schedule_id].attended++;
      });

      return schedules.map(s => ({
        ...s,
        booked_count: countMap[s.id]?.booked ?? 0,
        attended_count: countMap[s.id]?.attended ?? 0,
      }));
    },
  });
}

export function useScheduleStats(date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const yesterdayStr = format(new Date(date.getTime() - 86400000), 'yyyy-MM-dd');

  return useQuery({
    queryKey: queryKeys.scheduleStats(dateStr),
    queryFn: async () => {
      // Get today's and yesterday's schedules in parallel
      const [todayResult, yesterdayResult] = await Promise.all([
        supabase.from('schedule').select('*, class:classes(type)').eq('scheduled_date', dateStr),
        supabase.from('schedule').select('*, class:classes(type)').eq('scheduled_date', yesterdayStr),
      ]);

      if (todayResult.error) throw todayResult.error;
      if (yesterdayResult.error) throw yesterdayResult.error;

      const todaySchedules = todayResult.data || [];
      const yesterdaySchedules = yesterdayResult.data || [];

      // Fetch real booking counts for both days
      const allIds = [...todaySchedules, ...yesterdaySchedules].map(s => s.id);
      const bookingCounts: Record<string, { booked: number; attended: number }> = {};

      if (allIds.length > 0) {
        const { data: bookings } = await supabase
          .from('class_bookings')
          .select('schedule_id, status')
          .in('schedule_id', allIds)
          .in('status', ['booked', 'attended']);

        (bookings || []).forEach(b => {
          if (!bookingCounts[b.schedule_id]) bookingCounts[b.schedule_id] = { booked: 0, attended: 0 };
          bookingCounts[b.schedule_id].booked++;
          if (b.status === 'attended') bookingCounts[b.schedule_id].attended++;
        });
      }

      // Helper to compute avgCapacity from real booking data
      const computeAvgCapacity = (schedules: typeof todaySchedules) => {
        const scheduled = schedules.filter(s => s.status === 'scheduled' && s.capacity && s.capacity > 0);
        if (scheduled.length === 0) return 0;
        return Math.round(
          scheduled.reduce((sum, s) => {
            const attended = bookingCounts[s.id]?.attended ?? 0;
            return sum + (attended / (s.capacity || 1)) * 100;
          }, 0) / scheduled.length
        );
      };

      // Today's stats
      const classesCount = todaySchedules.filter(s => s.class?.type === 'class').length;
      const ptCount = todaySchedules.filter(s => s.class?.type === 'pt').length;
      const cancellations = todaySchedules.filter(s => s.status === 'cancelled').length;
      const avgCapacity = computeAvgCapacity(todaySchedules);

      // Yesterday's stats for comparison
      const yesterdayClassesCount = yesterdaySchedules.filter(s => s.class?.type === 'class').length;
      const yesterdayPtCount = yesterdaySchedules.filter(s => s.class?.type === 'pt').length;
      const yesterdayCancellations = yesterdaySchedules.filter(s => s.status === 'cancelled').length;
      const yesterdayAvgCapacity = computeAvgCapacity(yesterdaySchedules);

      // Calculate differences
      const classesCountDiff = yesterdayClassesCount > 0
        ? Math.round(((classesCount - yesterdayClassesCount) / yesterdayClassesCount) * 100)
        : classesCount > 0 ? 100 : 0;

      const ptCountDiff = yesterdayPtCount > 0
        ? Math.round(((ptCount - yesterdayPtCount) / yesterdayPtCount) * 100)
        : ptCount > 0 ? 100 : 0;

      const avgCapacityDiff = yesterdayAvgCapacity > 0
        ? avgCapacity - yesterdayAvgCapacity
        : 0;

      const cancellationsDiff = yesterdayCancellations > 0
        ? Math.round(((cancellations - yesterdayCancellations) / yesterdayCancellations) * 100)
        : cancellations > 0 ? 100 : 0;

      return {
        classesCount,
        ptCount,
        avgCapacity,
        cancellations,
        classesCountDiff,
        ptCountDiff,
        avgCapacityDiff,
        cancellationsDiff,
      } as ScheduleStats;
    },
  });
}

export function useTrainers() {
  return useQuery({
    queryKey: queryKeys.trainers(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select(`
          *,
          role:roles(name)
        `)
        .eq('status', 'active');

      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (schedule: TablesInsert<'schedule'>) => {
      const { data, error } = await supabase
        .from('schedule')
        .insert(schedule)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['schedule-stats'] });
      logActivity({
        event_type: 'schedule_created',
        activity: `Schedule created for ${data.scheduled_date}`,
        entity_type: 'schedule',
        entity_id: data.id,
      });
      toast({
        title: 'Success',
        description: 'Class scheduled successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'schedule'> & { id: string }) => {
      const { data, error } = await supabase
        .from('schedule')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['schedule-stats'] });
      logActivity({
        event_type: 'schedule_updated',
        activity: `Schedule updated`,
        entity_type: 'schedule',
        entity_id: variables.id,
        new_value: variables as Record<string, unknown>,
      });
      toast({
        title: 'Success',
        description: 'Schedule updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('schedule')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['schedule-stats'] });
      logActivity({
        event_type: 'schedule_deleted',
        activity: `Schedule deleted`,
        entity_type: 'schedule',
        entity_id: id,
      });
      toast({
        title: 'Success',
        description: 'Schedule deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Error code to i18n key mapping
const scheduleErrorMap: Record<string, string> = {
  room_overlap: 'schedule.error.roomOverlap',
  room_location_mismatch: 'schedule.error.roomLocationMismatch',
  category_mismatch: 'schedule.error.categoryMismatch',
  end_time_before_start: 'schedule.error.endTimeBeforeStart',
  room_not_found: 'schedule.error.roomNotFound',
};

export function useCreateScheduleValidated() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      p_scheduled_date: string;
      p_start_time: string;
      p_end_time: string;
      p_class_id: string;
      p_trainer_id?: string | null;
      p_location_id?: string | null;
      p_room_id?: string | null;
      p_capacity?: number | null;
    }) => {
      const { data, error } = await supabase.rpc('create_schedule_with_validation', {
        p_scheduled_date: params.p_scheduled_date,
        p_start_time: params.p_start_time,
        p_end_time: params.p_end_time,
        p_class_id: params.p_class_id,
        p_trainer_id: params.p_trainer_id ?? null,
        p_location_id: params.p_location_id ?? null,
        p_room_id: params.p_room_id ?? null,
        p_capacity: params.p_capacity ?? null,
      });

      if (error) throw error;

      // The RPC returns JSON — check for validation error
      const result = data as Record<string, unknown>;
      if (result?.error) {
        const errorCode = result.error as string;
        const i18nKey = scheduleErrorMap[errorCode];
        throw new Error(i18nKey || (result.message as string) || 'Validation failed');
      }

      return result;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schedule(variables.p_scheduled_date) });
      queryClient.invalidateQueries({ queryKey: ['schedule-stats'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() });
      logActivity({
        event_type: 'schedule_created',
        activity: `Schedule created for ${variables.p_scheduled_date}`,
        entity_type: 'schedule',
        entity_id: (result as any)?.id,
      });
      toast({
        title: 'Success',
        description: 'Class scheduled successfully',
      });
    },
    onError: (error) => {
      // Only show non-i18n errors here; i18n errors are handled by the caller
      if (!error.message.startsWith('schedule.error.')) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    },
  });
}

export function useCancelSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scheduleId: string) => {
      // 1) Mark schedule as cancelled
      const { error: schedError } = await supabase
        .from('schedule')
        .update({ status: 'cancelled' })
        .eq('id', scheduleId);

      if (schedError) throw schedError;

      // 2) Batch-cancel all booked bookings
      const { error: bookError } = await supabase
        .from('class_bookings')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: 'Class cancelled',
        })
        .eq('schedule_id', scheduleId)
        .eq('status', 'booked');

      if (bookError) throw bookError;

      return scheduleId;
    },
    onSuccess: (scheduleId) => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['schedule-stats'] });
      queryClient.invalidateQueries({ queryKey: ['class-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      logActivity({
        event_type: 'schedule_cancelled',
        activity: 'Schedule cancelled with all bookings',
        entity_type: 'schedule',
        entity_id: scheduleId,
      });
      toast({
        title: 'Success',
        description: 'Class cancelled successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
