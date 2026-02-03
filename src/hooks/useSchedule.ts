import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

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
};

export function useScheduleByDate(date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['schedule', dateStr],
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

  return useQuery({
    queryKey: ['schedule-stats', dateStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule')
        .select(`
          *,
          class:classes(type)
        `)
        .eq('scheduled_date', dateStr);

      if (error) throw error;

      const schedules = data || [];
      const classesCount = schedules.filter(s => s.class?.type === 'class').length;
      const ptCount = schedules.filter(s => s.class?.type === 'pt').length;
      const cancellations = schedules.filter(s => s.status === 'cancelled').length;

      // Calculate average capacity
      const scheduledClasses = schedules.filter(s => s.status === 'scheduled' && s.capacity && s.capacity > 0);
      const avgCapacity = scheduledClasses.length > 0
        ? Math.round(
            scheduledClasses.reduce((sum, s) => sum + ((s.checked_in || 0) / (s.capacity || 1)) * 100, 0) /
              scheduledClasses.length
          )
        : 0;

      return {
        classesCount,
        ptCount,
        avgCapacity,
        cancellations,
      } as ScheduleStats;
    },
  });
}

export function useTrainers() {
  return useQuery({
    queryKey: ['trainers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select(`
          *,
          role:roles(name)
        `)
        .eq('status', 'active');

      if (error) throw error;
      // Filter trainers (role name contains 'trainer' or staff that have assigned classes)
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
