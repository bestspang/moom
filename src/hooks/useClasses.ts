import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import i18n from '@/i18n';
import { queryKeys } from '@/lib/queryKeys';
import { logActivity } from '@/lib/activityLogger';
import { startOfWeek, endOfWeek } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

type Class = Tables<'classes'>;
type ClassInsert = TablesInsert<'classes'>;
type ClassUpdate = TablesUpdate<'classes'>;

export const useClasses = (
  status?: string,
  search?: string,
  typeFilter?: string,
  categoryFilter?: string,
  levelFilter?: string,
  page: number = 1,
  perPage: number = 50,
) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.classes(status, search, typeFilter, categoryFilter, levelFilter, page, perPage),
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from('classes')
        .select(`
          *,
          category:class_categories(id, name)
        `, { count: 'exact' });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,name_th.ilike.%${search}%`);
      }

      if (typeFilter) {
        query = query.eq('type', typeFilter as 'class' | 'pt');
      }

      if (categoryFilter) {
        query = query.eq('category_id', categoryFilter);
      }

      if (levelFilter) {
        query = query.eq('level', levelFilter as 'all_levels' | 'beginner' | 'intermediate' | 'advanced');
      }

      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { rows: data, total: count ?? 0 };
    },
  });
};

export const useClassStats = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.classStats(),
    enabled: !!user,
    queryFn: async () => {
      const statuses = ['active', 'drafts', 'archive'] as const;
      const [totalRes, ...statusResults] = await Promise.all([
        supabase.from('classes').select('id', { count: 'exact', head: true }),
        ...statuses.map((s) =>
          supabase.from('classes').select('id', { count: 'exact', head: true }).eq('status', s)
        ),
      ]);

      if (totalRes.error) throw totalRes.error;
      for (const r of statusResults) {
        if (r.error) throw r.error;
      }

      return {
        all: totalRes.count ?? 0,
        active: statusResults[0].count ?? 0,
        drafts: statusResults[1].count ?? 0,
        archive: statusResults[2].count ?? 0,
      };
    },
  });
};

export const useClass = (id: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.classDetail(id),
    enabled: !!user && !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          category:class_categories(id, name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });
};

export const useClassPerformance = (classId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.classPerformance(classId),
    enabled: !!user && !!classId,
    queryFn: async () => {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const weekStartStr = weekStart.toISOString().split('T')[0];
      const weekEndStr = weekEnd.toISOString().split('T')[0];

      const { data: weekSchedules, error: schedErr } = await supabase
        .from('schedule')
        .select('id, capacity')
        .eq('class_id', classId)
        .gte('scheduled_date', weekStartStr)
        .lte('scheduled_date', weekEndStr)
        .neq('status', 'cancelled');

      if (schedErr) throw schedErr;

      const scheduledThisWeek = weekSchedules?.length || 0;
      const weekScheduleIds = weekSchedules?.map((s) => s.id) || [];

      let bookingsThisWeek = 0;
      if (weekScheduleIds.length > 0) {
        const { count, error: bErr } = await supabase
          .from('class_bookings')
          .select('id', { count: 'exact', head: true })
          .in('schedule_id', weekScheduleIds)
          .neq('status', 'cancelled');
        if (bErr) throw bErr;
        bookingsThisWeek = count || 0;
      }

      const { data: allSchedules, error: allSchedErr } = await supabase
        .from('schedule')
        .select('id, capacity')
        .eq('class_id', classId)
        .neq('status', 'cancelled');

      if (allSchedErr) throw allSchedErr;

      let avgCapacity = 0;
      let totalBookings = 0;

      if (allSchedules && allSchedules.length > 0) {
        const allIds = allSchedules.map((s) => s.id);
        const { data: bookings, error: bAllErr } = await supabase
          .from('class_bookings')
          .select('schedule_id')
          .in('schedule_id', allIds)
          .neq('status', 'cancelled');

        if (bAllErr) throw bAllErr;

        totalBookings = bookings?.length || 0;

        const bookingCounts: Record<string, number> = {};
        bookings?.forEach((b) => {
          bookingCounts[b.schedule_id] = (bookingCounts[b.schedule_id] || 0) + 1;
        });

        let totalPct = 0;
        allSchedules.forEach((s) => {
          const booked = bookingCounts[s.id] || 0;
          const cap = s.capacity || 20;
          totalPct += (booked / cap) * 100;
        });
        avgCapacity = Math.round(totalPct / allSchedules.length);
      }

      return {
        scheduledThisWeek,
        bookingsThisWeek,
        avgCapacity,
        totalBookings,
      };
    },
  });
};

export const useCreateClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ClassInsert) => {
      const { data: newClass, error } = await supabase
        .from('classes')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return newClass;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['class-stats'] });
      logActivity({
        event_type: 'class_created',
        activity: `Class "${data.name}" created`,
        entity_type: 'class',
        entity_id: data.id,
        new_value: data as unknown as Record<string, unknown>,
      });
      toast.success(i18n.t('toast.classCreated'));
    },
    onError: (error) => {
      toast.error(i18n.t('toast.classCreateFailed'));
    },
  });
};

export const useUpdateClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data, oldData }: { id: string; data: ClassUpdate; oldData?: Record<string, unknown> }) => {
      const { data: updated, error } = await supabase
        .from('classes')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { updated, oldData };
    },
    onSuccess: ({ updated, oldData }, variables) => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['class-stats'] });
      queryClient.invalidateQueries({ queryKey: ['class-performance'] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      logActivity({
        event_type: 'class_updated',
        activity: `Class "${updated.name}" updated`,
        entity_type: 'class',
        entity_id: variables.id,
        old_value: oldData as Record<string, unknown> | undefined,
        new_value: variables.data as Record<string, unknown>,
      });
      toast.success(i18n.t('toast.classUpdated'));
    },
    onError: (error) => {
      toast.error(i18n.t('toast.classUpdateFailed'));
    },
  });
};

export const useDeleteClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['class-stats'] });
      logActivity({
        event_type: 'class_deleted',
        activity: `Class deleted`,
        entity_type: 'class',
        entity_id: id,
      });
      toast.success(i18n.t('toast.classDeleted'));
    },
    onError: (error) => {
      toast.error(i18n.t('toast.classDeleteFailed'));
    },
  });
};

// ── Bulk mutations ──

export const useBulkUpdateClassStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const { error } = await supabase
        .from('classes')
        .update({ status })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_, { ids, status }) => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['class-stats'] });
      logActivity({
        event_type: 'classes_bulk_status',
        activity: `${ids.length} classes status changed to ${status}`,
        entity_type: 'class',
      });
      toast.success(i18n.t('toast.bulkUpdated', { count: ids.length }));
    },
    onError: () => toast.error(i18n.t('toast.bulkFailed')),
  });
};

export const useBulkDeleteClasses = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('classes').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['class-stats'] });
      logActivity({
        event_type: 'classes_bulk_deleted',
        activity: `${ids.length} classes deleted`,
        entity_type: 'class',
      });
      toast.success(`${ids.length} classes deleted`);
    },
    onError: (e) => toast.error(`Failed: ${(e as Error).message}`),
  });
};

export const useBulkDuplicateClasses = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (classes: Class[]) => {
      const copies = classes.map(({ id, created_at, updated_at, ...rest }) => ({
        ...rest,
        name: `Copy of ${rest.name}`,
        name_th: rest.name_th ? `Copy of ${rest.name_th}` : null,
        status: 'drafts',
      }));
      const { error } = await supabase.from('classes').insert(copies);
      if (error) throw error;
    },
    onSuccess: (_, cls) => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['class-stats'] });
      logActivity({
        event_type: 'classes_bulk_duplicated',
        activity: `${cls.length} classes duplicated`,
        entity_type: 'class',
      });
      toast.success(`${cls.length} classes duplicated`);
    },
    onError: (e) => toast.error(`Failed: ${(e as Error).message}`),
  });
};
