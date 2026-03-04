import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { queryKeys } from '@/lib/queryKeys';

export type ScheduleWithRelations = Tables<'schedule'> & {
  class: Tables<'classes'> | null;
  trainer: Tables<'staff'> | null;
  room: Tables<'rooms'> | null;
  location: Tables<'locations'> | null;
};

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
      return data as ScheduleWithRelations[];
    },
  });
}

export function useScheduleStats(date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const yesterdayStr = format(new Date(date.getTime() - 86400000), 'yyyy-MM-dd');

  return useQuery({
    queryKey: queryKeys.scheduleStats(dateStr),
    queryFn: async () => {
      // Get today's schedule
      const { data: todayData, error: todayError } = await supabase
        .from('schedule')
        .select(`
          *,
          class:classes(type)
        `)
        .eq('scheduled_date', dateStr);

      if (todayError) throw todayError;

      // Get yesterday's schedule for comparison
      const { data: yesterdayData, error: yesterdayError } = await supabase
        .from('schedule')
        .select(`
          *,
          class:classes(type)
        `)
        .eq('scheduled_date', yesterdayStr);

      if (yesterdayError) throw yesterdayError;

      const todaySchedules = todayData || [];
      const yesterdaySchedules = yesterdayData || [];

      // Today's stats
      const classesCount = todaySchedules.filter(s => s.class?.type === 'class').length;
      const ptCount = todaySchedules.filter(s => s.class?.type === 'pt').length;
      const cancellations = todaySchedules.filter(s => s.status === 'cancelled').length;

      // Yesterday's stats for comparison
      const yesterdayClassesCount = yesterdaySchedules.filter(s => s.class?.type === 'class').length;
      const yesterdayPtCount = yesterdaySchedules.filter(s => s.class?.type === 'pt').length;
      const yesterdayCancellations = yesterdaySchedules.filter(s => s.status === 'cancelled').length;

      // Calculate average capacity for today
      const scheduledClasses = todaySchedules.filter(s => s.status === 'scheduled' && s.capacity && s.capacity > 0);
      const avgCapacity = scheduledClasses.length > 0
        ? Math.round(
            scheduledClasses.reduce((sum, s) => sum + ((s.checked_in || 0) / (s.capacity || 1)) * 100, 0) /
              scheduledClasses.length
          )
        : 0;

      // Calculate yesterday's average capacity
      const yesterdayScheduledClasses = yesterdaySchedules.filter(s => s.status === 'scheduled' && s.capacity && s.capacity > 0);
      const yesterdayAvgCapacity = yesterdayScheduledClasses.length > 0
        ? Math.round(
            yesterdayScheduledClasses.reduce((sum, s) => sum + ((s.checked_in || 0) / (s.capacity || 1)) * 100, 0) /
              yesterdayScheduledClasses.length
          )
        : 0;

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['schedule-stats'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['schedule-stats'] });
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
