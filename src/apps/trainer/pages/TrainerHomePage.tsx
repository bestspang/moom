import { useQuery } from '@tanstack/react-query';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { SummaryCard } from '@/apps/shared/components/SummaryCard';
import { ListCard } from '@/apps/shared/components/ListCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Users, Megaphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { CoachImpactCard } from '@/apps/trainer/features/impact/CoachImpactCard';
import { PartnerReputationCard } from '@/apps/trainer/features/impact/PartnerReputationCard';
import { fetchTrainerType } from '@/apps/trainer/features/impact/api';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function TrainerHomePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const firstName = user?.user_metadata?.first_name ?? 'Trainer';
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: trainerType } = useQuery({
    queryKey: ['trainer-type'],
    queryFn: fetchTrainerType,
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });

  const { data: staffId } = useQuery({
    queryKey: ['trainer-staff-id', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('identity_map')
        .select('admin_entity_id')
        .eq('experience_user_id', user!.id)
        .eq('entity_type', 'staff')
        .maybeSingle();
      return data?.admin_entity_id ?? null;
    },
    enabled: !!user,
    staleTime: Infinity,
  });

  const { data: todayClasses, isLoading } = useQuery({
    queryKey: ['trainer-today-classes', today, staffId],
    queryFn: async () => {
      let query = supabase
        .from('schedule')
        .select('id, start_time, end_time, capacity, checked_in, classes(name), rooms(name)')
        .eq('scheduled_date', today)
        .neq('status', 'cancelled');
      if (staffId) query = query.eq('trainer_id', staffId);
      const { data, error } = await query.order('start_time');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: announcements } = useQuery({
    queryKey: ['trainer-announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('id, message, publish_date')
        .eq('status', 'active')
        .order('publish_date', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const totalBookings = todayClasses?.reduce((sum, c) => sum + (c.checked_in ?? 0), 0) ?? 0;

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <MobilePageHeader title={`Hi, ${firstName}`} subtitle={t('trainer.todaysOverview')} />

      <Section className="mb-4">
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard label={t('trainer.todaysClasses')} value={String(todayClasses?.length ?? 0)} icon={<Calendar className="h-5 w-5" />} />
          <SummaryCard label={t('trainer.totalBookings')} value={String(totalBookings)} subtitle={t('trainer.acrossToday')} icon={<Users className="h-5 w-5" />} />
        </div>
      </Section>

      <Section className="mb-4">
        {(trainerType ?? 'in_house') === 'in_house' ? <CoachImpactCard /> : <PartnerReputationCard />}
      </Section>

      <Section title={t('trainer.todaysSchedule')} className="mb-4">
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
        ) : !todayClasses?.length ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">{t('trainer.noClassesToday')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayClasses.map((cls: any) => (
              <ListCard
                key={cls.id}
                title={cls.classes?.name ?? 'Class'}
                subtitle={`${cls.start_time?.slice(0, 5)} – ${cls.end_time?.slice(0, 5)}${cls.rooms?.name ? ` · ${cls.rooms.name}` : ''}`}
                meta={`${cls.checked_in ?? 0}/${cls.capacity ?? 0} ${t('trainer.checkedIn')}`}
              />
            ))}
          </div>
        )}
      </Section>

      {announcements && announcements.length > 0 && (
        <Section title={t('trainer.announcements')}>
          <div className="space-y-2">
            {announcements.map(a => (
              <ListCard
                key={a.id}
                title={a.message}
                subtitle={a.publish_date ? format(new Date(a.publish_date), 'd MMM') : undefined}
                leading={<Megaphone className="h-4 w-4 text-muted-foreground" />}
                showChevron={false}
              />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
